// An experimental operating system.

import * as readline from "readline";
import { Alternatives, Lexer, SingleChar, StringLexer, Then, Transform, OneOrMore, ZeroOrMore } from "../../language/lexer.js";

console.log("MF/OS System Console");
console.log("READY");
console.log("");

let exit = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: "> "
});

rl.prompt();

rl.on("line", function (line) {
  executeCommand(line);
  if (exit) {
    console.log("SHUTDOWN");
    rl.close();
  } else {
    rl.prompt();
  }
});

function executeCommand(commandText) {
  console.log(commandText);
  const command = commandText.split(" ")[0];
  const args = parseArgs(commandText.substring(command.length).trim());
  console.log(args);
  
  if (command == "exit") {
    exit = true;
    return;
  }

  console.log("Unknown command: " + command);
}

const SymbolChar = SingleChar("symbol char", /[0-9a-zA-Z]/);
const quotedString = Then("string", [ // TODO this doesn't handle double spaces because the lexer eats all the spaces
  SingleChar("start quote", /\"/),
  Alternatives([
    Transform(StringLexer("escaped quote", "\\\""), () => new Token("quote", "\"")),
    OneOrMore("string content", SymbolChar)
  ]),
  SingleChar("end quote", /\"/)
], ([, ...tokens]) => {
    tokens.pop();
    return tokens.map(t => t.value).join(" ");
  });
const symbol = OneOrMore("symbol", SymbolChar);
const argument = Alternatives([quotedString, symbol]);
const args = OneOrMore("arguments", argument);
const commandLexer = [args];

function parseArgs(argsText) {
  const lexer = new Lexer(commandLexer, argsText);
  const tokens = lexer.tokenize();
  console.log(tokens.map(t => t.value).join(", "));
}
