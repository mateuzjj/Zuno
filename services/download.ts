
import JSZip from 'jszip';
import { api } from './api';
import { toast } from '../components/UI/Toast';
import { Track } from '../types';
import { getDB } from './db';

export const DownloadService = {
    /**
     * Saves a track to IndexedDB for offline playback (works on Android/iOS browsers)
     */
    saveTrackToBrowser: async (track: Track): Promise<boolean> => {
        const toastId = toast.show(`Salvando ${track.title} no navegador...`, 'loading');

        try {
            // Check if already downloaded
            const db = await getDB();
            const existing = await db.get('downloadedTracks', track.id);
            if (existing) {
                toast.show(`${track.title} já está salva!`, 'info');
                return true;
            }

            // 1. Get Stream URL
            const streamUrl = await api.getStreamUrl(track.id);

            // 2. Fetch Audio Blob
            const response = await fetch(streamUrl);
            if (!response.ok) throw new Error('Failed to fetch audio stream');
            const audioBlob = await response.blob();
            const fileSize = audioBlob.size;

            // 3. Fetch Cover (optional)
            let coverBlob: Blob | undefined;
            try {
                if (track.coverUrl) {
                    const coverResp = await fetch(track.coverUrl);
                    if (coverResp.ok) {
                        coverBlob = await coverResp.blob();
                    }
                }
            } catch (e) {
                console.warn('Could not fetch cover');
            }

            // 4. Save to IndexedDB
            await db.put('downloadedTracks', {
                track: {
                    ...track,
                    // Create a blob URL for playback
                    streamUrl: '', // Will be generated on demand
                },
                audioBlob,
                coverBlob,
                downloadedAt: Date.now(),
                fileSize,
            });

            toast.show(`✅ ${track.title} salva com sucesso!`, 'success');
            return true;
        } catch (error: any) {
            console.error('Save to browser failed', error);
            toast.show(`Erro ao salvar: ${error.message}`, 'error');
            return false;
        }
    },

    /**
     * Gets a blob URL for a downloaded track
     */
    getDownloadedTrackUrl: async (trackId: string): Promise<string | null> => {
        try {
            const db = await getDB();
            const downloaded = await db.get('downloadedTracks', trackId);
            if (!downloaded) return null;

            // Create blob URL from stored blob
            return URL.createObjectURL(downloaded.audioBlob);
        } catch (error) {
            console.error('Error getting downloaded track URL', error);
            return null;
        }
    },

    /**
     * Gets a blob URL for a downloaded track's cover
     */
    getDownloadedTrackCoverUrl: async (trackId: string): Promise<string | null> => {
        try {
            const db = await getDB();
            const downloaded = await db.get('downloadedTracks', trackId);
            if (!downloaded || !downloaded.coverBlob) return null;

            return URL.createObjectURL(downloaded.coverBlob);
        } catch (error) {
            console.error('Error getting downloaded cover URL', error);
            return null;
        }
    },

    /**
     * Checks if a track is downloaded
     */
    isTrackDownloaded: async (trackId: string): Promise<boolean> => {
        try {
            const db = await getDB();
            const downloaded = await db.get('downloadedTracks', trackId);
            return !!downloaded;
        } catch (error) {
            return false;
        }
    },

    /**
     * Gets all downloaded tracks
     */
    getDownloadedTracks: async (): Promise<Track[]> => {
        try {
            const db = await getDB();
            const all = await db.getAll('downloadedTracks');
            return all.map(item => item.track);
        } catch (error) {
            console.error('Error getting downloaded tracks', error);
            return [];
        }
    },

    /**
     * Deletes a downloaded track
     */
    deleteDownloadedTrack: async (trackId: string): Promise<boolean> => {
        try {
            const db = await getDB();
            await db.delete('downloadedTracks', trackId);
            toast.show('Música removida', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting downloaded track', error);
            toast.show('Erro ao remover música', 'error');
            return false;
        }
    },

    /**
     * Gets storage usage information
     */
    getStorageInfo: async (): Promise<{ count: number; totalSize: number }> => {
        try {
            const db = await getDB();
            const all = await db.getAll('downloadedTracks');
            const totalSize = all.reduce((sum, item) => sum + (item.fileSize || 0), 0);
            return {
                count: all.length,
                totalSize,
            };
        } catch (error) {
            console.error('Error getting storage info', error);
            return { count: 0, totalSize: 0 };
        }
    },

    /**
     * Downloads a single track as a ZIP containing audio and metadata (traditional download).
     * For mobile, use saveTrackToBrowser instead.
     */
    downloadTrack: async (track: Track, saveToBrowser: boolean = false) => {
        // If saveToBrowser is true or on mobile, use browser storage
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (saveToBrowser || isMobile) {
            return await DownloadService.saveTrackToBrowser(track);
        }

        // Traditional ZIP download for desktop
        const toastId = toast.show(`Starting download: ${track.title}...`, 'loading');

        try {
            // 1. Get Stream URL
            const streamUrl = await api.getStreamUrl(track.id);

            // 2. Fetch Audio Blob
            // Note: In a real browser environment, CORS might be an issue with some APIs.
            // We assume the API proxy handles this or we are in a permissive env.
            const response = await fetch(streamUrl);
            if (!response.ok) throw new Error('Failed to fetch audio stream');
            const audioBlob = await response.blob();

            // 3. Prepare Metadata
            const metadata = {
                title: track.title,
                artist: track.artist,
                album: track.album,
                id: track.id,
                downloadDate: new Date().toISOString()
            };

            // 4. Create ZIP
            let zip;
            try {
                zip = new JSZip();
            } catch (e) {
                // Fallback for ESM/CommonJS mismatch
                if ((JSZip as any).default) {
                    zip = new (JSZip as any).default();
                } else {
                    throw e;
                }
            }
            const safeTitle = track.title.replace(/[^a-z0-9]/gi, '_');

            zip.file(`${safeTitle}.mp3`, audioBlob); // Assuming MP3 for simplicity, realistically could be FLAC/AAC
            zip.file(`${safeTitle}.json`, JSON.stringify(metadata, null, 2));

            // Try to add cover
            try {
                if (track.coverUrl) {
                    const coverResp = await fetch(track.coverUrl);
                    if (coverResp.ok) {
                        const coverBlob = await coverResp.blob();
                        zip.file('cover.jpg', coverBlob);
                    }
                }
            } catch (e) {
                console.warn('Could not fetch cover for zip');
            }

            // 5. Generate and Downlod
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeTitle}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.show(`Downloaded ${track.title}`, 'success');

        } catch (error: any) {
            console.error('Download failed', error);
            toast.show(`Download failed: ${error.message}`, 'error');
        }
    },

    /**
     * Downloads an entire album as a ZIP folder.
     */
    downloadAlbum: async (albumTitle: string, tracks: Track[]) => {
        if (tracks.length === 0) return;

        const toastId = toast.show(`Preparing album: ${albumTitle} (${tracks.length} tracks)...`, 'loading');

        try {
            let zip;
            try {
                zip = new JSZip();
            } catch (e) {
                if ((JSZip as any).default) {
                    zip = new (JSZip as any).default();
                } else {
                    throw e;
                }
            }
            const albumFolder = zip.folder(albumTitle.replace(/[^a-z0-9]/gi, '_'));

            if (!albumFolder) throw new Error("Failed to create zip folder");

            let completed = 0;

            // Process sequentially to avoid rate limits
            for (const track of tracks) {
                try {
                    // Update toast occasionally
                    if (completed % 2 === 0) {
                        // We can't easily update the existing toast text in this simple implementation, 
                        // but we could send a new one or just rely on the loading state.
                    }

                    const streamUrl = await api.getStreamUrl(track.id);
                    const response = await fetch(streamUrl);
                    if (!response.ok) continue; // Skip failed tracks but continue album

                    const audioBlob = await response.blob();
                    const safeTitle = track.title.replace(/[^a-z0-9]/gi, '_');

                    albumFolder.file(`${safeTitle}.mp3`, audioBlob);

                    // Metadata
                    albumFolder.file(`${safeTitle}.json`, JSON.stringify({
                        ...track,
                        downloadedFrom: 'Zuno'
                    }, null, 2));

                    completed++;
                } catch (e) {
                    console.warn(`Failed to download ${track.title}`, e);
                }
            }

            if (completed === 0) {
                throw new Error("No tracks could be downloaded");
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${albumTitle}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.show(`Downloaded album ${albumTitle}`, 'success');

        } catch (error: any) {
            console.error('Album download failed', error);
            toast.show(`Album download failed: ${error.message}`, 'error');
        }
    }
};
