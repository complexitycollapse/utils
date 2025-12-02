import { parse } from "./parser.js";
import { parseExpression } from "./expressions.js";
import { parseStatementLine, parseStatementBlock } from "./statements.js"

/**
 * 
 * @param {string} source 
 */
export function program(source, globals = []) {
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
  prefix(p, "NOT", (p, t) =>
    p.makeNode("prefix", { operator: "not", right: parseExpression(p, 0), children: ["right"]}));
  infix(p, ".", 80, (p, l, t, rbp) => {
    const member = p.expect("IDENT");
    return p.makeNode("member access", { left: l, right: member.value }, t);
  });

  prefix(p, "IF", (p, t) => {
    p.pushDelimiters(["THEN"]);
    const test = parseExpression(p, 0);
    p.popDelimiters();
    p.expect("THEN");
    const consequent = parseStatementBlock(p);
    return p.makeNode("if expression", { test, consequent, children: ["test", "consequent"] }, t);
  })

  prefix(p, "(", (p, t) => {
    const expr = parseExpression(p, 0);
    expr.grouped = true;
    p.expect(")");
    return expr;
  });

  suffix(p, "()", 70, (p, l, t, rbp) => {
    // Never call this. Handled as a special case in parseExpression.
    throw p.syntaxError(t, "() is not in valid function call position.");
  });

  infix(p, ":", 100, (p, l, t, rbp) => {
    const bindings = [];
    p.pushDelimiters([","]);

    while(true) {
      if (l.type != "identifier") {
        throw p.syntaxError(l, "Expected symbol.");
      }
      const value = parseExpression(p, 0);
      bindings.push({ symbol: l.name, value });
      if (!p.at(",")) { break; }
      p.advance();
      p.pushDelimiters([":"]);
      l = parseExpression(p, 0);
      p.popDelimiters();
      p.expect(":");
    }
    
    p.popDelimiters();
    return p.makeNode("binding", { bindings }, t);
  });

  const stmts = [];
  const rootEnv = { 
    parent: { bindings: new Map(globals.map(g => [g, { name: g }]))},
    bindings: new Map()
  };

  while (true) {
    if (p.at("EOF")) {
      break;
    }

    let statement = parseStatementLine(p);
    bindVariables(p, statement, rootEnv);
    stmts.push(statement);
  }

  return p.makeNode("program", { stmts, children: ["stmts"] });
}

function bindVariables(p, node, env) {
  if (Array.isArray(node)) {
    node.forEach(item => bindVariables(p, item, env));
  } else if (node.type === "identifier") {
    bindIdentifier(p, env, node);
  } else if (node.type === "binding") {
    node.bindings.forEach(binding => {
      addVar(p, env, node, binding.symbol);
    });
  } else if (node.type === "statement block") {
    const newEnv = { parent: env, bindings: new Map() }
    node.stmts.forEach(s => bindVariables(p, s, newEnv));
  } else if (node.children) {
    node.children.forEach(childProp => bindVariables(p, node[childProp], env));
  }
}

function bindIdentifier(p, env, node) {
  if (!env) {
    throw p.syntaxError(node, node.name + " is undefined");
  } else if (env.bindings.has(node.name)) {
    node.env = env;
  } else {
    bindIdentifier(p, env.parent, node);
  }
}

function addVar(p, env, node, symbol) {
  const bindings = env.bindings;
  if (bindings.has(symbol)) {
    throw p.syntaxError(node, symbol + " is already bound in this context.");
  }
  bindings.set(symbol, { name: symbol });
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
    right: parseExpression(p, rbp),
    children: ["left", "right"] }, t)); 
}
