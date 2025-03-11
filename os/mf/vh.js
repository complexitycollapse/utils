// Virtual Hardware

import * as net from "net";
import { messageStream } from "./ipc.js";
import { app } from "electron";

app.whenReady().then(() => {
  const ms = messageStream(net.createConnection("\\\\.\\pipe\\hmc", () => {
    ms.send({ type: 'handshake' });
  }));

  ms.listen(message => {
    const type = message.payload.type;

    if (type === "shutdown") {
      ms.reply(message, { type: "result", result: "VIRTUAL HARDWARE SHUTDOWN COMPLETE" });
      ms.end();
      app.quit();
    }

  }, message => {
    console.error('Error parsing message:', message);
  });

  ms.stream.on('end', () => {
    console.log('Disconnected from HMC.');
    app.quit();
  });

  ms.stream.on('error', (err) => {
    console.error('Error:', err.message);
    app.quit();
  });
});
