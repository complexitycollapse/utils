import { parseExpression } from "./expressions.js";
import { parseFunctionDefinition } from "./functions.js";

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
  } else if (p.at("FN")) {
    return parseFunctionDefinition(p, p.advance());
  } else {
    if (openBracket) {
      // Brackets can begin either a statement or an expression. In this case the statement
      // IS an expression so unread the bracket and let the expression parser handle it.
      p.unread(openBracket);
    }
    const expr = parseExpression(p, 0);
    return p.makeNode(
      "expression statement",
      { expression: expr, children: ["expression"] },
      t);
  }
}

export function parseStatementBlock(p, allowInline) {
  const start = p.current;

  if (p.tryEnterBlock()) {
    const stmts = [];
    stmts.push(parseStatement(p));

    while (true) {
      if (p.currentLineIsDedented || p.isDelimiter(p.current)) {
        p.popBlockStack();
        break;
      }
      p.expect("NEWLINE");
      stmts.push(parseStatement(p));
    }

    return p.makeNode("statement block", { stmts, children: ["stmts"] }, start);
  } else if (allowInline && p.at(":")) {
    p.advance();
    return parseStatement(p);
  } else {
    return parseStatement(p);
  }
}
