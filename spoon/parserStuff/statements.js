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
    p.expect("NEWLINE");
    return p.makeNode("expression statement", { expression: expr }, t);
  }
}

function parseStatementBlock(p) {
  const stmts = [];

  if (p.tryEnterBlock()) {
    while (true) {
      if (p.currentLineIsDedented) {
        p.popBlockStack();
        break;
      }
      stmts.push(parseStatement(p));
    }
  } else {
    stmts.push(parseStatement(p));
  }

  return stmts;
}
