// An experimental operating system.

import * as readline from "readline";
import * as fs from "fs";
import { executeCommand, Command, executeScript } from "./command-processor.js";
import { DataBus, dataBusCommand } from "./data-bus.js";

console.log("MF/OS System Console");

let exit = false;
const dataBus = DataBus();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: "> "
});

rl.on("line", function (line) {
  executeCommand(line, commands);
  if (exit) {
    console.log("SHUTDOWN");
    rl.close();
  } else {
    rl.prompt();
  }
});

const commands = new Map([
  ["exit", Command({ name: "exit", syntax: [], fn: () => exit = true })],
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
  ["status", Command({ name: "status", syntax: [], fn: statusCommand })]
]);

function statusCommand() {
  console.log("DATA BUS: " + dataBus.state.toUpperCase());
}

console.log("");
console.log("Loading init.mf");
executeScript(fs.readFileSync("data/init.mf", "utf8"), commands);
console.log("");

console.log("READY");
rl.prompt();
