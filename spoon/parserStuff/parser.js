import { tokenize } from "../lexer.js";

export function parse(source) {
  const tokens = tokenize(source);
  const parser = createParser(tokens);
  return parser;
}

function createParser(tokens) {
  let obj = {
    groupingDepth: 0,
    ignoredIndents: 0,
    delimiterStack: [],
    index: 0,
    nuds: new Map(),
    leds: new Map()
  };
  function pushDelimiters(delimiters) { obj.delimiterStack.unshift(new Set(delimiters)); }
  function popDelimiters() { obj.delimiterStack.shift(); }
  function isDelimiter(t) { return obj.delimiterStack[0] && obj.delimiterStack[0].has(t.type); }

  function check(offset = 0) {
    if (obj.index + offset >= tokens.length) {
      throw new Error("Parser has gone over the end");
    }
  }

  function current() {
    check();
    return tokens[obj.index];
  }

  function peek(offset = 1) {
    check(offset);
    return tokens[obj.index + offset];
  }

  function at(type) {
    check();
    return current().type === type;
  }

  function skipLineNoise() {
    if (obj.groupingDepth === 0) { return; }
    let t = tokens[obj.index];
    while(t.type === "NEWLINE" || t.type === "DEDENT" || t.type === "INDENT") {
      if (t.type === "INDENT") { obj.ignoredIndents++; }
      if (t.type === "DEDENT") { obj.ignoredIndents--; }
      ++obj.index
      t = tokens[obj.index];
    }
  }

  function atNext(type) {
    check(1);
    return peek().type === type;
  }

  function advance() {
    return tokens[obj.index++];
  }

  /**
   * Line continuations are allowed to be more or less indented than the line the continue, which causes the
   * lexer to generate indents and dedents when the line is completed. This fn detects them and drops them.
   */
  function skipContinuedLineExcessIndentation() {
    while (obj.ignoredIndents > 0 && current().type === "DEDENT") {
      ++obj.index;
      --obj.ignoredIndents;
    }
    while (obj.ignoredIndents < 0 && current().type === "INDENT") {
      ++obj.index;
      ++obj.ignoredIndents;
    }
  }

  function expect(type, message) {
    const t = current();
    if (!t || t.type !== type) {
      throw syntaxError(t,
        message || `Expected ${type}, got ${t ? t.type : "EOF"}.`,
      );
    }
    obj.index += 1;
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

  function makeNode(type, props, loc) {
    const node = {
      type,
      ...props
    };
    if (loc) {
      node.line = loc.line;
      node.column = loc.column;
    }

    return node;
  }

  function skipEmptyLines() {
    while (at("NEWLINE")) {
      advance();
    }
  }

  Object.defineProperties(obj, Object.getOwnPropertyDescriptors({ tokens, get current() { return current(); }, peek, at, atNext, advance,
  expect, syntaxError, makeNode, tokens, skipContinuedLineExcessIndentation, skipLineNoise,
  pushDelimiters, popDelimiters, isDelimiter, skipEmptyLines }));

  return obj;
}
