import { parseExpression } from "./expressions.js";

export function parseStatement(p) {
  let t = p.current;

  if (p.at("IF")) {
    const t = p.advance();
    p.pushDelimiters(["THEN"]);
    const test = parseExpression(p, 0);
    p.popDelimiters();
    p.expect("THEN");
    const consequent = parseStatementBlock(p);
    return p.makeNode("if statement", { test, consequent }, t);
  } else {
    const expr = parseExpression(p, 0);
    parseStatementTerminator(p);
    return p.makeNode("expression statement", { expression: expr }, t);
  }
}

function parseStatementTerminator(p) {
  p.expect("NEWLINE");
  p.skipContinuedLineExcessIndentation();
}

function parseStatementBlock(p) {
  const stmts = [];

  if (p.at(":")) {
    p.advance();
    parseStatementTerminator(p);
    p.skipEmptyLines();
    p.expect("INDENT");
    p.skipEmptyLines();
    while (true) {
      stmts.push(parseStatement(p));
      p.skipEmptyLines();
      if (p.at("DEDENT")) {
        p.advance();
        break;
      }
    }
  } else {
    stmts.push(parseStatement(p));
  }

  return stmts;
}
