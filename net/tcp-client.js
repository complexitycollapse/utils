import { createConnection } from 'net';

function attachJsonLineReceiver(socket, handler) {
  let buf = '';
  socket.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try { handler(JSON.parse(line), socket); }
      catch (err) { console.error('⚠️ bad JSON:', err.message); }
    }
  });
}

export function connect(host, port, handler, onConnect) {
  const sock = createConnection({ host, port }, () => onConnect?.(sock));
  
  attachJsonLineReceiver(sock, handler);
  
  sock.on('close',  () => console.log('🔒 connection closed'));
  sock.on('error',  err => console.error('Socket error:', err));
  return sock;  
}

export function send(sock, msg) {
  const str = JSON.stringify(msg) + "\n";
  sock.write(str);
}

// Example
// connect("127.0.0.1", 4000, (msg, socket) => {
//   console.log("received", msg);
//   socket.end();
// },
// sock => {
//   console.log("connected");
//   send(sock, {msg: "hello"});
// });
