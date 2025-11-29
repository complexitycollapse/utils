import { parseExpression } from "./expressions.js";

export function parseStatementLine(p) {
  const stmt = parseStatement(p);
  p.expect("NEWLINE");
  return stmt;
}

function parseStatement(p, openBracket) {
  let t = p.current;

  if (p.at("(")) {
    const t = p.advance();
    p.pushDelimiters([")"]);
    const stmt = parseStatement(p, t);
    p.popDelimiters();

    // If the statement is an expression then it will have consumed the closing bracket. If it's a
    // proper statement then it won't. This handles the ambiguity over whether brackets are being
    // used to group a statement or an expression.

    if (stmt.type != "expression statement") {
      p.expect(")");
    }
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
    if (openBracket) {
      // Brackets can begin either a statement or an expression. In this case the statement
      // IS an expression so unread the bracket and let the expression parser handle it.
      p.unread(openBracket);
    }
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
