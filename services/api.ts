import { MOCK_ALBUMS, MOCK_PLAYLISTS, MOCK_TRACKS } from "../constants";
import { Album, Playlist, Track } from "../types";

// API Instances provided in reference
// Prioritize know working instances
const API_INSTANCES = [
  "https://wolf.qqdl.site",
  "https://tidal-api.binimum.org",
  "https://triton.squid.wtf",
  "https://maus.qqdl.site",
  "https://vogel.qqdl.site",
  "https://katze.qqdl.site",
  "https://hund.qqdl.site",
  "https://tidal.kinoplus.online"
];

const RATE_LIMIT_ERROR_MESSAGE = 'Too Many Requests. Please wait a moment and try again.';

// Helper to delay retry
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch with retry across instances (Load Balancing & Failover)
async function fetchWithRetry(relativePath: string, options: RequestInit = {}): Promise<Response> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  // Try preferred instances first, then shuffle the rest
  const preferred = API_INSTANCES.slice(0, 2);
  const others = API_INSTANCES.slice(2).sort(() => Math.random() - 0.5);
  const sortedInstances = [...preferred, ...others];

  for (const baseUrl of sortedInstances) {
    const url = baseUrl.endsWith('/')
      ? `${baseUrl}${relativePath.startsWith('/') ? relativePath.substring(1) : relativePath}`
      : `${baseUrl}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (response.status === 429) {
          throw new Error(RATE_LIMIT_ERROR_MESSAGE);
        }

        if (response.ok) {
          return response;
        }

        if (response.status >= 500 && attempt < maxRetries) {
          await delay(200 * attempt);
          continue;
        }

        // If 4xx error (not 429), it might be a real error (not found), so we might not want to retry
        if (response.status >= 400 && response.status < 500) {
          // However, sometimes instances return 404 if they are broken, so we try a few times across instances
          throw new Error(`Request failed with status ${response.status}`);
        }

        lastError = new Error(`Request failed with status ${response.status}`);
        break; // Break inner loop to try next instance
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          await delay(200 * attempt);
        }
      }
    }
  }
  throw lastError || new Error(`All API instances failed for: ${relativePath}`);
}

// Helper to extract stream URL from manifest (Reference Logic)
function extractStreamUrlFromManifest(manifest: string): string | null {
  try {
    const decoded = atob(manifest);
    try {
      const parsed = JSON.parse(decoded);
      if (parsed?.urls?.[0]) {
        return parsed.urls[0];
      }
    } catch {
      // If not JSON, try regex extraction
      const match = decoded.match(/https?:\/\/[\w\-.~:?#[@!$&'()*+,;=%/]+/);
      return match ? match[0] : null;
    }
    return null;
  } catch (error) {
    console.error('Failed to decode manifest:', error);
    return null;
  }
}

// Helper to build cover URL (Reference Logic)
function getCoverUrl(id: string | undefined, size = '640'): string {
  if (!id) {
    return `https://picsum.photos/seed/${Math.random()}/${size}`;
  }
  // Tidal resources use path structure with slashes
  const formattedId = id.replace(/-/g, '/');
  return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
}

// Mapper: Converts Raw API Track to ZUNO Track
function mapApiTrackToTrack(item: any): Track {
  const albumCover = item.album?.cover || item.cover || '';
  return {
    id: item.id?.toString(),
    title: item.title,
    artist: item.artist?.name || 'Unknown Artist',
    album: item.album?.title || 'Unknown Album',
    coverUrl: getCoverUrl(albumCover, '320'),
    duration: item.duration,
    streamUrl: '' // Fetched on demand via getStreamUrl
  };
}

export const api = {
  // Mocked Home Data (since we don't have user history on the backend yet)
  getFeatured: async (): Promise<{ albums: Album[], playlists: Playlist[], recent: Track[] }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          albums: MOCK_ALBUMS,
          playlists: MOCK_PLAYLISTS,
          recent: MOCK_TRACKS.slice(0, 3)
        });
      }, 300);
    });
  },

  // Real Search Implementation
  search: async (query: string): Promise<Track[]> => {
    try {
      const response = await fetchWithRetry(`/search/?s=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();

      let items: any[] = [];

      // Handle various response structures
      if (data.data?.items) {
        // v2 structure (wolf, binimum)
        items = data.data.items;
      } else if (data.tracks?.items) {
        items = data.tracks.items;
      } else if (data.data?.tracks?.items) {
        items = data.data.tracks.items;
      } else if (Array.isArray(data)) {
        items = data;
      }

      return items.map((t: any) => mapApiTrackToTrack(t));

    } catch (error) {
      console.warn("API Search failed", error);
      return [];
    }
  },

  // Real Stream URL Extraction
  getStreamUrl: async (trackId: string): Promise<string> => {
    try {
      // Try High Quality first, fallback logic could be added
      const quality = 'HIGH';
      const response = await fetchWithRetry(`/track/?id=${trackId}&quality=${quality}`);
      const jsonResponse = await response.json();

      const data = jsonResponse.data || jsonResponse;

      // 1. Check for direct URL
      if (data.OriginalTrackUrl) return data.OriginalTrackUrl;

      // 2. Check for Manifest
      if (data.manifest) {
        const url = extractStreamUrlFromManifest(data.manifest);
        if (url) return url;
      }

      // 3. Check for specific audioQuality info
      if (data.audioQuality === 'HI_RES' || data.audioQuality === 'LOSSLESS') {
        // Sometimes manifest needs different handling for HiRes, but the extractor above covers most.
      }

      throw new Error('No stream URL found in response');

    } catch (error) {
      console.error("Failed to fetch stream URL", error);

      // Fallback for the hardcoded Mock Tracks (t1, t2, t3...) 
      // so the demo still works if API fails or for initial items
      const mockTrack = MOCK_TRACKS.find(t => t.id === trackId);
      if (mockTrack) return mockTrack.streamUrl!;

      throw error;
    }
  },

  getCoverUrl
};