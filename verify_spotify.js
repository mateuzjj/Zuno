
import https from 'https';

const endpoints = [
    'https://accounts.spotify.com/authorize',
    'https://api.spotify.com/v1',
    'https://api.spotify.com/v1/search?q=test&type=track'
];

async function checkEndpoint(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            console.log(`[PASS] ${url} responded with status: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (e) => {
            console.error(`[FAIL] ${url} failed: ${e.message}`);
            resolve(false);
        });
    });
}

(async () => {
    console.log("Verifying Spotify API reachability...");
    for (const url of endpoints) {
        await checkEndpoint(url);
    }
    console.log("Done.");
})();
