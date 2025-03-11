// Some of the code in here (such as command interpretation) can be made in the CP.

import * as net from "net";
import { Command, CommandInterpreter } from "./command-processor.js";
import * as rl from "readline";
import { messageStream } from "./ipc.js";
import { app } from "electron";

let commandInterpreter, hmcOut, hmc;

app.whenReady().then(() => {
  const ms = messageStream(net.createConnection("\\\\.\\pipe\\hmc", () => {
    console.log('Connected to server.');

    // Send a test message
    ms.send({ type: 'handshake' }, response => {
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

// const server = net.createServer(function (socket) {
//   hmc = rl.createInterface({
//     input: socket,
//     output: socket
//   });
//   hmcOut = text => hmc.write("This is the text\n", "utf8");
//   commandInterpreter = CommandInterpreter(getCommands(hmcOut), hmcOut);
//   hmcOut("Hello, I am the mainframe\n");
//   hmc.on("line", function (message) {
//     const data = JSON.parse(message);
//     if (data.command === "CP") {
//       hmcOut(message);
//       //commandInterpreter.executeCommand(data.text);
//     }
//   });
//   hmc.on("close", function () {
//     process.exit();
//   });
// }).listen("\\\\.\\pipe\\hmc");

function getCommands(write) {
  return new Map([
    ["write", Command({ name: "write", syntax: [{ name: "message", required: true, positional: true }], fn: write })],
    ["shutdown", Command({ name: "shutdown", syntax: [], fn: () => { shutdown(); } })]
  ]);
}

function shutdown() {
  hmcOut("CP SHUTDOWN COMPLETE\n");
  process.exit();
}
