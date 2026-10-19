// Serveur local avec rechargement automatique : node serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = +process.argv[2] || 5173;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.json':'application/json' };
const RELOAD = '<script>new EventSource("/__reload").onmessage=()=>location.reload()</script>';
const clients = new Set();

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/__reload') {
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', Connection:'keep-alive' });
    res.write('\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  const file = path.join(root, url.endsWith('/') ? url + 'index.html' : url);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(ext === '.html' ? data.toString().replace('</body>', RELOAD + '</body>') : data);
  });
}).listen(port, () => console.log(`Calqul: http://localhost:${port}`));

let timer;
fs.watch(root, { recursive: true }, (e, name) => {
  if (!name || name.startsWith('.git')) return;
  clearTimeout(timer);
  timer = setTimeout(() => clients.forEach(c => c.write('data: reload\n\n')), 100);
});
