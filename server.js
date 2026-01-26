const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const RESOURCE_DIR = path.join(__dirname, 'Resource');

if (!fs.existsSync(RESOURCE_DIR)) {
    fs.mkdirSync(RESOURCE_DIR);
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: Save File
    if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const filename = data.filename || 'db_index.json';
                const content = data.content;

                // Security check
                if (filename.includes('..') || filename.startsWith('/')) {
                    throw new Error("Invalid filename");
                }

                const filePath = path.join(RESOURCE_DIR, filename);
                fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');

                console.log(`[*] Saved: ${filename}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', path: filePath }));
            } catch (e) {
                console.error(`[!] Save Error: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
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
    console.log(`[!] Keep this window open.`);
});
