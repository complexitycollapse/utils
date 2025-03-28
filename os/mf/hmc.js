// An experimental operating system.

import * as readline from "readline";
import * as fs from "fs";
import * as net from "net";
import { CommandInterpreter, Command } from "./command-processor.js";
import { DataBus, dataBusCommand } from "./data-bus.js";
import { messageStream } from "./ipc.js";
import { spawn } from "child_process";

console.log("MF/OS System Console");
console.log("");

const dataBus = DataBus();
const commandInterpreter = CommandInterpreter(getCommands(), console.log);
let vhStream, vhProcess, vhServer;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: "> "
});

rl.on("line", function (line) {
  line = line.trim();
  if (line.startsWith("CP ")) {
    if (!vhStream) {
      console.log("CP not started. Ignoring command.");
      rl.prompt();
      return;
    } else {
      console.log("CP command detected. Forwarding to CP.");
      socket.write(JSON.stringify({ command: "CP", text: line.substring(3) + "\n" }), "utf8");
    }
  } else {
    commandInterpreter.executeCommand(line);
  }

  rl.prompt();
});

function getCommands() {
  return new Map([
    ["shutdown", Command({ name: "shutdown", syntax: [], fn: shutdownCommand })],
    ["testcom", Command({ name: "testcom", syntax: [
        { name: "arg1", required: true, positional: true }, 
        { name: "arg2", required: false, positional: false }
      ], 
      fn: ({arg1, arg2}) => console.log("arg1: " + arg1 + ", arg2: " + arg2)
    })],
    ["dbus", Command({ name: "dbus", syntax: [
        { name: "command", required: true, positional: true },
        { name: "id", required: false, positional: false },
        { name: "name", required: false, positional: false }
      ],
      fn: (args) => dataBusCommand(args, dataBus)
    })],
    ["start", Command({ name: "start", syntax: [], fn: startCommand })],
    ["stop", Command({ name: "stop", syntax: [], fn: stopCommand })],
    ["hard-stop", Command({ name: "stop", syntax: [], fn: hardStopCommand })],
    ["status", Command({ name: "status", syntax: [], fn: statusCommand })],
    ["w", Command({ name: "w", syntax: [{ name: "command", required: true, positional: true }], fn: wrt })]
  ]);
}

function statusCommand() {
  console.log("DATA BUS: " + dataBus.state.toUpperCase());
  console.log("VIRTUAL HARDWARE: " + (vhServer ? "ON" : "OFF"));
}

function wrt(args) {
  socket.write(JSON.stringify(args), "utf8");
}

function startCommand() {
  
  if (vhProcess || vhServer || vhStream) {
    console.log("Virtual hardware is not shut down");
  }

  vhServer = net.createServer(stream => {
    console.log('Created channel');

    vhStream = messageStream(stream);

    vhStream.listen(message => {
      if (message.payload.type !== "handshake") {
        console.error('Received unexpected message from VH:', message);
        return;
      }

      console.log('VH ready');
    }, message => {
      console.error('Error parsing message: ', message);
    });

    stream.on('end', () => {
      console.log('VH disconnected.');
    });
  });

  vhServer.on("close", () => {
    vhServer = undefined;
  });

  vhServer.listen("\\\\.\\pipe\\hmc", () => {
  
    // Launch Electron client
    vhProcess = spawn('..\\..\\node_modules\\.bin\\electron.cmd', ['vh.js'], {
      stdio: ['ignore', process.stdout, process.stderr],
    });

    console.log("Starting virtual hardware");
  
    vhProcess.on('exit', (code) => {
      console.log(`VH exited with code ${code}`);
      closeVhChannel();
    });
  });  
}

function closeVhChannel() {
  vhProcess = undefined;
  if (vhStream) {
    vhStream.end();
    vhStream = undefined;
  }
  if (vhServer) {
    vhServer.close();
  }
}

function stopCommand() {
  if (vhStream) {
    stopVh();
  } else {
    console.log("Virtual hardware not started");
  }
}

function hardStopCommand() {
  const result = vhProcess.kill("SIGKILL");
  closeVhChannel();
  console.log(result ? "Virtual hardware hard stop complete" : "Failed to hard stop virtual hardware");
}

function shutdownCommand() {
  function shutdownHmc() {
    console.log("SYSTEM SHUTDOWN COMPLETE");
    process.exit();
  }

  console.log("BEGIN SYSTEM SHUTDOWN");

  if (vhStream) {
    stopVh(shutdownHmc);
  } else {
    shutdownHmc();
  }
}

function stopVh(onStopped) {
  vhStream.send({ type: "hardware", command: "shutdown" }, message => {
    if (message.payload.type === "result") {
      console.log(message.payload.result);
      closeVhChannel();
      if (onStopped) { onStopped(); }
    }
  });
}

console.log("Loading init.mf");
commandInterpreter.executeScript(fs.readFileSync("data/init.mf", "utf8"));
console.log("");

console.log("READY");
rl.prompt();
