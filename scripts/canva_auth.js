import crypto from 'crypto';
import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Script starting...');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});


// Configuration – require env vars, never hardcode secrets
const CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing required environment variables: CANVA_CLIENT_ID and CANVA_CLIENT_SECRET');
    console.error('Set them before running this script:');
    console.error('  export CANVA_CLIENT_ID=your_client_id');
    console.error('  export CANVA_CLIENT_SECRET=your_client_secret');
    process.exit(1);
}
const REDIRECT_URI = 'http://127.0.0.1:8080';

const SCOPES = [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'brandtemplate:meta:read',
    'brandtemplate:content:read',
    'profile:read',
    'folder:read',
    'folder:write',
    'asset:read',
    'asset:write'
].join(' ');

// Paths
const TOKEN_PATH = path.join(__dirname, 'canva_tokens.json');

// Helper functions for PKCE
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

const codeVerifier = base64URLEncode(crypto.randomBytes(32));
const codeChallenge = base64URLEncode(sha256(codeVerifier));
const state = base64URLEncode(crypto.randomBytes(32));

// Persist codeVerifier to disk immediately
fs.writeFileSync('pkce_verifier.txt', codeVerifier);
console.log('PKCE Code Verifier saved to pkce_verifier.txt');

// Create server to handle callback
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/callback') {
        const { code, state: returnedState, error, error_description } = parsedUrl.query;

        if (error) {
            res.writeHead(400);
            res.end(`Authorization failed: ${error} - ${error_description}`);
            console.error('Authorization error:', error, error_description);
            server.close();
            return;
        }

        if (returnedState !== state) {
            res.writeHead(400);
            res.end('State mismatch! Potential CSRF attack.');
            return;
        }

        if (code) {
            res.writeHead(200);
            res.end('Authorization successful! You can close this window.');
            server.close();

            console.log('Authorization code received.');

            try {
                await exchangeCodeForToken(code);
            } catch (error) {
                console.error('Exchange failed:', error);
            }

        } else {
            res.writeHead(400);
            res.end('Authorization failed.');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('Address 127.0.0.1:8080 in use. Please check if another process is running.');
        process.exit(1);
    } else {
        console.error('Server error:', e);
        process.exit(1);
    }
});

server.listen(8080, () => {
    // Generate Auth URL
    const authUrl = `https://www.canva.com/api/oauth/authorize?` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=s256&` +
        `scope=${encodeURIComponent(SCOPES)}&` +
        `response_type=code&` +
        `client_id=${CLIENT_ID}&` +
        `state=${state}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    console.log('Please open the following URL in your browser to authorize:');
    console.log(authUrl);
    fs.writeFileSync('auth_url.txt', authUrl);

    // Attempt to open browser automatically
    const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
    exec(`${start} "${authUrl}"`);
});

async function exchangeCodeForToken(code) {
    const tokenUrl = 'https://api.canva.com/rest/v1/oauth/token';
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    // Try to load verifier from file first, fallback to in-memory (though in-memory might be stale if restarted)
    let currentVerifier = codeVerifier;
    try {
        if (fs.existsSync('pkce_verifier.txt')) {
            currentVerifier = fs.readFileSync('pkce_verifier.txt', 'utf8').trim();
            console.log('Loaded PKCE verifier from file.');
        }
    } catch (e) {
        console.warn('Could not read pkce_verifier.txt, using in-memory verifier.');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code_verifier', currentVerifier);
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Access Token retrieved successfully!');
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2));
            console.log(`Tokens saved to ${TOKEN_PATH}`);
            process.exit(0);
        } else {
            console.error('Error exchanging code for token:', data);
            process.exit(1);
        }
    } catch (error) {
        console.error('Request failed:', error);
        process.exit(1);
    }
}
