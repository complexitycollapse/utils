import { parse } from "./parser.js";
import { parseExpression } from "./expressions.js";
import { parseStatementLine, parseStatementBlock } from "./statements.js"
import { parseFunctionExpression } from "./functions.js";
import Bindings from "./bindings.js";
import { anyType, booleanType, ensureTypedPattern, numberType, parseTypeAnnotationSuffix, Type } from "./types.js";

/**
 * 
 * @param {string} source 
 */
export function parseModule(source, globals = []) {
  const p = parse(source);

  prefix(p, "IDENT", (p, t) => p.makeNode("identifier", { name: t.value }, t));
  prefix(p, "NUMBER", (p, t) => p.makeNode("number", { value: t.value }, t));
  prefix(p, "STRING", (p, t) => p.makeNode("string", { value: t.value }, t));
  prefix(p, "TRUE", (p, t) => p.makeNode("boolean", { value: true }, t));
  prefix(p, "NIL", (p, t) => p.makeNode("boolean", { value: undefined }, t));
  binaryOperator(p, "+", 40, numberType);
  binaryOperator(p, "-", 40, numberType);
  binaryOperator(p, "*", 50, numberType);
  binaryOperator(p, "/", 50, numberType); // TODO: which way should this associate with *?
  binaryOperator(p, "OR", 20);
  binaryOperator(p, "AND", 20);
  binaryOperator(p, "<", 30, booleanType, numberType);
  binaryOperator(p, ">", 30, booleanType, numberType);
  binaryOperator(p, "=", 30, booleanType, anyType);
  binaryOperator(p, "!=", 30, booleanType, anyType);
  prefix(p, "NOT", (p, t) =>
    p.makeNode("prefix", {
      operator: "not",
      right: parseExpression(p, 0),
      children: ["right"],
      returnType: booleanType,
      rightType: anyType
    }));
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

  prefix(p, "FN", (p, t) => {
    return parseFunctionExpression(p, t);
  });

  suffix(p, "()", 70, (p, l, t, rbp) => {
    // Never call this. Handled as a special case in parseExpression.
    throw p.syntaxError(t, "() is not in valid function call position.");
  });

  infix(p, ":", 100, (p, l, t, rbp) => {
    const bindings = [];
    l = ensureTypedPattern(p, l);
    p.pushDelimiters([","]);

    while(true) {
      const value = parseExpression(p, 0);
      bindings.push({ pattern: l, value });
      if (!p.at(",")) { break; }
      p.advance();
      p.pushDelimiters([":"]);
      l = ensureTypedPattern(p, parseExpression(p, 0));
      p.popDelimiters();
      p.expect(":");
    }
    
    p.popDelimiters();
    return p.makeNode("binding", { bindings, returnType: l.patternType }, t);
  });

  suffix(p, "{", 110, (p, l, t, rbp) => parseTypeAnnotationSuffix(p, l, t));

  const stmts = [];
  const rootEnv = Bindings(Bindings(undefined, globals));

  while (true) {
    if (p.at("EOF")) {
      break;
    }

    let statement = parseStatementLine(p);
    bindVariables(p, statement, rootEnv);
    stmts.push(statement);
  }

  return p.makeNode("module", { stmts, children: ["stmts"] });
}

function bindVariables(p, node, env) {
  if (Array.isArray(node)) {
    node.forEach(item => bindVariables(p, item, env));
  } else if (node.type === "identifier") {
    bindIdentifier(env, node);
  } else if (node.type === "binding") {
    node.bindings.forEach(binding => {
      bindVariables(p, binding.value, env);
    });
    node.bindings.forEach(binding => {
      addPatternVars(p, env, node, binding.pattern);
    });
  } else if (node.type === "statement block") {
    const newEnv = Bindings(env);
    node.stmts.forEach(s => bindVariables(p, s, newEnv));
  } else if (node.type === "function definition") {
    env.addSignature(node.name, node.fn.signature);
    bindVariables(p, node.fn, env);
  } else if (node.type === "function") {
    // TODO: this only handles single-variable patterns
    node.env = Bindings(env, node.signature.parameterList.map(p => [p.pattern.value.name, p]));
    if (node.body) { bindVariables(p, node.body, node.env); }
  } else if (node.type === "union") {
    bindUnion(p, env, node);
  } else if (node.type === "call") {
    bindCall(p, env, node);
  } else if (node.children) {
    node.children.forEach(childProp => bindVariables(p, node[childProp], env));
  }
}

function bindCall(p, env, node) {
  const head = node.head;
  let signatures;
  if (head.type === "identifier") {
    signatures = env.getSignatures(head.name);
  } else if (head.type === "member access") {
    // TODO
  } else {
    // Two cases: the result may be a function or it may not.
    // The signature may be known statically or it may not.
  }

  if (signatures) {
    for (const sig of signatures) {
      // TODO: need an actual precedence rule
      if (sig.match(sig.parameterList).success) {
        node.returnType = sig.returnType;
        return;
      }
    }
  }

  // TODO: do what in this situation?
}

function bindUnion(p, env, node) {
  env.bind(node.name, node.spoonType);
  node.constructors.forEach(c => {
    env.addSignature(c.name, c.signature);
  });
}

function addPatternVars(p, env, node, pattern) {
  // TODO: this will eventually need to support patterns properly
  addVar(p, env, node, pattern.value.name, pattern.patternType);
}

function bindIdentifier(env, node) {
  node.spoonType = env.getType(node.name);
}

function addVar(p, env, node, symbol, type) {
  if (env.has(symbol)) {
    throw p.syntaxError(node, symbol + " is already bound in this context.");
  }
  env.bind(symbol, { name: symbol }, type);
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

function binaryOperator(p, type, lbp, spoonType, argType = spoonType) {
 infix(p, type, lbp, (p, l, t, rbp) => p.makeNode("binary operator", {
    operator: t.value,
    left: l,
    right: parseExpression(p, rbp),
    children: ["left", "right"],
    returnType: spoonType,
    leftType: argType,
    rightType: argType }, t));
}
