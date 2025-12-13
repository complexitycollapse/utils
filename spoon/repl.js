import readline from "readline";
import { parseModule } from "./parser/module.js";
import { SyntaxError } from "./parser/parser.js";
import { evaluate, createEnv } from "./interpreter/interpreter.js";
import { NativeFunction } from "./functions/function.js";
import { Parameter, Signature } from "./functions/signature.js";

const PRIMARY_PROMPT = "spoon> ";
const CONT_PROMPT = "...   ";

// ANSI escape codes for red + underline
const RED_UNDERLINE = "\x1b[31m\x1b[4m";
const RESET = "\x1b[0m";

function printSourceWithErrorUnderline(source, err) {
  const lines = source.split("\n");
  const lineIndex = (err.line ?? 1) - 1;
  const col = err.column ?? 1;
  const length = err.length ?? 1;

  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i];

    if (i !== lineIndex || col < 1 || col > text.length + 1) {
      console.log(text);
      continue;
    }

    const start = Math.max(0, col - 1);
    const end = Math.min(text.length, start + length);

    const prefix = text.slice(0, start);
    const target = text.slice(start, end) || " ";
    const suffix = text.slice(end);

    console.log(prefix + RED_UNDERLINE + target + RESET + suffix);
  }
}

// Heuristic: is this probably "incomplete at end" rather than a real error?
function isProbablyIncomplete(source, err) {
  if (source.trim()[source.trim().length - 1] === ":") return true;
  if (!(err instanceof SyntaxError)) return false;

  const lines = source.split("\n");
  const lastLineIndex = lines.length - 1;
  const errLineIndex = (err.line ?? 1) - 1;

  // If the error is on a *previous* line, it’s almost certainly real.
  if (errLineIndex < lastLineIndex) return false;

  // If it’s on the last line but at/after the last character,
  // treat it as "unexpected end of input" / probably incomplete.
  const lastLine = lines[lastLineIndex];
  const col = err.column ?? 1;
  if (col > lastLine.length) return true;

  return false;
}

async function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let buffer = "";
  let prompt = PRIMARY_PROMPT;
  let pendingSyntaxError = undefined;
  let env = createEnv(undefined);
  
  const testFn = NativeFunction(
    "test",
    Signature([
      Parameter("a", true)
    ]),
    args => console.log("My params are:", args));

  testFn.add(env);

  const ask = (p) =>
    new Promise((resolve) => {
      rl.question(p, (answer) => resolve(answer));
    });

  // Ctrl+C behaviour: cancel current input, don't exit REPL immediately
  rl.on("SIGINT", () => {
    if (buffer.trim() === "") {
      // No pending input – second Ctrl+C exits.
      console.log("\n(^C again to exit)");
      buffer = "";
      pendingSyntaxError = undefined;
      prompt = PRIMARY_PROMPT;
    } else {
      console.log("\nInput cancelled.");
      buffer = "";
      pendingSyntaxError = undefined;
      prompt = PRIMARY_PROMPT;
    }
  });

  console.log("Spoon REPL. Type :quit to exit, :reset to cancel current input.");

  /* eslint-disable no-constant-condition */
  while (true) {
    const line = await ask(prompt);
    if (line === undefined || line === undefined) break;

    const trimmed = line.trim();

    // Meta-commands
    if (trimmed === ":quit" || trimmed === ":q" || trimmed === ":exit") {
      break;
    }
    if (trimmed === ":reset" || trimmed === ":clear") {
      buffer = "";
      pendingSyntaxError = undefined;
      prompt = PRIMARY_PROMPT;
      console.log("(input buffer cleared)");
      continue;
    }

    if (trimmed === ":env" || trimmed === ":e") {
      console.log(env);
      continue;
    }

    // If user just hits Enter on an empty buffer, ignore.
    if (buffer === "" && trimmed === "") {
      continue;
    }

    // Build buffer with new line
    buffer = buffer.length > 0 ? buffer + "\n" + line : line;

    // If we previously saw a syntax error and they give us a blank line,
    // treat that as "I'm done, show the error now".
    if (pendingSyntaxError && trimmed === "") {
      const err = pendingSyntaxError;
      console.error("Syntax error:", err.message || "");
      printSourceWithErrorUnderline(buffer, err);

      buffer = "";
      pendingSyntaxError = undefined;
      prompt = PRIMARY_PROMPT;
      continue;
    }

    // Try to parse the current buffer.
    try {
      if (buffer.trim() === "") {
        buffer = "";
        pendingSyntaxError = undefined;
        prompt = PRIMARY_PROMPT;
        continue;
      }

      const ast = parseModule(buffer, env.names);
      const result = evaluate(ast, { env });

      if (result?.value !== undefined) {
        console.log(result.value);
        env = result.env;
      }

      buffer = "";
      pendingSyntaxError = undefined;
      prompt = PRIMARY_PROMPT;
    } catch (err) {
      if (err instanceof SyntaxError) {
        if (isProbablyIncomplete(buffer, err)) {
          // Keep reading – error likely just "unexpected end of input".
          pendingSyntaxError = err;
          prompt = CONT_PROMPT;
        } else {
          // Real error somewhere earlier: show immediately.
          console.error("Syntax error:", err.message || "");
          printSourceWithErrorUnderline(buffer, err);

          buffer = "";
          pendingSyntaxError = undefined;
          prompt = PRIMARY_PROMPT;
        }
      } else {
        console.error("Runtime error:", err);
        buffer = "";
        pendingSyntaxError = undefined;
        prompt = PRIMARY_PROMPT;
      }
    }
  }

  rl.close();
}

startRepl().catch((err) => {
  console.error(err);
  process.exit(1);
});

