import { readFile } from "fs/promises";
import { parseModule } from "./parser/module.js";
import { SyntaxError } from "./parser/parser.js";
import { evaluate, createEnv } from "./interpreter/interpreter.js";
import { numberType, stringType } from "./parser/types.js";

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

    console.log(prefix + "\x1b[31m\x1b[4m" + target + "\x1b[0m" + suffix);
  }
}

async function main() {
  const [, , filename] = process.argv;
  if (!filename) {
    console.error("Usage: node loader.js <file>");
    process.exit(1);
  }

  let source;
  try {
    source = await readFile(filename, "utf8");
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err?.message ?? err);
    process.exit(1);
  }

  const env = createEnv(undefined, { string: stringType, number: numberType });

  try {
    const ast = parseModule(source, env.names);
    const result = evaluate(ast, { env });
    if (result?.value !== undefined) {
      console.log(result.value);
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error("Syntax error:", err.message || "");
      printSourceWithErrorUnderline(source, err);
    } else {
      console.error("Runtime error:", err);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
