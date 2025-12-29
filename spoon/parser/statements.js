import { Signature } from "../functions/signature.js";
import { parseExpression } from "./expressions.js";
import { parseFunctionDefinition, parseParameter } from "./functions.js";
import { ParameterizedType, UnionType } from "../types.js";

export function parseStatementLine(p) {
  const stmt = parseStatement(p);
  p.expect("NEWLINE");
  return stmt;
}

export function parseStatement(p, openBracket) {
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
  } else if (p.at("DEF")) {
    return parseFunctionDefinition(p, p.advance());
  } else if (p.at("UNION")) {
    return parseUnion(p, p.advance());
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

export function parseStatementBlock(p) {
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
  } else {
    return parseStatement(p);
  }
}

function parseUnion(p, t) {
  const name = p.expect("IDENT").value;
  const typeParams = [];
  while(!p.at(":") && !p.at("NEWLINE") && !p.isDelimiter()) {
    typeParams.push({ name: p.expect("IDENT").value });
    if (! p.at(",")) { break; }
    p.advance();
  }

  const type = ParameterizedType(UnionType(name), typeParams);
  const constructors = [];

  if (p.tryEnterBlock()) {
    constructors.push(parseConstructor(p, p.current, type));

    while (true) {
      if (p.currentLineIsDedented || p.isDelimiter(p.current)) {
        p.popBlockStack();
        break;
      }
      p.expect("NEWLINE");
      constructors.push(parseConstructor(p, p.current, type));
    }
  } else {
    throw p.syntaxError(p.current, "Expected constructor block");
  }

  return p.makeNode("union", { name, spoonType: type, constructors }, t);
}

function parseConstructor(p, t, returnType) {
  const name = p.expect("IDENT").value;

  const params = [];
  while (!p.at("NEWLINE") && !p.isDelimiter()) {
    params.push(parseParameter(p));
    if (!p.at(",")) {
      break;
    }
    p.advance();
  }

  return p.makeNode("constructor", { name, signature: Signature(params, returnType) }, t);
}
