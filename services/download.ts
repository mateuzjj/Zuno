
import JSZip from 'jszip';
import { api } from './api';
import { Track } from '../types';

interface AlbumInfo {
    title: string;
    artist: string;
    coverUrl: string;
}

export const downloadAlbumAsZip = async (album: AlbumInfo, tracks: Track[], onProgress?: (percent: number, currentItem: string) => void): Promise<void> => {
    try {
        const zip = new JSZip();
        // Create a folder inside the zip
        const safeTitle = album.title.replace(/[^a-z0-9]/gi, '_');
        const safeArtist = album.artist.replace(/[^a-z0-9]/gi, '_');
        const folderName = `${safeArtist} - ${safeTitle}`;
        const folder = zip.folder(folderName);

        if (!folder) throw new Error("Failed to create folder in zip");

        // Helper to fetch blob
        const fetchBlob = async (url: string) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${url}`);
                return response.blob();
            } catch (e) {
                console.warn(`Failed to fetch blob from ${url}`, e);
                return null;
            }
        }

        // 1. Add Cover
        if (album.coverUrl) {
            const coverBlob = await fetchBlob(album.coverUrl);
            if (coverBlob) {
                folder.file("cover.jpg", coverBlob);
            }
        }

        // 2. Add Tracks
        let completed = 0;
        const total = tracks.length + 1; // +1 for zip generation

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const trackNum = i + 1;
            const fileName = `${trackNum.toString().padStart(2, '0')} - ${track.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;

            if (onProgress) onProgress(Math.round((completed / total) * 100), `Downloading ${track.title}...`);

            try {
                // Get the real stream URL using the API
                const streamUrl = await api.getStreamUrl(track.id);

                // Fetch the audio data
                const audioBlob = await fetchBlob(streamUrl);

                if (audioBlob) {
                    folder.file(fileName, audioBlob);
                } else {
                    folder.file(fileName + ".error.txt", "Failed to download audio blob");
                }
            } catch (e) {
                console.error(`Failed to process track ${track.title}`, e);
                folder.file(fileName + ".error.txt", `Failed to process: ${e}`);
            }

            completed++;
        }

        // 3. Generate ZIP
        if (onProgress) onProgress(90, "Compressing...");

        const content = await zip.generateAsync({ type: "blob" });

        // 4. Trigger Download
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (onProgress) onProgress(100, "Done!");

    } catch (error) {
        console.error("Download failed", error);
        throw error;
    }
}
