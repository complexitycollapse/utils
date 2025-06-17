// server.js — two-way NDJSON TCP server (ES6+)
import { createServer } from 'net';
import readline from 'readline';

const PORT = 4000;
const clients = new Set();     // track sockets for broadcast

/** NDJSON decoder: call handler(obj) for each full line */
function attachJsonLineReceiver(socket, handler) {
  let buf = '';
  socket.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try { handler(JSON.parse(line)); }
      catch (err) { console.error('⚠️ bad JSON:', err.message); }
    }
  });
}

/** Broadcast a JS object to all connected sockets */
function broadcast(obj) {
  const str = JSON.stringify(obj) + '\n';
  clients.forEach(s => s.write(str));
}

const server = createServer(socket => {
  console.log(`🔌  ${socket.remoteAddress}:${socket.remotePort} connected`);
  clients.add(socket);

  // incoming messages from this client
  attachJsonLineReceiver(socket, msg => {
    console.log(`⟵  [client]`, msg);
    // optional ack:
    socket.write(JSON.stringify({ ack: true, ts: Date.now() }) + '\n');
  });

  socket.on('close',   () => { clients.delete(socket); console.log('👋 client left'); });
  socket.on('error',   err => console.error('Socket error:', err));
});

server.listen(PORT, () => console.log(`🚀  Server listening on ${PORT}`));

/* --- operator console → broadcast --- */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', line => {
  // Wrap typed text in an object; let ops send raw JSON by starting with '{'
  const payload = line.trim().startsWith('{')
    ? JSON.parse(line)
    : { from: 'server', text: line, ts: Date.now() };
  broadcast(payload);
  console.log('⟶  [server broadcast]', payload);
});
