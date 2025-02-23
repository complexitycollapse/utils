import { useState, useEffect } from "react";
import { Alternatives, OneOrMore, Optional, SingleChar, Then, Token, Transform, Lexer, StringLexer } from "./lexer.js";
import { Parser } from "./parser.js";

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
      const tree = TestParser(code)().tree;
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

function TestParser(code) {
  const p = Parser(basicLexer, code);

  function expression(rbp) {
    if (!p.token) return undefined;
    
    let left, current = p.token;

    p.advance();
    left = current.nud();

    while (p.token && rbp < p.token.lbp) {
      current = p.token;
      p.advance();
      left = current.led(left);
    }

    return left;
  }

  function prefix(name, lbp) {
    const sym = p.symbol(name, lbp);
    sym.nud = () => {
      let first = expression(lbp);
      if (!first) {
        return p.push({
          errorMessage: "Missing argument",
          arity: "unary"
        });
      }
      return p.push({
        name,
        first,
        arity: "unary"
      });
    };

    return sym;
  }

  function postfix(name, lbp) {
    const sym = p.symbol(name, lbp);
    sym.led = left => {
      if (!left) {
        return p.push({
          errorMessage: "Missing argument",
          arity: "unary",
          lbp
        });
      } else {
        return p.push({
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
    const sym = p.symbol(name, bp);
    sym.led = left => {
      return p.push({
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

  p.symbol("?", 60).led = left => {
    const conseq = expression(60) ?? { errorMessage: "Missing argument to ?" };
    const colon = p.swallow(":");
    let subseq;
    if (!colon.errorMessage) {
      subseq = expression(60) ?? { errorMessage: "Missing argument to ?" };
    }
    return p.push({
      name: "?",
      arity: "ternary",
      first: left,
      second: conseq,
      third: subseq ?? colon
    });
  };
  
  function parse() {
    p.advance();
    const tree = expression(0);
    if (p.token !== undefined) {
      return p.push({ errorMessage: "Unexpected token " + p.token.name });
    }
    return { tree, tokenStream: p.tokenStream };
  }

  return parse;
}
