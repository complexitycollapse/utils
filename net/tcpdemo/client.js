// client.js — two-way NDJSON TCP client (ES6+)
import { createConnection } from 'net';
import readline from 'readline';

const HOST = '127.0.0.1';
const PORT = 4000;

/** NDJSON decoder */
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

const sock = createConnection({ host: HOST, port: PORT }, () => {
  console.log('✅  connected');
});

/* incoming → print */
attachJsonLineReceiver(sock, msg => {
  console.log('⟵', msg);
});

sock.on('close',  () => console.log('🔒 connection closed'));
sock.on('error',  err => console.error('Socket error:', err));

/* stdin → send */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', line => {
  const payload = line.trim().startsWith('{')
    ? JSON.parse(line)
    : { from: 'client', text: line, ts: Date.now() };
  sock.write(JSON.stringify(payload) + '\n');
  console.log('⟶', payload);
});
