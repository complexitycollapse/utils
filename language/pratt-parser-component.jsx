import { useState, useEffect } from "react";
import { Alternatives, OneOrMore, Optional, SingleChar, Then, Token, Transform, Lexer, StringLexer } from "./lexer.js";

function TokenComponent({ token }) {
  if (token.errorMessage) {
    return <div className="token error">{token.errorMessage}</div>;
  }

  if (token.id === "(end)") {
    return null;
  }

  return (
    <div className="token">
      {token.arity === "literal" ? token.name
      : (token.arity === "unary" ? <>{token.name}&nbsp;<TokenComponent token={token.first}/></>
        : (token.arity === "binary" ? <>({token.name}&nbsp; <TokenComponent token={token.first}/>&nbsp;<TokenComponent token={token.second}/>)</> :
        <>({token.name}&nbsp; <TokenComponent token={token.first}/>&nbsp;<TokenComponent token={token.second}/>&nbsp;<TokenComponent token={token.third}/>)</>))}
    </div>
  );
}

export function PrattParserComponent() {
  const [code, setCode] = useState("");
  const [tree, setTree] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const tree = Parser(code).tree;
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
      {tree ? <TokenComponent token={tree}/> : null}
    </div>
  );
}

const Digit = SingleChar("digit", /[0-9]/);
const SymbolChar = SingleChar("symbol char", /[0-9a-zA-Z]/);
const OperatorLexer = SingleChar("operator", /[+\-*\/\?:!]/);
const PostIncrement = StringLexer("++", "++");
const PostDecrement = StringLexer("--", "--");
const NonNegativeIntegerLexer = OneOrMore("integer", Digit);
const NonNegativeDecimalLexer = Then("decimal", [
  NonNegativeIntegerLexer,
  SingleChar("dot", /\./),
  NonNegativeIntegerLexer
], tokens => tokens[0].value + "." + tokens[2].value);
const NonNegativeNumberLexer = Transform(Alternatives([NonNegativeDecimalLexer, NonNegativeIntegerLexer]), token => new Token("number", token.value));
const SymbolPart = OneOrMore("symbol", SymbolChar);

const basicLexer = [NonNegativeNumberLexer, PostIncrement, PostDecrement, OperatorLexer, SymbolPart];

export function Parser(code) {
  const lexer = new Lexer(basicLexer, code);
  const tokenStream = [];
  let token;

  const symbolTable = {};

  function push(token) {
    tokenStream.push(token);
    return token;
  }

  function swallow(char) {
    const current = token;
    advance();
    if (char && current?.name !== char) {
      return push({
        name: "error",
        errorMessage: "Expected " + char
      });
    } else {
      return push({
        name: "char",
        arity: "delimiter"
      });
    }
  }

  function advance() {
    const lexeme = lexer.next();

    if (!lexeme) {
      token = undefined;
    }

    else if (lexeme.type === "number") {
      const name = parseFloat(lexeme.value);
      token = {
        name: "number",
        nud() {
          return {
            name,
            arity: "literal"
          };
        },
        led(left) {
          return {
            name: "error",
            errorMessage: "TODO",
            first: left
          };
        },
        lbp: 0
      }

    } else {
      token = symbolTable[lexeme.value];

      if (!token) {
        token = {
          name: lexeme.value,
          nud: () => errorMessage,
          led: () => errorMessage,
          lbp: 0
        };
      }
    }

    return token;
  }

  function expression(rbp) {
    if (!token) return undefined;
    
    let left, current = token;

    advance();
    left = current.nud();

    while (token && rbp < token.lbp) {
      current = token;
      advance();
      left = current.led(left);
    }

    return left;
  }

  function symbol(name, lbp = 0) {
    let symbol = symbolTable[name];
    if (symbol) {
      if (lbp >= symbol.lbp) {
        symbol.lbp = lbp;
      }
      return symbol;
    }

    symbol = {
      name,
      lbp,
      nud() { return push({ errorMessage: "nud undefined" }); },
      led(left) { return push({ errorMessage: "led undefined" }); }
    };
    symbolTable[name] = symbol;
    return symbol;
  }

  function prefix(name, lbp) {
    const sym = symbol(name, lbp);
    sym.nud = () => {
      let first = expression(lbp);
      if (!first) {
        return push({
          errorMessage: "Missing argument",
          arity: "unary"
        });
      }
      return push({
        name,
        first,
        arity: "unary"
      });
    };

    return sym;
  }

  function postfix(name, lbp) {
    const sym = symbol(name, lbp);
    sym.led = left => {
      if (!left) {
        return push({
          errorMessage: "Missing argument",
          arity: "unary",
          lbp
        });
      } else {
        return push({
          name,
          first: left,
          arity: "unary",
          lbp
        });
      }
    };

    return sym;
  }

  function infix(name, bp) {
    const sym = symbol(name, bp);
    sym.led = left => {
      return push({
        name,
        arity: "binary",
        first: left,
        second: expression(bp) ?? { errorMessage: "Missing argument to " + name }
      });
    };

    return sym;
  }

  postfix("++", 100);
  postfix("--", 100);
  prefix("!", 90);
  prefix("-", 90);
  infix("*", 80);
  infix("/", 80);
  infix("+", 70);
  infix("-", 70);

  symbol("?", 60).led = left => {
    const conseq = expression(60) ?? { errorMessage: "Missing argument to ?" };
    const colon = swallow(":");
    let subseq;
    if (!colon.errorMessage) {
      subseq = expression(60) ?? { errorMessage: "Missing argument to ?" };
    }
    return push({
      name: "?",
      arity: "ternary",
      first: left,
      second: conseq,
      third: subseq ?? colon
    });
  };

  advance();
  const tree = expression(0);
  if (token !== undefined) {
    return push({ errorMessage: "Unexpected token " + token.name });
  }
  return { tree, tokenStream };
}
