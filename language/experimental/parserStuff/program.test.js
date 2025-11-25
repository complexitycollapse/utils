import { it, describe, expect } from "vitest";
import { program } from "./program.js";

function parse(source) {
  const parsed = program(source);
  expect(parsed).toBeTruthy();
  expect(parsed).toHaveProperty("type", "program");
  return parsed;
}

function stmt(source) {
  const parsed = parse(source);
  expect(parsed.stmts).toHaveLength(1);
  expect(parsed.stmts[0]).toHaveProperty("type", "statement");
  return parsed.stmts[0];
}

function expr(source) {
  const s = stmt(source);
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
});
