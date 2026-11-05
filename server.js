// 静态文件服务器：托管 refs-cli 构建产物 dist/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 9966;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 无后缀路径回退到 .html（如 /docs/git → /docs/git.html）
      const htmlPath = filePath + '.html';
      return fs.readFile(htmlPath, (e2, d2) => {
        if (e2) { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}); return res.end('404 Not Found: ' + urlPath); }
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(d2);
      });
    }
    res.writeHead(200, {'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(PORT, () => console.log(`reference site running at http://localhost:${PORT}`));
