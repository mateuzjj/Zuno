
import { ZunoAPI } from './services/zunoApi';

// Mock localStorage
const mockStorage = {
    'zuno_history': JSON.stringify([
        { id: '1', title: 'Starboy', artist: 'The Weeknd' },
        { id: '2', title: 'I Feel It Coming', artist: 'The Weeknd' },
        { id: '3', title: 'One Dance', artist: 'Drake' }
    ])
};

global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => mockStorage[key] = val
};

// Mock fetch for API.search calls
global.fetch = async (url) => {
    return {
        ok: true,
        json: async () => ({
            data: [
                { id: '10', title: 'Blinding Lights', artist: { name: 'The Weeknd' } },
                { id: '11', title: 'Save Your Tears', artist: { name: 'The Weeknd' } }
            ]
        })
    };
};

(async () => {
    console.log("Testing Personalization Strategies...");

    // Test Strategy 1 (Mix)
    const mix = await ZunoAPI.getNextFeedSection(0);
    console.log(`[Strategy 1] Title: "${mix.title}" | Subtitle: "${mix.subtitle}"`);
    console.log(`Tracks: ${mix.tracks.length}`);

    // Test Strategy 2 (Jump Back In)
    const jump = await ZunoAPI.getNextFeedSection(1);
    console.log(`[Strategy 2] Title: "${jump.title}" | Subtitle: "${jump.subtitle}"`);

    // Test Fallback (New User)
    mockStorage['zuno_history'] = '[]';
    const fallback = await ZunoAPI.getNextFeedSection(0);
    console.log(`[Fallback] Title: "${fallback.title}"`);

})();
