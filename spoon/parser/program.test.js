import { it, describe, expect } from "vitest";
import { parseModule } from "./module.js";

function parse(source) {
  const parsed = parseModule(source, ["x", "y", "z" , "foo", "bar", "baz", "a", "b", "c"]);
  expect(parsed).toBeTruthy();
  expect(parsed).toHaveProperty("type", "module");
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

describe("Simple tokens", () => {
  it ("foo returns identifier", () => {
    expect(expr("foo")).toMatchObject({ type: "identifier", name: "foo"});
  });

  it ("newline then foo returns identifier", () => {
    expect(expr("\nfoo")).toMatchObject({ type: "identifier", name: "foo"});
  });

   it ("foo the newlines returns identifier", () => {
    expect(expr("foo\n\n\n")).toMatchObject({ type: "identifier", name: "foo"});
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

  it("1 + \\n2 throws as expr is split across lines", () => {
    expect(() => program("1 + \n2")).toThrow();
  });

  it("1 +\\n 2 doesn't throw an error as the line continues at the indent", () => {
    expect(expr("1 +\n 2")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: { value: 1 },
      right: { value: 2 }
    });
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
    expect(expr("if x then y")).toMatchObject({
      type: "if expression",
      test: { name: "x" },
      consequent: { expression: { name: "y" }}
    });
  });

  it("if x > y then z", () => {
    expect(expr("if x > y then z")).toMatchObject({
      type: "if expression",
      test: {
        operator: ">",
        left: { name: "x" },
        right: { name: "y" }},
      consequent: { expression: { name: "z" }}
    });
  });

  it("if x > y then:\\n  z", () => {
    expect(expr("if x > y then:\n  z")).toMatchObject({
      type: "if expression",
      test: {
        operator: ">",
        left: { name: "x" },
        right: { name: "y" }},
      consequent: { type: "statement block", stmts: [{ expression: { name: "z" }}]}
    });
  });

  it("if x > y then:\\n  a\\n  b\\n  c", () => {
    expect(expr("if x > y then:\n  a\n  b\n  c")).toMatchObject({
      type: "if expression",
      consequent: { stmts: [
        { expression: { name: "a" }},
        { expression: { name: "b" }},
        { expression: { name: "c" }}
      ]}});
  });

  it("if x > y then:\\n  a\\n  b\\nc", () => {
    expect(stmts("if x > y then:\n  a\n  b\nc")).toMatchObject([
      {
        type: "expression statement",
        expression: {
        type: "if expression",
        consequent: { stmts: [
          { expression: { name: "a" }},
          { expression: { name: "b" }}
        ]}}
      },
      { expression: { type: "identifier", name: "c" }}
    ]);
  });

  it("if x then if y then z", () => {
    expect(expr("if x then if y then z")).toMatchObject({
      type: "if expression",
      test: { name: "x" },
      consequent: {
        type: "expression statement",
        expression: {
          type: "if expression",
          test: { name: "y" },
          consequent: { expression: { name: "z" }}
     }}});
  });
});

describe("continued statements", () => {
  it("if x \\n  then y", () => {
    expect(expr("if x \n  then y")).toMatchObject({
      test: { name: "x" },
      consequent: { expression: { name: "y" }}
    });
  });

  it("if x \nthen y throws", () => {
    expect(() => parse("if x \nthen y")).toThrow();
  });

  it("if\\n x then y", () => {
    expect(expr("if\n x then y")).toMatchObject({
      test: { name: "x" },
      consequent: { expression: { name: "y" }}
    });
  });

  it("if x then\\n y", () => {
    expect(expr("if x then\n y")).toMatchObject({
      test: { name: "x" },
      consequent: { expression: { name: "y" }}
    });
  });

  it("if x +\\n y then z", () => {
    expect(expr("if x +\n y then z")).toMatchObject({
      test: { left: { name: "x" }, right: { name: "y" }},
      consequent: { expression: { name: "z" }}
    });
  });

  it("(if x then y)", () => {
    expect(expr("(if x then y)")).toMatchObject({
      test: { name: "x" },
      consequent: { expression: { name: "y" }}
    });
  });

  it("(if x \\nthen y)", () => {
    expect(expr("(if x \nthen y)")).toMatchObject({
      test: { name: "x" },
      consequent: { expression: { name: "y" }}
    });
  });

  it("(if x \\nthen:\\n y)", () => {
    expect(expr("(if x then:\n y)")).toMatchObject({
      test: { name: "x" },
      consequent: { stmts: [{ expression: { name: "y" }}]}
    });
  });
});

describe("member access", () => {
  it("x.y", () => {
    expect(expr("x.y")).toMatchObject({
      type: "member access",
      left: { name: "x" },
      right: "y"
    });
  });

  it("x.y.z", () => {
    expect(expr("x.y.z")).toMatchObject({
      type: "member access",
      left: {
        type: "member access",
        left: { name: "x" },
        right: "y"
      },
      right: "z"
    });
  });

  it("(x + y).z", () => {
    expect(expr("(x + y).z")).toMatchObject({
      type: "member access",
      left: {
        type: "binary operator",
        left: { name: "x" },
        right: {name: "y" }
      },
      right: "z"
    });
  });
});

describe("zero argument calls", () => {
  it("foo ()", () => {
    expect(expr("foo ()")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: []
    });
  });

  it("foo.bar ()", () => {
    expect(expr("foo.bar ()")).toMatchObject({
      type: "call",
      head: { type: "member access" },
      args: []
    });
  });

  it("(foo ()) ()", () => {
    expect(expr("(foo ()) ()")).toMatchObject({
      type: "call",
      head: { type: "call" },
      args: []
    });
  });

  it("foo () x throws", () => {
    expect(() => parse("foo () x")).toThrow();
  });

  it("foo x () throws", () => {
    expect(() => parse("foo x ()")).toThrow();
  });

  it("foo () () throws", () => {
    expect(() => parse("foo () ()")).toThrow();
  });

  it("foo () + x", () => {
    expect(expr("foo () + x")).toMatchObject({
      type: "binary operator",
      operator: "+",
      left: { type: "call" },
      right: { name: "x" }
    });
  });

  it("x + foo ()", () => {
    expect(expr("x + foo ()")).toMatchObject({
      type: "binary operator",
      operator: "+",
      right: { type: "call" },
      left: { name: "x" }
    });
  });
});

describe("positional arguments", () => {
  it("foo x", () => {
    expect(expr("foo x")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ type: "positional", value: { name: "x" }}]
    });
  });

  it("foo 123", () => {
    expect(expr("foo 123")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ type: "positional", value: { value: 123 }}]
    });
  });

  it("(foo x)", () => {
    expect(expr("(foo x)")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ type: "positional", value: { name: "x" }}]
    });
  });

  it("(foo 123)", () => {
    expect(expr("(foo 123)")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ type: "positional", value: { value: 123 }}]
    });
  });

  it("(foo \\nx)", () => {
    expect(expr("(foo \nx)")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ value: { name: "x" }}]
    });
  });

  it("foo\\n x", () => {
    expect(expr("foo\n x")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ value: { name: "x" }}]
    });
  });

  it("foo \\nx parses are two separate statements", () => {
    expect(stmts("foo \nx")).toHaveLength(2);
  });

  it("foo x + 5", () => {
    expect(expr("foo x + 5")).toMatchObject({
      type: "binary operator",
      left: {
        type: "call",
        args: [{ value: { name: "x" }}]
       },
      right: { value: 5 }
    });
  });

  it("5 + foo x", () => {
    expect(expr("5 + foo x")).toMatchObject({
      type: "binary operator",
      right: {
        type: "call",
        args: [{ value: { name: "x" }}]
       },
      left: { value: 5 }
    });
  });

  it("foo x y", () => {
    expect(expr("foo x y")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ value: { name: "x" }}, { value: { name: "y" }}]
    });
  });

  it("foo x.y", () => {
    expect(expr("foo x.y")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ value: { type: "member access" }}]
    });
  });

  it("foo x.y z", () => {
    expect(expr("foo x.y z")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ value: { type: "member access" }}, { value: { name: "z" }}]
    });
  });

  it("foo z x.y", () => {
    expect(expr("foo z x.y")).toMatchObject({
      type: "call",
      head: { name: "foo" },
      args: [{ value: { name: "z" }}, { value: { type: "member access" }}]
    });
  });

  it("bar (foo x)", () => {
    expect(expr("bar (foo x)")).toMatchObject({
      type: "call",
      args: [{ value: {
        type: "call",
        head: { name: "foo" },
        args: [{ value: { name: "x" }}]
      }}]
    });
  });

  it("if foo x then bar y", () => {
    expect(expr("if foo x then bar y")).toMatchObject({
      type: "if expression",
      test: { type: "call" },
      consequent: { expression: { type: "call" }}
    });
  });

  it("if foo x then:\n bar y", () => {
    expect(expr("if foo x then bar y")).toMatchObject({
      type: "if expression",
      test: { type: "call" },
      consequent: { expression: { type: "call" }}
    });
  });
});

describe("named arguments", () => {
  it ("foo -switch1", () => {
    expect(expr("foo -switch1")).toMatchObject({
      type: "call",
      args: [{ type: "switch", name: "switch1"}
    ]});
  });

  it ("foo -switch1 -switch2", () => {
    expect(expr("foo -switch1 -switch2")).toMatchObject({
      type: "call",
      args: [
        { type: "switch", name: "switch1"},
        { type: "switch", name: "switch2"}
    ]});
  });

  it ("foo -enum:123 throws", () => {
    expect(() => parse("foo -enum:123")).toThrow();
  });

  it ("foo -enum: throws", () => {
    expect(() => parse("foo -enum:")).toThrow();
  });

  it ("foo -enum: -switch throws", () => {
    expect(() => parse("foo -enum: -switch")).toThrow();
  });

  it ("foo -en:foo", () => {
    expect(expr("foo -en:foo")).toMatchObject({
      type: "call",
      args: [{ type: "enum", name: "en", value: "foo"}]
    });
  });

  it ("foo -nmd foo", () => {
    expect(expr("foo -nmd foo")).toMatchObject({
      type: "call",
      args: [{ type: "named", name: "nmd", value: { name: "foo" }}]
    });
  });

  it ("foo -nmd 123", () => {
    expect(expr("foo -nmd 123")).toMatchObject({
      type: "call",
      args: [{ type: "named", name: "nmd", value: { value: 123 }}]
    });
  });

  it ("foo -nmd (bar x)", () => {
    expect(expr("foo -nmd (bar x)")).toMatchObject({
      type: "call",
      args: [{ type: "named", name: "nmd", value: { type: "call" }}]
    });
  });

  it ("foo bar -nmd foo", () => {
    expect(expr("foo bar -nmd foo")).toMatchObject({
      type: "call",
      args: [
        { type: "positional", value: {name: "bar" }},
        { type: "named", name: "nmd", value: { name: "foo" }}
    ]});
  });

  it ("foo -nmd bar x throws", () => {
    expect(() => parse("foo -nmd bar x")).toThrow();
  });

  it ("foo -nmd 123 + 456", () => {
    expect(expr("foo -nmd 123 + 456")).toMatchObject({
      type: "binary operator",
      left: {
        type: "call",
        args: [{ type: "named", name: "nmd", value: { value: 123 }}]
      },
      right: { value: 456 }
    });
  });
});

describe("binding", () => {
  it("unbound variables", () => {
    expect(() => expr("ux")).toThrow();
    expect(() => expr("uy")).toThrow();
    expect(() => expr("uz")).toThrow();
  });

  it("x: 123 is an expression", () => {
    expect(expr("x: 123")).toMatchObject({
      type: "binding",
      bindings : [{
        pattern: { value: { name: "x"}},
        value: { type: "number", value: 123}
    }]});
  });

  it("x {number}: 123 correctly captures the type", () => {
    expect(expr("x {number}: 123")).toMatchObject({
      type: "binding",
      bindings : [{
        pattern: { value: { name: "x"}, patternType: { name: "number", typeArgs: []}},
        value: { type: "number", value: 123}
    }]});
  });

  it("x {fooConstr number string}: 123 correctly captures the type arguments", () => {
    expect(expr("x {fooConstr number string}: 123")).toMatchObject({
      bindings : [{
        pattern: { patternType: { name: "fooConstr", typeArgs: ["number", "string"] }}
      }]});
  });

  it("x: y: 123 associates to the right", () => {
    expect(expr("x: y: 123")).toMatchObject({
      type: "binding",
      bindings: [{
        pattern: { value: { name: "x"}},
        value: {
          type: "binding",
          bindings: [{
            pattern: { value: { name: "y"}},
            value: { type: "number", value: 123}
          }]
        }}]
      });
  });

  it("ux: 123 binds a name at the top level", () => {
    expect(() => parse("ux: 123\nux")).not.toThrow();
  });

  it("Unbound symbols report an error", () => {
    expect(() => parse("ux: 123\nuy")).toThrow();
  });

  it("Top level variable cannot be used before binding", () => {
    expect(() => parse("ux\nx: 123")).toThrow();
  });

  it("Variable can be bound in statement block", () => {
    expect(() => parse("if x then:\n  ux: 123\n  ux")).not.toThrow();
  });

  it("Variable bound in statement block has block scope", () => {
    expect(() => parse("if x then:\n  ux: 123\nux")).toThrow();
  });

  it("Block-scoped variable cannot be used before binding", () => {
    expect(() => parse("if x then:\n  ux\n  ux: 123")).toThrow();
  });

  it("IF test bindings are visible in consequent", () => {
    expect(() => parse("if ux: x then ux")).not.toThrow();
  });

  it("IF test bindings are visible in block consequent", () => {
    expect(() => parse("if ux: x then:\n ux")).not.toThrow();
  });

  it("Compound bindings will bind all variables", () => {
    expect(() => parse("ux: 1, uy: 2, uz: 3\nux\nuy\nuz")).not.toThrow();
  });

  it("Compound bindings with types correctly type all variables", () => {
    expect(expr("ux {number}: 1, uy {string}: \"str\"")).toMatchObject({
      bindings : [
        { pattern: { patternType: { name: "number" }}},
        { pattern: { patternType: { name: "string" }}}
      ]
    });
  });

  it("Binds strongly to the left", () => {
    expect(expr("x + y: 123")).toMatchObject({
      left: { name: "x" },
      right: { bindings: [{ pattern: { value: { name: "y"}}}]}
    });
  });

  it("Binds weakly to the right", () => {
    expect(expr("x: y + z")).toMatchObject({
      type: "binding",
      bindings: [{ 
        pattern: { value: { name: "x"}},
        value: {
          left: { name: "y" },
          right: { name: "z" }
        }
       }]      
    });
  });

  it("Binds weakly to the right but not as weakly as comma", () => {
    expect(expr("x: y + z, y: z")).toMatchObject({
      type: "binding",
      bindings: [{ 
        pattern: { value: { name: "x"}},
        value: {
          left: { name: "y" },
          right: { name: "z" }
        }
       }, {
        pattern: { value: { name: "y"}},
        value: { name: "z" }
       }]      
    });
  });
});

describe("anonymous functions", () => {
  function fn(source) {
    const exp = expr("newsym:" + source);
    expect(exp.type).toBe("binding");
    let result = exp.bindings[0].value;
    return result;
  }

  it("zero-argument inline", () => {
    expect(fn("fn => x + y")).toMatchObject({
      type: "function",
      parameters: [],
      body: { expression: { left: { name: "x" }, right: { name: "y" }}}
    });
  });

  it("simple argument inline", () => {
    expect(fn("fn x => x + y")).toMatchObject({
      type: "function",
      parameters: [{ type: "parameter", pattern: { type: "typed pattern", value: { name: "x" }}}],
      body: { expression: { left: { name: "x" }, right: { name: "y" }}}
    });
  });

  it("two simple arguments inline", () => {
    expect(fn("fn x, y => x + y")).toMatchObject({
      type: "function",
      parameters: [{ pattern: { value: { name: "x" }}}, { pattern: { value: { name: "y" }}}],
      body: { expression: { left: { name: "x" }, right: { name: "y" }}}
    });
  });

  it("typed arg inline", () => {
    expect(fn("fn x {number}:\n x + y")).toMatchObject({
      type: "function",
      parameters: [
        { pattern: { value: { name: "x" }, patternType: { name: "number", typeArgs: [] }}}
      ]
    });
  });

  it("arg with default inline", () => {
    expect(fn("fn x = 10:\n x + y")).toMatchObject({
      type: "function",
      parameters: [{
        pattern: { value: { name: "x" }},
        defaultValueExpression: { type: "number", value: 10}
      }]
    });
  });

  it("arg with default and type inline", () => {
    expect(fn("fn x {number} = 10:\n x + y")).toMatchObject({
      type: "function",
      parameters: [{
        pattern: { value: { name: "x" }, patternType: { name: "number", typeArgs: [] }},
        defaultValueExpression: { type: "number", value: 10} }]
    });
  });

  it("anonymous enum typed arg inline", () => {
    expect(fn("fn x (a|b|c):\n x + y")).toMatchObject({
      // TODO: need to check the type of the pattern
      parameters: [{ pattern: { value: { name: "x" }}}]
    });
  });

  it("anonymous enum typed arg with default inline", () => {
    expect(fn("fn x (a|b|c) = a:\n x + y")).toMatchObject({
      // TODO: same as above
      parameters: [{ pattern: { value: { name: "x" }}, defaultValueExpression: { name: "a" } }]
    });
  });

  it("anonymous enum typed arg with invalid default inline", () => {
    expect(() => fn("fn x (a|b|c) = d:\n x + y")).toThrow();
  });

  it("zero-argument block", () => {
    expect(fn("fn :\n x + y\n z")).toMatchObject({
      type: "function",
      parameters: [],
      body: { type: "statement block", stmts: [{
        type: "expression statement" },
        { type: "expression statement" }
      ]}
    });
  });

  it("simple argument block", () => {
    expect(fn("fn x:\n x + y\n z")).toMatchObject({
      type: "function",
      parameters: [{ pattern: { value: { name: "x" }}}],
      body: { type: "statement block", stmts: [{
        type: "expression statement" },
        { type: "expression statement" }
      ]}
    });
  });

  it("can use parameter in fn body", () => {
    expect(() => fn("fn p:\n p")).not.toThrow();
  });

  it("can't use undeclared symbol in fn body", () => {
    expect(() => fn("fn p:\n undec")).toThrow();
  });

  it("positional argument", () => {
    expect(fn("fn x:\n x")).toMatchObject({ parameters: [{ positional: true }]});
  });

  it("named argument", () => {
    expect(fn("fn -x:\n x")).toMatchObject({ parameters: [{ positional: false }]});
  });

  it("arrow function", () => {
    expect(fn("fn -x => x")).toMatchObject({ parameters: [{ positional: false }]});
  });

  it("arrow function with newline", () => {
    expect(fn("fn -x =>\n x")).toMatchObject({ parameters: [{ positional: false }]});
  });

  it("params must be followed by arrow or colon", () => {
    expect(() => fn("fn -x x")).toThrow();
  });

  it("function with return type", () => {
    expect(fn("fn {string} x =>\n x")).toMatchObject({
      returnType: { name: "string", typeArgs: [] }
    });
  });
});

describe("function definition statements", () => {
  function fn(source) {
    const s = stmt(source);
    expect(s.type).toBe("function definition");
    return s.fn;
  }

  it("has correct name", () => {
    expect(stmt("def quux:\n x + y")).toHaveProperty("name", "quux");
  });

  it("has type function definition", () => {
    expect(stmt("def quux:\n x + y")).toHaveProperty("type", "function definition");
  });

  it("binds the given name", () => {
    expect(() => stmts("def quux:\n x\nquux")).not.toThrow();
  });

  it("zero-argument inline", () => {
    expect(fn("def quux => x + y")).toMatchObject({
      type: "function",
      parameters: [],
      body: { expression: { left: { name: "x" }, right: { name: "y" }}}
    });
  });

  it("simple argument inline", () => {
    expect(fn("def quux x => x + y")).toMatchObject({
      type: "function",
      parameters: [{ pattern: {value: { name: "x" }}}],
      body: { expression: { left: { name: "x" }, right: { name: "y" }}}
    });
  });

  it("two simple arguments inline", () => {
    expect(fn("def quux x, y => x + y")).toMatchObject({
      type: "function",
      parameters: [{ pattern: {value: { name: "x" }}}, { pattern: {value: { name: "y" }}}],
      body: { expression: { left: { name: "x" }, right: { name: "y" }}}
    });
  });

  it("zero-argument block", () => {
    expect(fn("def quux:\n x + y\n z")).toMatchObject({
      parameters: [],
      body: { type: "statement block", stmts: [{
        type: "expression statement" },
        { type: "expression statement" }
      ]}
    });
  });

  it("simple argument block", () => {
    expect(fn("def quux x:\n x + y\n z")).toMatchObject({
      parameters: [{ pattern: {value: { name: "x" }}}],
      body: { type: "statement block", stmts: [{
        type: "expression statement" },
        { type: "expression statement" }
      ]}
    });
  });

  it("can use parameter in fn body", () => {
    expect(() => ("def quux p:\n p")).not.toThrow();
  });

  it("can't use undeclared symbol in fn body", () => {
    expect(() => fn("def quux p:\n undec")).toThrow();
  });

  it("function definition with return type", () => {
    expect(fn("def quux {string} x =>\n x")).toMatchObject({
      returnType: { name: "string", typeArgs: [] }
    });
  });
});

describe("union", () => {
  it("simple union has correct type, name, constructor", () => {
    expect(stmt("union foo:\n con1")).toMatchObject({
      type: "union",
      name: "foo",
      constructors: [{
        type: "constructor",
        name: "con1"
      }]
    });
  });

  it("union with type parameters", () => {
    expect(stmt("union foo x, y, z:\n con1")).toMatchObject({
      typeParams: [{ name: "x" }, { name: "y" }, { name: "z" }]
    });
  });

  it("union with multiple constructors", () => {
    expect(stmt("union foo:\n con1\n con2\n con3")).toMatchObject({
      constructors: [{ name: "con1" }, { name: "con2" }, { name: "con3" }]
    });
  });

  it("union with parameterised constructor", () => {
    expect(stmt("union foo:\n con1 x, y")).toMatchObject({
      constructors: [{ name: "con1", params: [
        { pattern: { value: { name: "x"}}},
        { pattern: { value: { name: "y"}}}]
      }]
    });
  });

  it("union with typed parameterised constructor", () => {
    expect(stmt("union foo:\n con1 x {string}, y {number}")).toMatchObject({
      constructors: [{ name: "con1", params: [
        { pattern: { value: { name: "x"}, patternType: { name: "string", typeArgs: [] }}},
        { pattern: { value: { name: "y"}, patternType: { name: "number", typeArgs: [] }}}]
      }]
    });
  });

  it("constructor symbols are bound", () => {
    expect(() => stmts("union foo:\n con1\n con2 a, b\ncon1\ncon2 1 2")).not.toThrow();
  });

  it("constructors can be used in expressions", () => {
    expect(() => stmts("union foo:\n con1 a, b\nx + (con1 4 5)")).not.toThrow();
  });
});
