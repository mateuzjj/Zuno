import {
    getTracksByContext,
    getCollaborativeRecommendations,
    calculateUserVector,
    rankTracks
} from './recommendationEngine';
import { api } from './api';
import { Track } from '../types';

type ContextType = 'Morning' | 'Focus' | 'Workout' | 'Party' | 'Chill' | 'Rainy';

// Simple local context detection (no AI needed)
const detectContextFromKeywords = (input: string): ContextType => {
    const lower = input.toLowerCase();

    if (lower.match(/treino|gym|workout|exercise|run|energia/)) return 'Workout';
    if (lower.match(/foco|study|work|concentrate|deep/)) return 'Focus';
    if (lower.match(/festa|party|dance|badalar|club/)) return 'Party';
    if (lower.match(/manhã|morning|café|wake/)) return 'Morning';
    if (lower.match(/chuva|rain|sad|melancholy/)) return 'Rainy';

    return 'Chill'; // Default
};

export const ZunoAPI = {
    detectContext: async (input: string): Promise<ContextType> => {
        // Legacy support only - defaults to 'Chill'
        return 'Chill';
    },

    /**
     * Performs a Smart Search:
     * 1. Searches the Catalog (Real Data)
     * 2. Returns results ranked by user profile
     */
    searchHybrid: async (query: string) => {
        // 1. Catalog Search
        const catalogResults = await api.search(query);

        // Save to history
        ZunoAPI.saveSearch(query);

        // 2. Personalization: Rank by user taste
        const userProfile = await ZunoAPI.getUserProfile();
        const safeRank = (tracks: Track[], profile: any) => {
            return (typeof rankTracks === 'function') ? rankTracks(tracks, profile) : tracks;
        };

        const rankedCatalog = safeRank(catalogResults, userProfile);

        return {
            context: 'Chill' as ContextType,
            intent: 'general',
            analysis: { context: 'Chill', intent: 'general', similarEntities: [], vibeParams: {} },
            catalogResults: rankedCatalog,
            similarResults: [],
            aiResults: []
        };
    },

    getRecommendations: async (context: ContextType): Promise<Track[]> => {
        // Deprecated: Just returns personalized tracks
        const history = ZunoAPI.getValidHistory();
        if (history.length > 0) {
            return await getCollaborativeRecommendations(history[0].id);
        }
        return await api.search('trending');
    },

    /**
     * Generates PERSONALIZED Home Feed Sections.
     * No more generic 'Workout' or 'Rainy' playlists.
     */
    getNextFeedSection: async (offset: number, excludeIds: string[] = []) => {
        // Helper to mix and clean tracks
        const processTracks = async (rawTracks: Track[]) => {
            const unique = rawTracks.filter(t => !excludeIds.includes(t.id));
            const profile = await ZunoAPI.getUserProfile();
            const ranked = (typeof rankTracks === 'function') ? rankTracks(unique, profile) : unique;
            return ranked.length > 0 ? ranked : unique;
        };

        let section: { title: string, subtitle: string, tracks: Track[] };

        try {
            // STRATEGY 1: "Made For You" (Based on User's Top Artists)
            // Occurs frequently
            if (offset % 3 === 0) {
                const history = ZunoAPI.getValidHistory();
                if (history.length > 0) {
                    // Get most frequented artist
                    const artistCounts: Record<string, number> = {};
                    history.forEach(t => {
                        const artist = t.artist;
                        artistCounts[artist] = (artistCounts[artist] || 0) + 1;
                    });

                    // Get a random top artist (not always #1 to vary the feed)
                    const topArtists = Object.entries(artistCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(e => e[0]);

                    if (topArtists.length > 0) {
                        const selectedArtist = topArtists[Math.floor(Math.random() * topArtists.length)];

                        // 1. Get tracks by the main artist
                        const mainTracks = await api.search(selectedArtist);

                        // 2. Get "Similar Artists" to create a real mix
                        // We use the collaborative engine to find a "seed" track's similar tracks
                        const seedTrack = history.find(t => t.artist === selectedArtist) || history[0];
                        const similarTracks = await getCollaborativeRecommendations(seedTrack.id);

                        // 3. Mix them: 40% Main Artist, 60% Discovery/Similar
                        const combined = [...mainTracks.slice(0, 5), ...similarTracks];
                        const processed = await processTracks(combined);

                        return {
                            title: `Mix de ${selectedArtist}`,
                            subtitle: `Com ${selectedArtist} e similares`,
                            tracks: processed.slice(0, 15)
                        };
                    }
                }
            }

            // STRATEGY 2: "Jump Back In" (Based on LAST played Song)
            if (offset % 3 === 1) {
                const history = ZunoAPI.getValidHistory();
                if (history.length > 0) {
                    const lastTrack = history[0];
                    const recs = await getCollaborativeRecommendations(lastTrack.id);
                    const processed = await processTracks(recs);

                    return {
                        title: `Porque você ouviu ${lastTrack.artist}`,
                        subtitle: `${lastTrack.title} e similares`,
                        tracks: processed.slice(0, 15)
                    };
                }
            }

            // STRATEGY 3: "Daily Discovery" (Deep Dive based on taste profile)
            // Uses profile vector to find new stuff
            if (offset % 3 === 2) {
                const profile = await ZunoAPI.getUserProfile();
                // Determine vibe from profile
                let query = 'hits';
                if (profile.energy > 0.7) query = 'club hits';
                else if (profile.energy < 0.4) query = 'chill relaxing';
                else if (profile.valence > 0.7) query = 'happy pop';
                else query = 'trending music';

                const results = await api.search(query);
                const processed = await processTracks(results);

                return {
                    title: 'Descobertas da Semana',
                    subtitle: 'Sugestões novas para seu perfil',
                    tracks: processed.slice(0, 15)
                };
            }

            // FALLBACK if no history (New User)
            // Enhanced variety for new users
            const queries = [
                'Top 50 Global', 'Viral Hits', 'New Music Friday',
                'Rock Classics', 'Jazz Vibes', 'Lo-Fi Beats',
                'Electronic Essentials', 'Hip Hop Heavyweights',
                'Indie Discoveries', 'Latin Hits', 'K-Pop Risers',
                'Piano Ballads', 'Movie Soundtracks', 'Acoustic Covers'
            ];

            // Random selection to ensure variety every time
            const q = queries[Math.floor(Math.random() * queries.length)];

            const res = await api.search(q);

            // Ensure we don't just show the same 5 artists if the API returns them
            // Shuffle and filter duplicates by artist in the fallback
            const seenArtists = new Set();
            const diverseTracks = res.filter(t => {
                if (seenArtists.has(t.artist)) return false;
                seenArtists.add(t.artist);
                return true;
            });

            return {
                title: q,
                subtitle: 'Explorar Gêneros',
                tracks: diverseTracks.length > 5 ? diverseTracks.slice(0, 15) : res.slice(0, 15)
            };

        } catch (error) {
            console.error('Feed generation error:', error);
            // Minimal fallback
            const fallback = await api.search('mix');
            return {
                title: 'Explorar',
                subtitle: 'Música Variada',
                tracks: fallback.slice(0, 15)
            };
        }
    },

    getSimilarTracks: async (trackId: string): Promise<Track[]> => {
        return await getCollaborativeRecommendations(trackId);
    },

    getTrackInsight: async (track: Track, context: ContextType): Promise<string> => {
        return "Tocando agora";
    },

    /**
     * Records a play in history.
     */
    recordPlay: (track: Track, secondsPlayed: number) => {
        if (secondsPlayed < 10) return; // Lower threshold to learn faster

        const history = JSON.parse(localStorage.getItem('zuno_history') || '[]');
        const newHistory = [track, ...history.filter((t: Track) => t.id !== track.id)].slice(0, 50);
        localStorage.setItem('zuno_history', JSON.stringify(newHistory));
    },

    saveSearch: (query: string) => {
        if (!query || query.length < 3) return;
        const history = JSON.parse(localStorage.getItem('zuno_search_history') || '[]');
        const newHistory = [query, ...history.filter((q: string) => q.toLowerCase() !== query.toLowerCase())].slice(0, 20);
        localStorage.setItem('zuno_search_history', JSON.stringify(newHistory));
    },

    getRecentSearches: (): string[] => {
        return JSON.parse(localStorage.getItem('zuno_search_history') || '[]');
    },

    getValidHistory: (): Track[] => {
        return JSON.parse(localStorage.getItem('zuno_history') || '[]');
    },

    getUserProfile: async () => {
        const history = JSON.parse(localStorage.getItem('zuno_history') || '[]');
        if (typeof calculateUserVector === 'function') {
            return calculateUserVector(history);
        }
        return { energy: 0.5, valence: 0.5 };
    },

    // New Search Passthroughs
    searchArtists: (query: string) => api.searchArtists(query),
    getArtist: (id: string) => api.getArtist(id),
    getAlbum: (id: string) => api.getAlbum(id)
};
