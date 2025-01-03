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

export class Lexer {
  constructor(code) {
    this.lines = code.split("\n");
    this.index = 0;
  }

  tokenize() {
    const tokens = [];
    const indentStack = [0];

    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      let currentIndent = indentStack[indentStack.length - 1];

      if (this.isBlank(line)) {
        this.index++;
        continue;
      }
      const lineLexer = new LineLexer(line);
      const lineTokens = lineLexer.tokenize();

      if (lineLexer.indent % 2 !== 0) {
        tokens.push(new Token("Invalid indentation", lineLexer.indent, true));
      }

      if (lineLexer.indent > currentIndent) {
        indentStack.push(lineLexer.indent);
        tokens.push(new Token("indent", lineLexer.indent));
      }

      while (lineLexer.indent < currentIndent) {
        const lastIndent = indentStack.pop();
        currentIndent = indentStack[indentStack.length - 1];
        if (lineLexer.indent > currentIndent) {
          tokens.push(new Token("Invalid indentation", lineLexer.indent, true));
        } else {
          tokens.push(new Token("dedent", lastIndent));
        }
      }

      tokens.push(...lineTokens);
      this.index++;
    }

    while (indentStack.length > 0 && indentStack[indentStack.length - 1] > 0) {
      tokens.push(new Token("dedent", indentStack.pop()));
    }

    return tokens;
  }

  isBlank(line) {
    return /^\s*$/.test(line);
  }
}

class LineLexer {
  indent = 0;

  constructor(line) {
    this.line = line;
    this.index = 0;
  }

  tokenize() {
    const tokens = [];

    if (this.isWhitespace) {
      this.consumeWhitespace();
    }

    this.indent = this.index;

    while (this.index < this.line.length) {
      if (this.isWhitespace()) {
        this.consumeWhitespace();
      } else if (this.isNumber()) {
        tokens.push(this.consumeNumber());
      } else if (this.isOperator()) {
        tokens.push(this.consumeOperator());
      } else {
        if (tokens[tokens.length - 1]?.isError) {
          tokens[tokens.length - 1].pushChar(this.line[this.index]);
        } else {
          tokens.push(new Token("error", this.line[this.index], true));
        }
        this.index++;
      }
    }

    return tokens;
  }

  isWhitespace() {
    return /\s/.test(this.line[this.index]);
  }

  consumeWhitespace() {
    while (this.isWhitespace()) {
      this.index++;
    }
  }

  isNumber() {
    return /[0-9]/.test(this.line[this.index]);
  }

  consumeNumber() {
    let value = "";

    while (this.isNumber()) {
      value += this.line[this.index];
      this.index++;
    }

    return new Token("number", value);
  }

  isOperator() {
    return /[+\-*\/]/.test(this.line[this.index]);
  }

  consumeOperator() {
    const value = this.line[this.index];
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
