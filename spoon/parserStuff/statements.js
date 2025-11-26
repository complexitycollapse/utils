import { parseExpression } from "./expressions.js";

export function parseStatementLine(p) {
  const stmt = parseStatement(p);
  p.expect("NEWLINE");
  return stmt;
}

function parseStatement(p) {
  let t = p.current;

  if (p.at("(")) {
    const t = p.advance();
    p.pushDelimiters([")"]);
    const stmt = parseStatement(p);
    p.popDelimiters();
    p.expect(")");
    return stmt;
  }
  else if (p.at("IF")) {
    const t = p.advance();
    p.pushDelimiters(["THEN"]);
    const test = parseExpression(p, 0);
    p.popDelimiters();
    p.expect("THEN");
    const consequent = parseStatementBlock(p);
    return p.makeNode("if statement", { test, consequent }, t);
  } else {
    const expr = parseExpression(p, 0);
    return p.makeNode("expression statement", { expression: expr }, t);
  }
}

function parseStatementBlock(p) {
  const stmts = [];

  if (p.tryEnterBlock()) {
    stmts.push(parseStatement(p));

    while (true) {
      if (p.currentLineIsDedented || p.isDelimiter(p.current)) {
        p.popBlockStack();
        break;
      }
      p.expect("NEWLINE");
      stmts.push(parseStatement(p));
    }
  } else {
    stmts.push(parseStatement(p));
  }

  return stmts;
}
