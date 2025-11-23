import { tokenize } from "./lexer.js";

const PRECEDENCE = {
  or: 10,
  and: 20,
  compare: 30,
  add: 40,
  mul: 50,
  prefix: 60,
  call: 70,
  member: 80,
};

const DEFAULT_EXPR_TERMINATORS = new Set(["NEWLINE", "EOF", "DEDENT"]);

export function parse(source) {
  const tokens = tokenize(source);
  const parser = createParser(tokens);
  const program = parseProgram(parser);
  return program;
}

// Small helper to attach source location to AST nodes.
// `loc` can be either a token or another AST node; we just copy
// `line`, `column`, and `length` from it if present.
function makeNode(type, props, loc) {
  const node = { type, ...props };
  if (loc && typeof loc.line === "number" && typeof loc.column === "number") {
    node.line = loc.line;
    node.column = loc.column;
    node.length =
      typeof loc.length === "number" ? loc.length : null;
  } else {
    node.line = null;
    node.column = null;
    node.length = null;
  }
  return node;
}

/* Parser core */

function createParser(tokens) {
  let index = 0;

  function current() {
    return tokens[index];
  }

  function peek(offset = 1) {
    return tokens[index + offset];
  }

  function at(type) {
    const t = current();
    return t && t.type === type;
  }

  function advance() {
    const t = tokens[index];
    index += 1;
    return t;
  }

  function expect(type, message) {
    const t = current();
    if (!t || t.type !== type) {
      throw syntaxError(
        t,
        message || `Expected ${type}, got ${t ? t.type : "EOF"}.`,
      );
    }
    index += 1;
    return t;
  }

  function syntaxError(token, message) {
    if (!token) {
      return new SyntaxError(message);
    }
    return new SyntaxError(
      `${message} (line ${token.line}, column ${token.column}).`,
    );
  }

  return { tokens, current, peek, at, advance, expect, error: syntaxError };
}

/* Program & statements */

function parseProgram(parser) {
  const body = [];
  while (!parser.at("EOF")) {
    if (parser.at("NEWLINE")) {
      parser.advance();
      continue;
    }
    const stmt = parseStatement(parser);
    if (stmt) {
      body.push(stmt);
    }
  }
  return makeNode("Program", { body }, body[0] || null);
}

function parseStatement(parser) {
  const t = parser.current();
  if (!t || t.type === "EOF") {
    return null;
  }

  if (t.type === "NEWLINE") {
    parser.advance();
    return null;
  }

  if (t.type === "IF") {
    return parseIfStatement(parser);
  }

  // TODO: add more statement keywords via a registry/dispatch.

  const expr = parseExpression(parser, 0, DEFAULT_EXPR_TERMINATORS);
  if (parser.at("NEWLINE")) {
    parser.advance();
  }
  return makeNode("ExprStmt", { expression: expr }, expr);
}

/* Blocks & if */

function parseStatementBlock(parser, ownerToken) {
  // Handles either:
  //   keyword ... ':' NEWLINE INDENT ... DEDENT
  // or:
  //   keyword ... <single statement on the same line>
  //
  // Inline "keyword ...: stmt" (colon followed by same-line statement)
  // is *not* supported.

  if (parser.at(":")) {
    const colon = parser.advance();

    // After ':' we must have a newline leading into an indented block.
    if (!parser.at("NEWLINE")) {
      throw parser.error(
        parser.current(),
        "Inline ':' blocks are not supported. Use a newline and indentation " +
          "after ':', or omit ':' for an inline statement.",
      );
    }

    // Multi-line block.
    const block = parseBlock(parser);
    return block;
  }

  // Inline single-statement form (no ':').
  if (parser.at("NEWLINE") || parser.at("EOF")) {
    throw parser.error(parser.current(), "Missing statement block.");
  }

  const stmt = parseStatement(parser);
  const body = [];
  if (stmt) {
    body.push(stmt);
  }

  const loc = body[0] || ownerToken || parser.current();
  return makeNode("BlockStmt", { body }, loc);
}

function parseBlock(parser) {
  // Expect newline + INDENT for a multi-line block.
  if (parser.at("NEWLINE")) {
    parser.advance();
  }
  parser.expect("INDENT", "Expected indented block.");

  const body = [];
  while (!parser.at("DEDENT") && !parser.at("EOF")) {
    if (parser.at("NEWLINE")) {
      parser.advance();
      continue;
    }
    const stmt = parseStatement(parser);
    if (stmt) {
      body.push(stmt);
    }
  }

  parser.expect("DEDENT", "Unclosed block (missing dedent).");

  return makeNode("BlockStmt", { body }, body[0] || null);
}

function parseIfStatement(parser) {
  const ifToken = parser.advance(); // IF

  const terminators = new Set([
    "THEN",
    ":",
    "NEWLINE",
    "EOF",
  ]);

  const test = parseExpression(parser, 0, terminators);

  if (parser.at("THEN")) {
    parser.advance();
  } else {
    throw parser.error(parser.current(), "Missing then statement.");
  }

  const consequent = parseStatementBlock(parser, ifToken);

  // You can extend this later for 'else', 'elif', etc.
  return makeNode(
    "IfStmt",
    { test, consequent, alternate: null },
    ifToken,
  );
}

/* Expressions (Pratt parser) */

function parseExpression(
  parser,
  minBp = 0,
  terminators = DEFAULT_EXPR_TERMINATORS,
) {
  const first = parser.current();
  if (!first || (terminators && terminators.has(first.type))) {
    throw parser.error(first, "Unexpected end of expression.");
  }

  let left = parsePrefix(parser, terminators);

  // After prefix, handle member access, calls and infix operators.
  while (true) {
    const t = parser.current();
    if (!t || (terminators && terminators.has(t.type))) {
      break;
    }

    // --- Member access: x.y ---
    if (t.type === "." && PRECEDENCE.member > minBp) {
      const dot = parser.advance(); // '.'

      const propToken = parser.current();
      if (!propToken || propToken.type !== "IDENT") {
        throw parser.error(
          propToken,
          "Expected identifier after '.'.",
        );
      }
      parser.advance();

      const property = makeNode(
        "Identifier",
        { name: propToken.value },
        propToken,
      );

      left = makeNode(
        "MemberExpr",
        { object: left, property },
        dot,
      );
      continue;
    }

    // --- Zero-argument call syntax: head() / head () ---
    if (t.type === "(") {
      const next = parser.peek(1);

      // Detect '()' immediately following the head.
      if (next && next.type === ")") {
        // '()' must follow some head expression; it cannot stand alone.
        if (!left) {
          throw parser.error(
            t,
            "Empty '()' must follow a function or value; it cannot stand alone.",
          );
        }

        // You cannot write 'foo () ()'; the result of 'foo ()' must be
        // parenthesised before calling it again.
        if (isZeroArgCallResultNeedingParens(left)) {
          throw parser.error(
            t,
            "Cannot call the result of a zero-argument call without parentheses. " +
              "Write '(foo ()) ()' instead of 'foo () ()'.",
          );
        }

        // Consume '()' and turn `left` into a zero-argument CallExpr.
        parser.advance(); // LPAREN
        parser.advance(); // RPAREN

        const callNode = makeNode(
          "CallExpr",
          { callee: left, args: [] },
          left,
        );
        // Mark that this call came from empty parens.
        callNode._fromEmptyParens = true;
        // Propagate grouping: (foo ()) keeps _grouped = true.
        callNode._grouped = !!left._grouped;
        left = callNode;

        continue;
      }
    }

    // --- Implicit function application: space-separated arguments ---
    if (canStartCallArgument(t, terminators) && PRECEDENCE.call > minBp) {
      // If the callee is `foo ()` (a zero-arg call) and wasn't grouped,
      // you cannot write `foo () x`. You must parenthesise it:
      //   (foo ()) x
      if (isZeroArgCallResultNeedingParens(left)) {
        throw parser.error(
          t,
          "Cannot pass arguments to the result of 'foo ()' without parentheses. " +
            "Write '(foo ()) x' if you want to call the result.",
        );
      }

      left = parseCallExpression(parser, left, terminators);
      continue;
    }

    // --- Infix operators (+, <, and, or, etc.) ---
    const infixPrec = getInfixPrecedence(t.type);
    if (infixPrec === 0 || infixPrec <= minBp) {
      break;
    }

    const opToken = parser.advance();
    const right = parseExpression(parser, infixPrec, terminators);

    left = makeNode(
      "BinaryExpr",
      {
        // Use the textual operator ("+", "<", "and", etc.)
        operator: opToken.value,
        left,
        right,
      },
      opToken,
    );
  }

  return left;
}

function parsePrefix(parser, terminators) {
  const t = parser.advance();

  switch (t.type) {
    case "NUMBER":
      return makeNode("NumberLiteral", { value: t.value }, t);
    case "STRING":
      return makeNode("StringLiteral", { value: t.value }, t);
    case "IDENT":
      return makeNode("Identifier", { name: t.value }, t);
    case "(": {
      const innerTerminators = new Set([")"]);
      const expr = parseExpression(parser, 0, innerTerminators);
      parser.expect(")", "Expected ')' after expression.");
      expr._grouped = true;
      return expr;
    }
    case "NOT": {
      const argument = parseExpression(parser, PRECEDENCE.prefix, terminators);
      return makeNode(
        "UnaryExpr",
        { operator: "not", argument },
        t,
      );
    }
    case "-": {
      // Unary minus in non-call context; inside calls, prefer '(-x)' or '-5'.
      const argument = parseExpression(parser, PRECEDENCE.prefix, terminators);
      return makeNode(
        "UnaryExpr",
        { operator: "-", argument },
        t,
      );
    }
    default:
      throw parser.error(t, `Unexpected token '${t.type}' in expression.`);
  }
}

/* Infix operator precedence */

function getInfixPrecedence(type) {
  // Logical
  if (type === "OR") return PRECEDENCE.or;
  if (type === "AND") return PRECEDENCE.and;

  // Comparisons: lexer should emit textual operator types like "<", "<=", etc.
  if (
    type === "<" ||
    type === "<=" ||
    type === ">" ||
    type === ">=" ||
    type === "=" ||
    type === "!="
  ) {
    return PRECEDENCE.compare;
  }

  // Arithmetic
  if (type === "+" || type === "-") return PRECEDENCE.add;
  if (type === "*" || type === "/" || type === "%") return PRECEDENCE.mul;

  // '.' is handled specially as member access, not as a BinaryExpr.
  return 0;
}

/* Call expressions & arguments */

function canStartExpression(token) {
  if (!token) return false;
  switch (token.type) {
    case "IDENT":
    case "NUMBER":
    case "STRING":
    case "(":
    case "NOT":
      return true;
    // Note: we *do not* allow MINUS here for call arguments to avoid
    // ambiguities like 'f x - y'. Use '-5' or '(-x)' explicitly.
    default:
      return false;
  }
}

function canStartCallArgument(token, terminators) {
  if (!token) return false;
  if (terminators && terminators.has(token.type)) {
    return false;
  }
  if (token.type === "FLAG") {
    return true;
  }
  return canStartExpression(token);
}

function parseCallExpression(parser, callee, outerTerminators) {
  const args = [];
  let sawNonPositional = false;

  // Where does *this* call end?
  const callTerminators =
    outerTerminators || DEFAULT_EXPR_TERMINATORS;

  // Are commas available to this call as separators, or do they
  // belong to an outer call?
  //
  // If the outer terminators include ',', we're nested inside a
  // comma-separated argument list, so commas should *end* this call.
  const allowCommas = !outerTerminators || !outerTerminators.has(",");

  // When parsing a *single argument value*, we stop on:
  // - the same things that end the call
  // - comma (always ends the current argument value)
  // - FLAG: so nested calls don't steal flags that belong to the outer call
  const valueTerminators = new Set(callTerminators);
  valueTerminators.add(",");
  valueTerminators.add("FLAG");

  // You cannot tack more arguments directly onto a zero-argument call
  // result like 'foo () x'. You must write '(foo ()) x'.
  if (isZeroArgCallResultNeedingParens(callee)) {
    const t = parser.current();
    throw parser.error(
      t || callee,
      "Cannot pass arguments to the result of 'foo ()' without parentheses. " +
        "Write '(foo ()) x' if you want to call the result.",
    );
  }

  while (true) {
    const t = parser.current();
    if (!t || callTerminators.has(t.type)) {
      break;
    }

    if (!canStartCallArgument(t, callTerminators)) {
      break;
    }

    if (t.type === "FLAG") {
      // In a nested call (inside a comma-separated arg list), a FLAG
      // belongs to the *outer* call, so we end this call here.
      if (!allowCommas) {
        break;
      }

      parser.advance();
      const name = t.value;

      // Enum: -switch:on
      if (parser.at(":")) {
        parser.advance();
        const vTok = parser.current();
        if (!vTok || vTok.type !== "IDENT") {
          throw parser.error(
            vTok,
            "Expected enum value identifier after ':'.",
          );
        }
        parser.advance();
        args.push({
          kind: "enum",
          name,
          value: makeNode("EnumValue", { name: vTok.value }, vTok),
        });
        sawNonPositional = true;
      } else if (canStartExpression(parser.current())) {
        // Named argument: -name value
        const value = parseExpression(
          parser,
          PRECEDENCE.call,
          valueTerminators,
        );
        args.push({
          kind: "named",
          name,
          value,
        });
        sawNonPositional = true;
      } else {
        // Bare flag: -name
        args.push({
          kind: "flag",
          name,
        });
        sawNonPositional = true;
      }
    } else {
      // Positional argument.
      const expr = parseExpression(
        parser,
        PRECEDENCE.call,
        valueTerminators,
      );
      if (sawNonPositional) {
        // Special case to support:
        //   foo -verbose bar x, -switch:on
        // according to the language spec. Here the intended parse is:
        //   foo(-verbose: bar(x), -switch:on)
        //
        // Our normal rule is that positional arguments cannot follow
        // named / flag arguments. However, if:
        //   - the immediately preceding argument is a *named* argument,
        //   - its current value is a simple callee (identifier or member),
        //   - and the very next token is a comma (so this argument list
        //     is comma-separated),
        // then we reinterpret the pattern:
        //   -verbose <value>, <expr>,
        // as a nested call:
        //   -verbose <value>(<expr>),
        // and do *not* treat <expr> as a separate positional argument
        // to the outer call.
        const last = args[args.length - 1];
        const next = parser.current();
        const canNestAsCall =
          last &&
          last.kind === "named" &&
          isSimpleCallee(last.value) &&
          next &&
          next.type === ",";
        if (canNestAsCall) {
          last.value = makeNode(
            "CallExpr",
            {
              callee: last.value,
              args: [
                {
                  kind: "positional",
                  value: expr,
                },
              ],
            },
            last.value,
          );
          // We consumed <expr> as the argument to the nested call.
          // Do NOT push a new positional arg for the outer call.
        } else {
          throw parser.error(
            expr,
            "Positional arguments must appear before named or flag arguments.",
          );
        }
      } else {
        args.push({
          kind: "positional",
          value: expr,
        });
      }
    }

    if (parser.at(",")) {
      // If this is the *outermost* call in this context, the comma
      // separates its arguments. If we're nested inside a comma-
      // separated arg list, the comma belongs to the outer call and
      // should terminate this call instead.
      if (!allowCommas) {
        break;
      }
      parser.advance();
      continue;
    }
  }

  return makeNode("CallExpr", { callee, args }, callee);
}

function isSimpleCallee(node) {
  if (!node) return false;
  if (node.type === "Identifier") return true;
  if (node.type === "MemberExpr") return true;
  return false;
}

function isZeroArgCallResultNeedingParens(node) {
  return (
    node &&
    node.type === "CallExpr" &&
    node._fromEmptyParens &&
    !node._grouped
  );
}
