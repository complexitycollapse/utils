// parser.test.js
import { describe, it, expect } from "vitest";
import { parse } from "./parser.js";

// Remove location info so tests only assert structure.
function stripLoc(node) {
  if (Array.isArray(node)) {
    return node.map(stripLoc);
  }
  if (!node || typeof node !== "object") {
    return node;
  }
  const { line, column, length, _grouped, _fromEmptyParens, ...rest } = node;
  for (const key of Object.keys(rest)) {
    rest[key] = stripLoc(rest[key]);
  }
  return rest;
}

// Get the single expression from a one-line program.
function expr(source) {
  const program = stripLoc(parse(source));
  if (!program.body || program.body.length === 0) {
    throw new Error("No statements parsed");
  }
  const stmt = program.body[0];
  if (stmt.type !== "ExprStmt") {
    throw new Error(`Expected ExprStmt, got ${stmt.type}`);
  }
  return stmt.expression;
}

describe("parser – basic expressions from syntax.md", () => {
  it("parses a bare identifier as a variable access", () => {
    expect(expr("foo")).toEqual({
      type: "Identifier",
      name: "foo",
    });
  });

  it("parses (foo) as grouped variable access, not a call", () => {
    expect(expr("(foo)")).toEqual({
      type: "Identifier",
      name: "foo",
    });
  });

  it("parses ((foo)) as grouped variable access, not a call", () => {
    expect(expr("((foo))")).toEqual({
      type: "Identifier",
      name: "foo",
    });
  });

  it("parses member access x.foo as a MemberExpr, not a call", () => {
    expect(expr("x.foo")).toEqual({
      type: "MemberExpr",
      object: { type: "Identifier", name: "x" },
      property: { type: "Identifier", name: "foo" },
    });
  });
});

describe("parser – function call examples from syntax.md", () => {
  // 5. foo ()  # call a zero-argument function called foo
  it("parses 'foo ()' as a zero-argument CallExpr", () => {
    expect(expr("foo ()")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [],
    });
  });

  // 6. foo()  # identical to previous
  it("parses 'foo()' as the same zero-argument CallExpr as 'foo ()'", () => {
    expect(expr("foo()")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [],
    });
  });

  // 7. x.foo ()  # call a zero-argument member called foo
  it("parses 'x.foo ()' as a zero-argument CallExpr on a member", () => {
    expect(expr("x.foo ()")).toEqual({
      type: "CallExpr",
      callee: {
        type: "MemberExpr",
        object: { type: "Identifier", name: "x" },
        property: { type: "Identifier", name: "foo" },
      },
      args: [],
    });
  });

  // 8. foo x  # a function call with a positional argument
  it("parses 'foo x' as a CallExpr with one positional arg", () => {
    expect(expr("foo x")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "positional",
          value: { type: "Identifier", name: "x" },
        },
      ],
    });
  });

  // 9. foo x -verbose true
  it("parses 'foo x -verbose true' with positional + named argument", () => {
    expect(expr("foo x -verbose true")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "positional",
          value: { type: "Identifier", name: "x" },
        },
        {
          kind: "named",
          name: "verbose",
          value: { type: "Identifier", name: "true" },
        },
      ],
    });
  });

  // 10. (foo x -verbose true)
  it("parses '(foo x -verbose true)' identically to 'foo x -verbose true'", () => {
    const a = expr("foo x -verbose true");
    const b = expr("(foo x -verbose true)");
    expect(b).toEqual(a);
  });

  // 11. x.foo y
  it("parses 'x.foo y' as call on a member", () => {
    expect(expr("x.foo y")).toEqual({
      type: "CallExpr",
      callee: {
        type: "MemberExpr",
        object: { type: "Identifier", name: "x" },
        property: { type: "Identifier", name: "foo" },
      },
      args: [
        {
          kind: "positional",
          value: { type: "Identifier", name: "y" },
        },
      ],
    });
  });

  // 12. (foo x) y
  it("parses '(foo x) y' as nested call: (foo x) first, then apply to y", () => {
    expect(expr("(foo x) y")).toEqual({
      type: "CallExpr",
      callee: {
        type: "CallExpr",
        callee: { type: "Identifier", name: "foo" },
        args: [
          {
            kind: "positional",
            value: { type: "Identifier", name: "x" },
          },
        ],
      },
      args: [
        {
          kind: "positional",
          value: { type: "Identifier", name: "y" },
        },
      ],
    });
  });

  // 13. (foo ()) y
  it("parses '(foo ()) y' as nested zero-arg call then apply to y", () => {
    expect(expr("(foo ()) y")).toEqual({
      type: "CallExpr",
      callee: {
        type: "CallExpr",
        callee: { type: "Identifier", name: "foo" },
        args: [],
      },
      args: [
        {
          kind: "positional",
          value: { type: "Identifier", name: "y" },
        },
      ],
    });
  });

  // 14. foo -verbose true x  # invalid: positional after named
  it("rejects 'foo -verbose true x' (positional after named)", () => {
    expect(() => parse("foo -verbose true x")).toThrow(SyntaxError);
  });

  // 15. ()  # invalid, () must follow a head
  it("rejects bare '()' with no head", () => {
    expect(() => parse("()")).toThrow(SyntaxError);
  });

  // 16. foo () x  # invalid, () cannot be mixed with args
  it("rejects 'foo () x' (mixing () with further arguments)", () => {
    expect(() => parse("foo () x")).toThrow(SyntaxError);
  });

  // 17. foo x ()  # valid, x () is a nested zero-arg call
  it("parses 'foo x ()' as foo called with nested x()", () => {
    expect(expr("foo x ()")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "positional",
          value: {
            type: "CallExpr",
            callee: { type: "Identifier", name: "x" },
            args: [],
          },
        },
      ],
    });
  });

  // 18. foo -verbose bar ()  # valid, () groups with bar
  it("parses 'foo -verbose bar ()' with verbose = bar()", () => {
    expect(expr("foo -verbose bar ()")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "named",
          name: "verbose",
          value: {
            type: "CallExpr",
            callee: { type: "Identifier", name: "bar" },
            args: [],
          },
        },
      ],
    });
  });

  // 19. foo -verbose bar () -switch:on
  it("parses 'foo -verbose bar () -switch:on' with verbose = bar() and enum switch:on", () => {
    expect(expr("foo -verbose bar () -switch:on")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "named",
          name: "verbose",
          value: {
            type: "CallExpr",
            callee: { type: "Identifier", name: "bar" },
            args: [],
          },
        },
        {
          kind: "enum",
          name: "switch",
          value: {
            type: "EnumValue",
            name: "on",
          },
        },
      ],
    });
  });

  // 20. foo -verbose bar -switch:on  # valid, bar used as value
  it("parses 'foo -verbose bar -switch:on' with verbose = bar (no call)", () => {
    expect(expr("foo -verbose bar -switch:on")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "named",
          name: "verbose",
          value: { type: "Identifier", name: "bar" },
        },
        {
          kind: "enum",
          name: "switch",
          value: {
            type: "EnumValue",
            name: "on",
          },
        },
      ],
    });
  });

  // 21. foo -verbose bar x -switch:on  # invalid
  it("rejects 'foo -verbose bar x -switch:on' (bar and x treated as args, so x is illegal positional)", () => {
    expect(() => parse("foo -verbose bar x -switch:on")).toThrow(SyntaxError);
  });

  // 22. foo -verbose (bar x) -switch:on  # valid nested call
  it("parses 'foo -verbose (bar x) -switch:on' with verbose = bar(x)", () => {
    expect(expr("foo -verbose (bar x) -switch:on")).toEqual({
      type: "CallExpr",
      callee: { type: "Identifier", name: "foo" },
      args: [
        {
          kind: "named",
          name: "verbose",
          value: {
            type: "CallExpr",
            callee: { type: "Identifier", name: "bar" },
            args: [
              {
                kind: "positional",
                value: { type: "Identifier", name: "x" },
              },
            ],
          },
        },
        {
          kind: "enum",
          name: "switch",
          value: {
            type: "EnumValue",
            name: "on",
          },
        },
      ],
    });
  });

  // 27. foo () ()  # invalid, head is not a symbol/member
  it("rejects 'foo () ()' (head of second call is not symbol/member and not parenthesized)", () => {
    expect(() => parse("foo () ()")).toThrow(SyntaxError);
  });

  // 28. (foo ()) ()  # valid, parenthesized call used as head
  it("parses '(foo ()) ()' as call of result of foo()", () => {
    expect(expr("(foo ()) ()")).toEqual({
      type: "CallExpr",
      callee: {
        type: "CallExpr",
        callee: { type: "Identifier", name: "foo" },
        args: [],
      },
      args: [],
    });
  });
});

describe("parser – other syntax from syntax.md (non-exhaustive)", () => {
  it("parses an if with a colon block", () => {
    const program = stripLoc(
      parse(
        [
          "if x > y then:",
          "  do-something",
          "  do-something-else",
        ].join("\n"),
      ),
    );

    expect(program.body[0]).toMatchObject({
      type: "IfStmt",
      test: {
        type: "BinaryExpr",
        operator: ">",
      },
      consequent: {
        type: "BlockStmt",
        body: [
          {
            type: "ExprStmt",
            expression: {
              type: "Identifier",
              name: "do-something",
            },
          },
          {
            type: "ExprStmt",
            expression: {
              type: "Identifier",
              name: "do-something-else",
            },
          },
        ],
      },
    });
  });

  it("parses an inline-if single statement form", () => {
    const program = stripLoc(parse("if x > y then do-something"));
    expect(program.body[0]).toMatchObject({
      type: "IfStmt",
      test: {
        type: "BinaryExpr",
        operator: ">",
      },
      consequent: {
        type: "BlockStmt",
        body: [
          {
            type: "ExprStmt",
            expression: {
              type: "Identifier",
              name: "do-something",
            },
          },
        ],
      },
    });
  });

  it("rejects tabs in the source", () => {
    expect(() => parse("foo\tbar")).toThrow(SyntaxError);
  });

  it("respects arithmetic precedence (mul before add)", () => {
    const e = expr("1 + 2 * 3");
    expect(e).toMatchObject({
      type: "BinaryExpr",
      operator: "+",
      left: { type: "NumberLiteral", value: 1 },
      right: {
        type: "BinaryExpr",
        operator: "*",
        left: { type: "NumberLiteral", value: 2 },
        right: { type: "NumberLiteral", value: 3 },
      },
    });
  });

  it("parses logical operators with lower precedence than comparison", () => {
    const e = expr("a < b and c > d");
    expect(e).toMatchObject({
      type: "BinaryExpr",
      operator: "and",
      left: {
        type: "BinaryExpr",
        operator: "<",
      },
      right: {
        type: "BinaryExpr",
        operator: ">",
      },
    });
  });
});
