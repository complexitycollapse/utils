import { it, describe, expect } from "vitest";
import { program } from "./program.js";

function parse(source) {
  const parsed = program(source);
  expect(parsed).toBeTruthy();
  expect(parsed).toHaveProperty("type", "program");
  return parsed;
}

function stmts(source) {
  const parsed = parse(source);
  return parsed.stmts;
}

function stmt(source) {
  const s = stmts(source);
  expect(s).toHaveLength(1);
  return s[0];
}

function expr(source) {
  const s = stmt(source);
  expect(s).toHaveProperty("type", "expression statement");
  expect(s.expression).toBeTruthy();
  return s.expression;
}

describe("Single tokens", () => {
  it ("foo returns identifier", () => {
    expect(expr("foo")).toMatchObject({ type: "identifier", name: "foo"});
  });

  it ("newline then foo returns identifier", () => {
    expect(expr("\nfoo")).toMatchObject({ type: "identifier", name: "foo"});
  });

  it ("123 returns number", () => {
    expect(expr("123")).toMatchObject({ type: "number", value: 123});
  });

  it ("-123 returns number", () => {
    expect(expr("-123")).toMatchObject({ type: "number", value: -123});
  });

  it ("-123.45 returns number", () => {
    expect(expr("-123.45")).toMatchObject({ type: "number", value: -123.45});
  });

  it ("(foo) returns identifier", () => {
    expect(expr("(foo)")).toMatchObject({ type: "identifier", name: "foo"});
  });

  it ("(123) returns number", () => {
    expect(expr("(123)")).toMatchObject({ type: "number", value: 123});
  });
});

describe("Arithmetic expressions", () => {
  it("1 + 2", () => {
    expect(expr("1 + 2")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: { value: 1 },
      right: { value: 2 }
    });
  });

  it("1 * 2", () => {
    expect(expr("1 * 2")).toMatchObject({
      type: "binary operator",
      operator: "*",
      left: { value: 1 },
      right: { value: 2 }
    });
  });

  it("1 + 2 * 3", () => {
    expect(expr("1 + 2 * 3")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: { value: 1 },
      right: {
        type: "binary operator",
        operator: "*",
        left: { value: 2 },
        right: { value: 3 }
      }
    });
  });

  it("1 * 2 + 3", () => {
    expect(expr("1 * 2 + 3")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: {
        type: "binary operator",
        operator: "*",
        left: { value: 1 },
        right: { value: 2 }
      },
      right: { value: 3 }
    });
  });

  it("1 * (2 + 3)", () => {
    expect(expr("1 * (2 + 3)")).toMatchObject({
      type: "binary operator",
      operator: "*",
      left: { value: 1 },
      right: {
        type: "binary operator",
        operator: "+",
        left: { value: 2 },
        right: { value: 3 }
      }
    });
  });

  it("1 +\\n 2 throws error as expr is split across lines", () => {
    expect(() => program("1 +\n 2")).toThrow();
  });

  it("(1 + \\n2) is valid because lines are grouped", () => {
    expect(expr("(1 + \n2)")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: { value: 1 },
      right: { value: 2 }
    });
  });

  it("(1 +\\n 2) is valid because lines are grouped", () => {
    expect(expr("(1 +\n 2)")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: { value: 1 },
      right: { value: 2 }
    });
  });

  it("(1\\n * 2\\n  + 3) is valid because lines are grouped", () => {
    expect(expr("(1\n * 2\n  + 3)")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: {
        type: "binary operator",
        operator: "*",
        left: { value: 1 },
        right: { value: 2 }
      },
      right: { value: 3 }
    });
  });

  it("(1\\n * 2\\n  +\\n 3) is valid because lines are grouped", () => {
    expect(expr("(1\n * 2\n  +\n 3)")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: {
        type: "binary operator",
        operator: "*",
        left: { value: 1 },
        right: { value: 2 }
      },
      right: { value: 3 }
    });
  });
});

describe("Logical expressions", () => {
  it("true", () => {
    expect(expr("true")).toMatchObject({ type: "boolean", value: true });
  });

  it("false", () => {
    expect(expr("false")).toMatchObject({ type: "boolean", value: false });
  });

  it("false or true", () => {
    expect(expr("false or true")).toMatchObject({
      type: "binary operator",
      operator: "or",
      left: { value: false },
      right: { value: true }
    });
  });

  it("not true", () => {
    expect(expr("not true")).toMatchObject({
      type: "prefix",
      right: { value: true }
    });
  });

  it("x < y", () => {
    expect(expr("x < y")).toMatchObject({
      type: "binary operator",
      left: { name: "x" },
      right: { name: "y" }
    });
  });

  it("not x < y", () => {
    expect(expr("not x < y")).toMatchObject({
      type: "prefix",
      operator: "not",
      right: {
        type: "binary operator",
        operator: "<",
        left: { name: "x" },
        right: { name: "y" }
      }});
  });

  it("x < y and y > z", () => {
    expect(expr("x < y and y > z")).toMatchObject({
      type: "binary operator",
      operator: "and",
      left: {
        operator: "<",
        left: { name: "x" },
        right: { name: "y" }
      },
      right: {
        operator: ">",
        left: { name: "y" },
        right: { name: "z" }
      }});
  });
});

describe("statement blocks", () => {
  it("if x then y", () => {
    expect(stmt("if x then y")).toMatchObject({
      type: "if statement",
      test: { name: "x" },
      consequent: [{ expression: { name: "y" }}]
    });
  });

  it("if x > y then z", () => {
    expect(stmt("if x > y then z")).toMatchObject({
      type: "if statement",
      test: {
        operator: ">",
        left: { name: "x" },
        right: { name: "y" }},
      consequent: [{ expression: { name: "z" }}]
    });
  });

  it("if x > y then:\\n  z", () => {
    expect(stmt("if x > y then:\n  z")).toMatchObject({
      type: "if statement",
      test: {
        operator: ">",
        left: { name: "x" },
        right: { name: "y" }},
      consequent: [{ expression: { name: "z" }}]
    });
  });

  it("if x > y then:\\n  a\\n  b\\n  c", () => {
    expect(stmt("if x > y then:\n  a\n  b\n  c")).toMatchObject({
      type: "if statement",
      consequent: [
        { expression: { name: "a" }},
        { expression: { name: "b" }},
        { expression: { name: "c" }}
      ]});
  });

  it("if x > y then:\\n  a\\n  b\\nc", () => {
    expect(stmts("if x > y then:\n  a\n  b\nc")).toMatchObject([{
      type: "if statement",
      consequent: [
        { expression: { name: "a" }},
        { expression: { name: "b" }}
      ]},
      { expression: { type: "identifier", name: "c" }}
    ]);
  });

  it("if x then if y then z", () => {
    expect(stmt("if x then if y then z")).toMatchObject({
      type: "if statement",
      test: { name: "x" },
      consequent: [{
        type: "if statement",
        test: { name: "y" },
        consequent: [{ expression: { name: "z" }}]
      }]});
  });
});

describe("continued statements", () => {
  it("continued if", () => {
    expect(stmt("if x \n  then y")).toMatchObject({
      test: { name: "x" },
      consequent: [{ expression: { name: y }}] 
    });
  });
});