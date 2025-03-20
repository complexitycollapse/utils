import { start as cpStart } from "./cp.js";
import { messageStream, makeStreamPair } from "./ipc.js";

// Virtual Hardware

import * as net from "net";
import { messageStream } from "./ipc.js";
import { app } from "electron";

let cp;

app.whenReady().then(() => {
  const ms = messageStream(net.createConnection("\\\\.\\pipe\\hmc", () => {
    ms.send({ type: 'handshake' });
  }));

  ms.listen(message => {
    const type = message.payload.type;

    if (type === "hardware") {
      switch (message.payload.command) {
        case "shutdown":
          cpShutdown(() => {
            ms.reply(message, { type: "result", result: "VIRTUAL HARDWARE SHUTDOWN COMPLETE" });
            ms.end();
            app.quit();
          });
          break;
        case "load":
          const [nearEnd, farEnd ] = makeStreamPair();
          cpStart(farEnd);
          cp = messageStream(nearEnd);
          break;
        default:
          ms.reply(message, {type: "error", error: "Unrecognised command " + message.payload.command});
      }
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

function cpShutdown(onShutdown) {
  function closeStream() {
    cp.end();
    cp = undefined;
    onShutdown();
  }

  if (cp) {
    cp.send({ "command": "shutdown" }, closeStream);
  } else {
    closeStream();
  }
}
