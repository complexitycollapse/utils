import { createServer } from 'net';

const clients = new Map();

function attachJsonLineReceiver(socket, handler) {
  let buf = '';
  socket.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try { handler(JSON.parse(line), socket.localPort); }
      catch (err) { console.error('⚠️ bad JSON:', err.message); }
    }
  });
}

export function send(port, obj) {
  const str = JSON.stringify(obj) + '\n';
  const socket = clients.get(port);
  socket?.write(str);
}

export function startServer(port, callback, onConnected) {
  const server = createServer(socket => {
    console.log(`🔌  ${socket.remoteAddress}:${socket.remotePort} connected`);
    clients.set(socket.localPort, socket);
  
    // incoming messages from this client
    attachJsonLineReceiver(socket, callback);
    onConnected?.(socket.localPort);
  
    socket.on('close', () => { 
      clients.delete(socket.localPort);
      console.log('👋 client left');
    });
    socket.on('error', err => console.error('Socket error:', err));
  });
  
  server.listen(port, () => console.log(`🚀  TCP server listening on ${port}`));
}

// Example
// startServer(4000, (msg, port) => {
//   console.log("Received", msg);
//   send(port, {msg: "the reply"});
// });
