import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { listEquipment, getEquipment } from './catalog.js';
import { createNotificationService } from './notification.js';
import { createBookingService, DomainError } from './booking.js';
const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
async function readJson(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new DomainError(413, 'BODY_TOO_LARGE', 'Maximum 16 KiB');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new DomainError(400, 'INVALID_JSON', 'Invalid JSON body'); }
}
export function createApp() {
  const notification = createNotificationService();
  const booking = createBookingService({ getEquipment, notification });
  return http.createServer(async (req, res) => {
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html); }
      if (req.method === 'GET' && path === '/equipment') return send(200, listEquipment());
      if (req.method === 'GET' && path === '/reservations') return send(200, booking.list());
      if (req.method === 'GET' && path === '/notifications') return send(200, notification.list());
      if (req.method === 'POST' && path === '/reservations') {
        const r = booking.create(await readJson(req));
        return send(201, { reservationId: r.id, ...r });
      }
      const cancel = path.match(/^\/reservations\/([^/]+)\/cancel$/);
      if (req.method === 'POST' && cancel) return send(200, booking.cancel(cancel[1]));
      return send(404, { code: 'ROUTE_NOT_FOUND', message: 'Route not found' });
    } catch (error) {
      if (error instanceof DomainError) return send(error.status, { code: error.code, message: error.message });
      console.error(error); return send(500, { code: 'INTERNAL_ERROR', message: 'Internal error' });
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  server.on('error', e => { console.error(e.message); process.exitCode = 1; });
  server.listen(3000, '127.0.0.1', () => console.log('ICSI620: http://127.0.0.1:3000 (Ctrl+C to stop)'));
}
