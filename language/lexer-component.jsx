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
    this.currentLineLexer = undefined;
    this.nextTokens = [];
    this.indentStack = [0];
  }

  peek() {
    if (this.nextTokens.length > 0) {
      return this.nextTokens[0];
    }

    if (this.currentLineLexer) {
      const lineNext = this.currentLineLexer.peek();
      if (lineNext) {
        return lineNext;
      }
    }

    this.currentLineLexer = undefined;

    while(this.index < this.lines.length) {
      const line  = this.lines[this.index];
      const lexer = new LineLexer(line);
      this.index++;
      if (this.isBlank(line)) {
        continue;
      }
      
      if (lexer.peek() === undefined) {
        continue;
      }

      this.currentLineLexer = lexer;
      this.handleIndent(lexer);
      return this.peek();
    }

    if (this.currentLineLexer === undefined) {
      while (this.indentStack.length > 0 && this.indentStack[this.indentStack.length - 1] > 0) {
        this.nextTokens.push(new Token("dedent", this.indentStack.pop()));
      }
    }

    return this.nextTokens[0];
  }

  next() {
    const result = this.peek();

    if (this.nextTokens.length > 0) {
      this.nextTokens.shift();
      return result;
    }

    if (this.currentLineLexer) {
      this.currentLineLexer.next();
    }

    return result;
  }

  handleIndent(lineLexer) {
    if (lineLexer.indent % 2 !== 0) {
      this.nextTokens.push(new Token("Invalid indentation", lineLexer.indent, true));
    }

    let currentIndent = this.indentStack[this.indentStack.length - 1];

    if (lineLexer.indent > currentIndent) {
      this.indentStack.push(lineLexer.indent);
      this.nextTokens.push(new Token("indent", lineLexer.indent));
    }

    while (lineLexer.indent < currentIndent) {
      const lastIndent = this.indentStack.pop();
      currentIndent = this.indentStack[this.indentStack.length - 1];
      if (lineLexer.indent > currentIndent) {
        this.nextTokens.push(new Token("Invalid indentation", lineLexer.indent, true));
      } else {
        this.nextTokens.push(new Token("dedent", lastIndent));
      }
    }
  }

  tokenize() {
    const tokens = [];

    for (let t = this.next(); t; t = this.next()) {
      tokens.push(t);
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
    this.nextToken = undefined;
    this.lastError = undefined;
    this.atStart = true;
  }

  tokenize() {
    const tokens = [];

    for(let t = this.next(); t; t = this.next()) {
      tokens.push(t);
    }

    return tokens;
  }

  peek() {
    if (this.nextToken === undefined) {
      this.lexOneToken();
    }

    return this.lastError ?? this.nextToken;
  }

  next() {
    this.peek();

    if (this.lastError) {
      const last = this.lastError;
      this.lastError = undefined;
      return last;
    }

    if (this.nextToken) {
      const last = this.nextToken;
      this.nextToken = undefined;
      return last;
    }
  }

  lexOneToken() {
    if (this.index >= this.line.length) {
      return;
    }

    if (this.atStart) {
      this.atStart = false;
      this.consumeWhitespace();
      this.indent = this.index; 
    }

    if (this.isWhitespace()) {
      this.consumeWhitespace();
      this.lexOneToken();
    } else if (this.isNumber()) {
      this.nextToken = this.consumeNumber();
    } else if (this.isOperator()) {
      this.nextToken = this.consumeOperator();
    } else {
      if (this.lastError) {
        this.lastError.pushChar(this.line[this.index]);
      } else {
        this.lastError = new Token("error", this.line[this.index], true);
      }
      this.index++;
      this.lexOneToken();
    }
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
