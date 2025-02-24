// An experimental operating system.

import * as readline from "readline";
import { executeCommand, exited } from "./command-processor.js";

console.log("MF/OS System Console");
console.log("READY");
console.log("");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: "> "
});

rl.prompt();

rl.on("line", function (line) {
  executeCommand(line);
  if (exited()) {
    console.log("SHUTDOWN");
    rl.close();
  } else {
    rl.prompt();
  }
});
