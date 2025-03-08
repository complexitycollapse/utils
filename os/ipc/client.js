import { app } from 'electron';
import net from 'net';

const PIPE_NAME = '\\\\.\\pipe\\mypipe';

app.whenReady().then(() => {
  const client = net.createConnection(PIPE_NAME, () => {
    console.log('Connected to server.');

    // Send a test message
    const message = JSON.stringify({ type: 'greeting', message: 'Hello from client!' });
    client.write(message + "\n");
  });

  let buffer = '';

  client.on('data', (data) => {
    buffer += data.toString();

    let boundary;
    while ((boundary = buffer.indexOf('\n')) !== -1) {
      const message = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);

      try {
        const response = JSON.parse(message);
        console.log('Received from server:', response);
        
        // Close the connection after receiving the response
        client.end();
        app.quit();
      } catch (err) {
        console.error('Error parsing response:', err);
      }
    }
  });

  client.on('end', () => {
    console.log('Disconnected from server.');
  });

  client.on('error', (err) => {
    console.error('Error:', err.message);
    app.quit();
  });
});
