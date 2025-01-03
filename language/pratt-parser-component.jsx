import { useState, useEffect } from "react";
import { Lexer } from "./lexer-component";

export function PrattParserComponent() {
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState([]);
  const [tree, setTree] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      setTokens(tokens);

      const parser = new PrattParser(tokens);
      const tree = parser.parse();
      setTree(tree);

      setError(null);
    } catch (error) {
      setError(error.message);
    }
  }, [code]);

  return (
    <div>
      <h1>Lexer component</h1>
      <textarea
        className="lexer-input"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div className="token-list">
          <div className="token">{tree?.toString()}</div>
      </div>
    </div>
  );
}

export class PrattParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }

  parse(minBindingPower = 0) {
    let lhs;

    lhs = this.tokens[this.index];
    if (lhs.isError) {
      throw new Error(`Error found: ${lhs.toString()}`);
    }
    if (!this.isAtom(lhs)) {
      throw new Error(`Expected atom, got: ${lhs.toString()}`);
    }
    
    this.index++;

    while (this.index < this.tokens.length) {
      const operator = this.tokens[this.index];
      if (operator.isError) {
        throw new Error(`Error found: ${operator.toString()}`);
      }
      if (this.isAtom(operator)) {
        throw new Error(`Expected operator, got: ${operator.toString()}`);
      }

      const [leftBindingPower, rightBindingPower] = this.bindingPower(operator);

      if (leftBindingPower < minBindingPower) {
        break;
      }

      this.index++;

      const rhs = this.parse(rightBindingPower);
      if (rhs.isError) {
        throw new Error(`Error found: ${rhs.toString()}`);
      }
      
      lhs = new Node(operator, lhs, rhs);
    }

    return lhs;
  }

  bindingPower(token) {
    if (token.type === "operator") {
      switch (token.value) {
        case "+":
        case "-":
          return [10, 11];
        case "*":
        case "/":
          return [20, 21];
        default:
          throw new Error(`Unknown infix type: ${token.type}`);
      }
    }
  }

  isAtom(token) {
    return token.type === "number";
  }
}

class Node {
  constructor(type, left, right) {
    this.type = type;
    this.left = left;
    this.right = right;
  }

  toString() {
    return "(" + this.type.value + " " + this.left.toString() + " " + this.right.toString() + ")";
  }
}
