import { app } from 'electron';
import net from 'net';
import { messageStream } from './common.js';

const PIPE_NAME = '\\\\.\\pipe\\mypipe';

app.whenReady().then(() => {
  const ms = messageStream(net.createConnection(PIPE_NAME, () => {
    console.log('Connected to server.');

    // Send a test message
    const message = { type: 'greeting', message: 'Hello from client!' };
    ms.send(message, response => {
      console.log('Received reply from server:', response);

      // Close the connection after receiving the response
      ms.end();
      app.quit();
    });
  }));

  ms.listen(response => {
    console.error('Received unexpected message from server:', response);
        
    // Close the connection after receiving the message
    ms.end();
    app.quit();
  }, response => {
    console.error('Error parsing response:', response);
  });

  ms.stream.on('end', () => {
    console.log('Disconnected from server.');
  });

  ms.stream.on('error', (err) => {
    console.error('Error:', err.message);
    app.quit();
  });
});
