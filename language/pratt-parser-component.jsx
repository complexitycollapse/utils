import { useState, useEffect } from "react";
import { Lexer } from "./lexer";
import { TestLexer } from "./test-lexer";

export function PrattParserComponent() {
  const [code, setCode] = useState("");
  const [tree, setTree] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const parser = new PrattParser(new Lexer(TestLexer, code));
      const tree = parser.parse();
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
          <div className="token">{tree?.toString()}</div>
      </div>
    </div>
  );
}

export class PrattParser {
  constructor(lexer) {
    this.lexer = lexer;
  }

  parse(minBindingPower = 0) {
    let lhs;

    lhs = this.lexer.next();
    if (lhs === undefined) {
      return undefined;
    }

    if (lhs.isError) {
      throw new Error(`Error found: ${lhs.toString()}`);
    }
    
    if (!this.isAtom(lhs)) {
      const prefixPower = this.prefixBindingPower(lhs);
      const rhs = this.parse(prefixPower);
      lhs = new Node(lhs, undefined, rhs);
    }
    
    while (true) {
      const operator = this.lexer.peek();
      if (operator === undefined) {
        break;
      }
      if (operator.isError) {
        throw new Error(`Error found: ${operator.toString()}`);
      }
      if (this.isAtom(operator)) {
        throw new Error(`Expected operator, got: ${operator.toString()}`);
      }

      const [leftBindingPower, rightBindingPower] = this.infixBindingPower(operator);

      if (leftBindingPower < minBindingPower) {
        break;
      }

      this.lexer.next();

      const rhs = this.parse(rightBindingPower);
      if (rhs.isError) {
        throw new Error(`Error found: ${rhs.toString()}`);
      }
      
      lhs = new Node(operator, lhs, rhs);
    }

    return lhs;
  }

  prefixBindingPower(token) {
    if (token.type === "operator") {
      switch (token.value) {
        case "+":
        case "-":
          return 5;
        default:
          throw new Error(`Unknown prefix type: ${token.type}`);
      }
    }
  }

  infixBindingPower(token) {
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
    return "(" + this.type.value + " " + this.left?.toString() + " " + this.right?.toString() + ")";
  }
}
