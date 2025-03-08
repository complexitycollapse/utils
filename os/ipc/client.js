import { app } from 'electron';
import net from 'net';

const PIPE_NAME = '\\\\.\\pipe\\mypipe';

app.whenReady().then(() => {
    const client = net.createConnection(PIPE_NAME, () => {
        console.log('Connected to server.');

        // Send a test message
        const message = JSON.stringify({ type: 'greeting', message: 'Hello from client!' });
        client.write(message);
    });

    client.on('data', (data) => {
        const response = JSON.parse(data.toString());
        console.log('Received from server:', response);

        // Close the connection after receiving the response
        client.end();
        app.quit();
    });

    client.on('end', () => {
        console.log('Disconnected from server.');
    });

    client.on('error', (err) => {
        console.error('Error:', err.message);
        app.quit();
    });
});
