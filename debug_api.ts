
import { api } from './services/api';

(async () => {
    console.log("Testing API Search Results...");

    const queries = ['Top Global', 'Viral Hits', 'New Releases', 'Drake', 'Queen'];

    for (const q of queries) {
        console.log(`\nSearching for: "${q}"`);
        try {
            const results = await api.search(q);
            console.log(`Found ${results.length} tracks.`);
            if (results.length > 0) {
                console.log("Top 3 results:");
                results.slice(0, 3).forEach(t => console.log(`- ${t.title} by ${t.artist}`));
            } else {
                console.log("No results.");
            }
        } catch (e) {
            console.error("Search failed:", e.message);
        }
    }
})();
