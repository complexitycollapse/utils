import { useState, useEffect } from "react";
import { Lexer } from "./lexer";
import { TestLexerNoSigns } from "./test-lexer";

export function PrattParserComponent() {
  const [code, setCode] = useState("");
  const [tree, setTree] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const tree = new Parser(code);
      setTree(tree);

      setError(null);
    } catch (error) {
      setError(error.message);
    }
  }, [code]);

  return (
    <div>
      <h1>Pratt Parser</h1>
      <textarea
        className="lexer-input"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div className="token-list">
      {tree.errorMessage ? <div className="token error">{tree?.toString()}</div> :
          <div className="token">{tree?.toString()}</div>}
      </div>
    </div>
  );
}

export function Parser(text) {
  const lexer = new Lexer(TestLexerNoSigns, text);
  const symbolTable = {};
  let token, scope;

  function pushScope() {
    scope = Scope(scope);
  }

  function popScope() {
    scope = scope.parent;
  }

  function symbol (id, bp) {
    var symbol = symbolTable[id];
    bp = bp || 0;
    if (symbol) {
        if (bp >= symbol.lbp) {
            symbol.lbp = bp;
        }
    } else {
        symbol = Object.create(prototypeSymbol);
        symbol.id = symbol.value = id;
        symbol.lbp = bp;
        symbolTable[id] = symbol;
    }
    return symbol;
  };

  symbol("(end)");
  symbol("(name)");
  const lit = symbol("(literal)");
  var itself = function () {
    return this;
  };
  lit.nud = itself;

  function advance (id) {
    let arity, prototype, lexeme, value;
    if (id && token.id !== id) {
        token.error("Expected '" + id + "'.");
    }

    lexeme = lexer.next();
    if (lexeme === undefined) {
        token = symbolTable["(end)"];
        return;
    }

    value = lexeme.value;
    arity = lexeme.type;

    if (arity === "name") {
        prototype = scope.find(value);
    } else if (arity === "operator") {
        prototype = symbolTable[value];
        if (!prototype) {
            lexeme.error("Unknown operator.");
        }
    } else if (arity === "string" || arity ===  "number") {
        arity = "literal";
        prototype = symbolTable["(literal)"];
    } else {
        lexeme.error("Unexpected token.");
    }
    token = Object.create(prototype);
    token.value = value;
    token.arity = arity;
    return token;
  };

  var expression = function (rbp) {
    var left;
    var t = token;
    advance();
    left = t.nud();
    while (rbp < token.lbp) {
      t = token;
      advance();
      left = t.led(left);
    }
    return left;
  }

  var infix = function (id, bp, led) {
    var s = symbol(id, bp);
    s.led = led || function (left) {
      this.first = left;
      this.second = expression(bp);
      this.arity = "binary";
      return this;
    };
    return s;
  }

  var infixr = function (id, bp, led) {
    var s = symbol(id, bp);
    s.led = led || function (left) {
      this.first = left;
      this.second = expression(bp - 1);
      this.arity = "binary";
      return this;
    };
    return s;
  }

  var prefix = function (id, nud) {
    var s = symbol(id);
    s.nud = nud || function () {
      this.first = expression(70);
      this.arity = "unary";
      return this;
    };
    return s;
  }

  prefix("-");

  infix("+", 50);
  infix("-", 50);
  infix("*", 60);
  infix("/", 60);

  prefix("indent", function () {
    var e = expression(0);
    advance("dedent");
    return e;
  });

  pushScope();
  advance();
  const result = expression(0);
  advance("(end)");
  popScope();
  return result;
}

const prototypeSymbol = {
  nud: function () {
      this.error("Undefined.");
  },
  led: function (left) {
      this.error("Missing operator.");
  },
  error: function (message) {
    this.errorMessage = message;
  },
  toString: function () {
    if (this.arity === "literal") {
      return this.value;
    }
    if (this.arity === "binary") {
      return "(" + this.id + " " + this.first?.toString() + " " + this.second?.toString() + ")";
    }
    if (this.arity === "unary") {
      return this.id + this.first.toString();
    }
  }
};

function Scope (parent) {
  let scope = {
    def: {},
    parent,
    define: function (n) {
      var t = scope.def[n.value];
      if (typeof t === "object") {
        n.error(
          t.reserved
          ? "Already reserved."
          : "Already defined."
        );
      }
      scope.def[n.value] = n;
      n.reserved = false;
      n.nud = itself;
      n.led = null;
      n.std = null;
      n.lbp = 0;
      n.scope = scope;
      return n;
    },
    find: function (n) {
        var e = scope;
        var o;
        while (true) {
            o = e.def[n];
            if (o && typeof o !== "function") {
                return e.def[n];
            }
            e = e.parent;
            if (!e) {
                o = symbol_table[n];
                return (
                    (o && typeof o !== "function")
                    ? o
                    : symbol_table["(name)"]
                );
            }
        }
    }
  };

  return scope;
};
