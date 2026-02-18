import http from 'node:http';

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI</title></head>
  <body style="font-family:system-ui;background:#0b0f14;color:#e5e7eb;padding:24px">
    <h1>UI placeholder</h1>
    <p>This container will become the Next.js UI in PHASE 7.</p>
  </body>
</html>`);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ui listening on ${port}`);
});

