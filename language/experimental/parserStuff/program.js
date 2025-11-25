import { parse } from "./parser.js";

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
    skipEmptyLines(p);

    if (p.at("EOF")) {
      break;
    }

    stmts.push(parseStatement(p));
  }

  return p.makeNode("program", { stmts });
}

function skipEmptyLines(parser) {
  while (parser.at("NEWLINE")) {
    parser.advance();
  }
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

function getRbp(p, t) {
  return p.leds.get(t.type)?.rbp ?? 0;
}

function parseStatement(p) {
  let t = p.current;

  const expr = parseExpression(p, 0);
  p.expect("NEWLINE");
  p.skipContinuedLineExcessIndentation();
  return p.makeNode("statement", { expression: expr }, t);
}

function parseExpression(p, rbp) {
  p.skipLineNoise();
  let t = p.advance();

  const nud = p.nuds.get(t.type);
  if (!nud) {
    throw p.syntaxError(t, `Expression cannot begin with ${t.type}`);
  }

  let left = nud(p, t);

  while (true) {
    p.skipLineNoise();
    t = p.current;
    if ((p.groupingDepth === 0 && t.type === "NEWLINE") || rbp >= getRbp(p, t)) { break; }
    t = p.advance();

    const led = p.leds.get(t.type);
    if (!led) {
      throw p.syntaxError(t, "Unrecognised operator");
    }
    left = led.led(p, left, t, led.rbp);
  }

  return left;
}
