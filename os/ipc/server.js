import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const PIPE_NAME = '\\\\.\\pipe\\mypipe';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create the named pipe server
const server = net.createServer((stream) => {
  console.log('Client connected.');
  let buffer = '';

  stream.on('data', (data) => {
    buffer += data.toString();  // Append received data

    let boundary;
    while ((boundary = buffer.indexOf('\n')) !== -1) {
      const message = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);

      try {
        const parsedMessage = JSON.parse(message);
        console.log('Received from client:', parsedMessage);

        // Send response
        const response = JSON.stringify({ type: 'response', message: 'Hello from server!' }) + '\n';
        stream.write(response);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    }
  });

  stream.on('end', () => {
    console.log('Client disconnected.');
    buffer = '';
  });
});

server.listen(PIPE_NAME, () => {
  console.log(`Named pipe server listening on ${PIPE_NAME}`);

  // Launch Electron client
  const clientProcess = spawn('..\\..\\node_modules\\.bin\\electron.cmd', [path.join(__dirname, 'client.js')], {
    stdio: 'inherit',
  });

  clientProcess.on('exit', (code) => {
    console.log(`Client exited with code ${code}`);
    server.close();
  });
});
