import { Constructor, GenericFunction, SpoonFunction } from "../functions/function.js";
import { Parameter, Signature } from "../functions/signature.js";

/**
 * @typedef {Object} SpoonEnv
 * @property {SpoonEnv|undefined} parent
 * @property {Map<string, any>} bindings
 * @property {Map<string, any>} signatures
 */

/**
 * Create a new environment.
 * @param {SpoonEnv|undefined} parent
 * @param {Record<string, any>} [initial]
 * @returns {SpoonEnv}
 */
export function createEnv(parent = undefined, initial = {}, signaturesArg = {}) {
  const bindings = new Map(Object.entries(initial));
  const signatures = new Map(Object.entries(signaturesArg));

  return { parent, bindings, signatures, get names() {return [...bindings.keys()]; }};
}

/**
 * Bind a variable in the current environment. Assumes the static
 * binder has already enforced "no rebinding in same scope". 
 *
 * @param {SpoonEnv} env
 * @param {string} name
 * @param {any} value
 */
function bind(env, name, value) {
  env.bindings.set(name, value);
  return value;
}

/**
 * Arguments bundle passed to native / future Spoon functions.
 * @typedef {Object} CallArgs
 * @property {any[]} positional
 * @property {Record<string, any>} named
 * @property {Record<string, any>} switches
 * @property {Record<string, string>} enums
 */

/**
 * Evaluate a Spoon program source string.
 *
 * - `globals` is an object mapping names to initial values (e.g. builtins).
 * - Returns the value of the last top-level statement (or undefined).
 * - Re-uses `env` so you can build a REPL by calling this repeatedly.
 *
 * @param {any} ast
 * @param {Object} [options]
 * @param {SpoonEnv} [options.env]  // existing environment (for REPL)
 * @param {Record<string, any>} [options.globals] // used only when env is omitted
 * @returns {{ value: any, env: SpoonEnv, ast: any }}
 */
export function evaluate(ast, options = {}) {
  const env =
    options.env ?? createEnv(undefined, options.globals);
  const value = evalModule(ast, env);
  return { value, env, ast };
}

/**
 * Evaluate a parsed "module" node. :contentReference[oaicite:6]{index=6}
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
export function evalModule(node, env) {
  if (node.type !== "module") {
    throw new TypeError(`Expected module node, got ${node.type}`);
  }

  let result;
  for (const stmt of node.stmts) {
    result = evalStatement(stmt, env);
  }
  return result;
}

/**
 * Evaluate a statement node.
 * Currently only "expression statement" exists. :contentReference[oaicite:7]{index=7}
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
export function evalStatement(node, env) {
  switch (node.type) {
    case "function definition":
      return evalFunctionDefinition(node, env);
    case "expression statement":
      return evalExpression(node.expression, env);
    case "statement block":
      return evalStatementBlock(node, env);
    case "union":
      return evalUnion(node, env);
    default:
      throw new Error(`Unknown statement type: ${node.type}`);
  }
}

/**
 * Evaluate a statement block node.
 * Block has its own scope chained to the parent env. 
 *
 * @param {any} node
 * @param {SpoonEnv} parentEnv
 * @returns {any}
 */
export function evalStatementBlock(node, parentEnv) {
  const blockEnv = createEnv(parentEnv);
  let result;
  for (const stmt of node.stmts) {
    result = evalStatement(stmt, blockEnv);
  }
  return result;
}

/**
 * Evaluate an expression node.
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
export function evalExpression(node, env) {
  switch (node.type) {
    case "number":
    case "boolean":
    case "string":
      return node.value;

    case "identifier":
      return env.bindings.get(node.name);

    case "binary operator":
      return evalBinary(node, env);

    case "prefix":
      return evalPrefix(node, env);

    case "member access":
      return evalMemberAccess(node, env);

    case "call":
      return evalCall(node, env);

    case "if expression":
      return evalIfExpression(node, env);

    case "binding":
      return evalBindingExpression(node, env);

    case "statement block":
      // Statement block used as an expression (e.g. IF consequent).
      return evalStatementBlock(node, env);

    case "expression statement":
      // Can appear as IF consequent in inline form: "if x then y".
      return evalExpression(node.expression, env);

    case "function":
      return evalFunctionLiteral(node, env);

    default:
      throw new Error(`Unknown expression type: ${node.type}`);
  }
}

function evalFunctionDefinition(node, env) {
  const { name, fn } = node;
  const fnValue = evalFunctionLiteral(fn, env);

  let genericFn = env.bindings.get(name);
  if (genericFn === undefined) {
    genericFn = bind(env, name, GenericFunction(name));
  }
  if (!genericFn.isGenericFunction) {
    throw new Error(`Symbol ${name} is not bound to a generic function`);
  }

  genericFn.addInstance(fnValue);
}

/**
 * Evaluate a function literal.
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalFunctionLiteral(node, env) {
  const params = node.parameters.map(p =>
    Parameter(p.name, p.positional, p.type, p.defaultValueExpression));
  return SpoonFunction(Signature(params), env, node.body);
}

/**
 * Evaluate a binary operator expression.
 *
 * Supported operators (for now):
 *  - Arithmetic: +, -, *, /
 *  - Comparison: <, <=, >, >=, =, !=
 *  - Logical: and, or (short-circuit)
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalBinary(node, env) {
  const op = node.operator;

  if (op === "and") {
    const left = evalExpression(node.left, env);
    return left ? evalExpression(node.right, env) : left;
  }

  if (op === "or") {
    const left = evalExpression(node.left, env);
    return left ? left : evalExpression(node.right, env);
  }

  const left = evalExpression(node.left, env);
  const right = evalExpression(node.right, env);

  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "=":
      return left === right;
    case "!=":
      return left !== right;
    default:
      throw new Error(`Unknown binary operator: ${op}`);
  }
}

/**
 * Evaluate a prefix expression. Currently only "not". 
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalPrefix(node, env) {
  const right = evalExpression(node.right, env);
  switch (node.operator) {
    case "not":
      return !right;
    default:
      throw new Error(`Unknown prefix operator: ${node.operator}`);
  }
}

/**
 * Evaluate member access (e.g. x.y).
 *
 * For now this simply returns base[rightName] and does not
 * provide any special method "this" semantics. :contentReference[oaicite:10]{index=10}
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalMemberAccess(node, env) {
  const base = evalExpression(node.left, env);
  if (base == undefined) {
    throw new TypeError(
      `Cannot access member ${node.right} of ${base}`
    );
  }
  return base[node.right];
}

/**
 * Evaluate a function call expression.
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalCall(node, env) {
  const callee = evalExpression(node.head, env);

  if (!callee?.callable) {
    throw new TypeError("Value is not callable");
  }

  const { success, failure, matchedArgs, instance } = callee.match(node.args);
  if (!success) {
    throw new Error(failure);
  }
  const actualParameters = new Map();

  for (const arg of matchedArgs) {
    switch (arg.type) {
      case "named":
        actualParameters.set(arg.name, evalExpression(arg.value, env));
        break;
      case "switch":
        actualParameters.set(arg.name, true);
        break;
      case "enum":
        enums.set(arg.name, arg.value);
        break;
      default:
        throw new Error(`Unknown call argument type: ${arg.type}`);
    }
  }

  return instance.invoke(actualParameters);
}

/**
 * Evaluate an IF expression.
 *
 * - `test` is evaluated in the current env.
 * - If truthy, `consequent` may be an expression statement or a
 *   statement block. Both are evaluated and their result is the
 *   value of the IF expression.
 * - If falsy, returns undefined for now (can be revisited later
 *   if Spoon gets an explicit unit / undefined type). :contentReference[oaicite:11]{index=11}
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalIfExpression(node, env) {
  const test = evalExpression(node.test, env);
  if (test) {
    const c = node.consequent;
    if (c.type === "statement block") {
      return evalStatementBlock(c, env);
    }
    if (c.type === "expression statement") {
      return evalExpression(c.expression, env);
    }
    // Fallback: treat as expression.
    return evalExpression(c, env);
  }
  return undefined;
}

/**
 * Evaluate a binding expression, e.g. "x: expr" or
 * "x: 1, y: 2". :contentReference[oaicite:12]{index=12}
 *
 * Semantics:
 *  - Evaluate each value in order, binding its symbol into the
 *    current environment.
 *  - The value of the whole binding expression is the value of
 *    the last bound expression.
 *  - Bindings extend the current scope from this point to the end
 *    of the containing block/program; we model this by mutating
 *    the current env, which is shared with subsequent evaluation.
 *
 * @param {any} node
 * @param {SpoonEnv} env
 * @returns {any}
 */
function evalBindingExpression(node, env) {
  let result;
  for (const bindingSpec of node.bindings) {
    const value = evalExpression(bindingSpec.value, env);
    // TODO: edit this when supporting patterns properly
    bind(env, bindingSpec.pattern.value.name, value);
    result = value;
  }
  return result;
}

function evalUnion(node, env) {
  env.bindings.set(node.spoonType.name, node.spoonType);
  node.constructors.forEach(c => {
    const sig = Signature(c.params.map(p => Parameter(p.name, true, p.type)));
    const value = sig.parameters.size === 0 ?
      node.spoonType.createInstance(c.name, new Map()) :
      Constructor(node.spoonType, c.name, sig);
    bind(env, c.name, value);
  });
}
