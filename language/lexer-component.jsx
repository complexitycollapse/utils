import { useState, useEffect } from "react";

export function LexerComponent() {
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      setTokens(tokens);
      setError(null);
    } catch (error) {
      setTokens([]);
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
        {tokens.map((token, index) => (
          token.isError ? <div key={index} className="token error">{token.toString()}</div> :
          <div key={index} className="token">{token.toString()}</div>
        ))}
      </div>
    </div>
  );
}

class Lexer {
  constructor(code) {
    this.code = code;
    this.index = 0;
  }

  tokenize() {
    const tokens = [];

    while (this.index < this.code.length) {
      if (this.isWhitespace()) {
        this.consumeWhitespace();
      } else if (this.isNumber()) {
        tokens.push(this.consumeNumber());
      } else if (this.isOperator()) {
        tokens.push(this.consumeOperator());
      } else {
        if (tokens[tokens.length - 1]?.isError) {
          tokens[tokens.length - 1].pushChar(this.code[this.index]);
        } else {
          tokens.push(new Token("error", this.code[this.index], true));
        }
        this.index++;
      }
    }

    return tokens;
  }

  isWhitespace() {
    return /\s/.test(this.code[this.index]);
  }

  consumeWhitespace() {
    while (this.isWhitespace()) {
      this.index++;
    }
  }

  isNumber() {
    return /[0-9]/.test(this.code[this.index]);
  }

  consumeNumber() {
    let value = "";

    while (this.isNumber()) {
      value += this.code[this.index];
      this.index++;
    }

    return new Token("number", value);
  }

  isOperator() {
    return /[+\-*\/]/.test(this.code[this.index]);
  }

  consumeOperator() {
    const value = this.code[this.index];
    this.index++;
    return new Token("operator", value);
  }
}

class Token {
  constructor(type, value, isError) {
    this.type = type;
    this.value = value;
    this.isError = isError;
  }

  toString() {
    return `${this.type}: ${this.value}`;
  }

  pushChar(char) {
    this.value += char;
  }
}
