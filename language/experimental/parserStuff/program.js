import { parse } from "./parser.js";
import { parseExpression } from "./expressions.js";
import { parseStatement } from "./statements.js"

/**
 * 
 * @param {string} source 
 */
export function program(source) {
  const p = parse(source);

  prefix(p, "IDENT", (p, t) => p.makeNode("identifier", { name: t.value }, t));
  prefix(p, "NUMBER", (p, t) => p.makeNode("number", { value: t.value }, t));
  prefix(p, "TRUE", (p, t) => p.makeNode("boolean", { value: true }, t));
  prefix(p, "FALSE", (p, t) => p.makeNode("boolean", { value: false }, t));
  binaryOperator(p, "+", 40);
  binaryOperator(p, "-", 40);
  binaryOperator(p, "*", 50);
  binaryOperator(p, "/", 50); // TODO: which way should this associate with *?
  binaryOperator(p, "OR", 20);
  binaryOperator(p, "AND", 20);
  binaryOperator(p, "<", 30);
  binaryOperator(p, ">", 30);
  binaryOperator(p, "=", 30);
  binaryOperator(p, "!=", 30);
  prefix(p, "NOT", (p, t) => p.makeNode("prefix", { operator: "not", right: parseExpression(p, 0)}));

  prefix(p, "(", (p, t) => {
    p.groupingDepth++;
    const expr = parseExpression(p, 0);
    p.skipLineNoise();
    p.expect(")");
    p.groupingDepth--;
    return expr;
  });

  const stmts = [];

  while (true) {
    p.skipEmptyLines();

    if (p.at("EOF")) {
      break;
    }

    stmts.push(parseStatement(p));
  }

  return p.makeNode("program", { stmts });
}

function prefix(parser, type, nud) {
  parser.nuds.set(type, nud);
}

function infix(parser, type, bp, led) {
  parser.leds.set(type, { lbp: bp, rbp: bp, led });
}

function suffix(parser, type, lbp, led) {
  parser.leds.set(type, { lbp, rbp: 0, led });
}

function binaryOperator(p, type, lbp) {
 infix(p, type, lbp, (p, l, t, rbp) => p.makeNode("binary operator", { 
    operator: t.value,
    left: l,
    right: parseExpression(p, rbp) } , t)); 
}
