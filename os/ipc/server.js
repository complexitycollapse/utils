import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const PIPE_NAME = '\\\\.\\pipe\\mypipe';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create the named pipe server
const server = net.createServer((stream) => {
    console.log('Client connected.');

    stream.on('data', (data) => {
        const message = JSON.parse(data.toString());
        console.log('Received from client:', message);

        // Send response
        const response = JSON.stringify({ type: 'response', message: 'Hello from server!' });
        stream.write(response);
    });

    stream.on('end', () => {
        console.log('Client disconnected.');
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
