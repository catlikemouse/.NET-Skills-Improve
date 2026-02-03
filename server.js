const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8000;
const RESOURCE_DIR = path.join(__dirname, 'Resource');
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB limit

// Ensure Resource directory exists
if (!fs.existsSync(RESOURCE_DIR)) {
    fs.mkdirSync(RESOURCE_DIR);
}

// Allowed file extensions for saving
const ALLOWED_EXTENSIONS = ['.json'];

// MIME types for static file serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

/**
 * Validate filename for security
 * @param {string} filename - Filename to validate
 * @returns {boolean} Whether filename is valid
 */
function isValidFilename(filename) {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return false;
    }

    // Check for valid extension
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return false;
    }

    // Check for hidden files or special characters
    if (filename.startsWith('.') || /[<>:"|?*]/.test(filename)) {
        return false;
    }

    return true;
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: Save File
    if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        let bodySize = 0;

        req.on('data', chunk => {
            bodySize += chunk.length;

            // Check body size limit
            if (bodySize > MAX_BODY_SIZE) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload too large. Maximum size is 5MB.' }));
                req.destroy();
                return;
            }

            body += chunk;
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const filename = data.filename || 'db_index.json';
                const content = data.content;

                // Security validation
                if (!isValidFilename(filename)) {
                    throw new Error("Invalid filename. Only .json files are allowed.");
                }

                // Resolve path safely
                const filePath = path.resolve(RESOURCE_DIR, filename);

                // Ensure resolved path is still within RESOURCE_DIR
                if (!filePath.startsWith(RESOURCE_DIR)) {
                    throw new Error("Access denied. Path traversal detected.");
                }

                fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');

                console.log(`[*] Saved: ${filename}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', path: filePath }));
            } catch (e) {
                console.error(`[!] Save Error: ${e.message}`);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });

        req.on('error', (e) => {
            console.error(`[!] Request Error: ${e.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        });

        return;
    }

    // Static File Serving
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`   Node.js Server Running`);
    console.log(`========================================`);
    console.log(`[*] URL: http://localhost:${PORT}`);
    console.log(`[*] Storage: ${RESOURCE_DIR}`);
    console.log(`[*] Max Body Size: ${MAX_BODY_SIZE / 1024 / 1024}MB`);
    console.log(`[!] Keep this window open.`);
});
