export class Lexer {
  constructor(lexers, code) {
    this.lexers = lexers;
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
      const lexer = new LineLexer(this.lexers, line);
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

  constructor(lexers, line) {
    this.lexers = lexers;
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
    }
    else {
      for(const lexer of this.lexers) {
        const result = lexer.lex(this.line, this.index);
        if (result.pass) {
          this.nextToken = result.token;
          this.index = result.nextIndex;
          return result.token;
        }
      }

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
}

export function InverseLexer(lexer) {
  return new InverseLexerClass(lexer);
}

class InverseLexerClass {
  constructor(lexer) {
    this.lexer = lexer;
  }

  lex(str, index) {
    const result = this.lexer.lex(str, index);
    if (result.pass) {
      return {};
    }

    return {
      pass: true,
      token: new Token("inverse", ""),
      nextIndex: index
    };
  }
}

export function SingleChar(type, pattern) {
  return new SingleCharClass(type, pattern);
}

class SingleCharClass {
  constructor(type, pattern) {
    this.pattern = pattern;
    this.type = type;
  }

  lex(str, index) {
    if (str[index] && this.pattern.test(str[index])) {
      return {
        pass: true,
        token: new Token(this.type, str[index]),
        nextIndex: index + 1
      };
    }

    return {};
  }
}

export function Optional(lexer) {
  return new OptionalClass(lexer);
}

class OptionalClass {
  constructor(lexer) {
    this.lexer = lexer;
  }

  lex(str, index) {
    const result = this.lexer.lex(str, index);
    if (result.pass) {
      return result;
    }

    return {
      pass: true,
      token: new Token("optional", ""),
      nextIndex: index
    };
  }
}

export function Alternatives(lexers) {
  return new AlternativesClass(lexers);
}

class AlternativesClass {
  constructor(lexers) {
    this.lexers = lexers;
  }

  lex(str, index) {
    for (const lexer of this.lexers) {
      const result = lexer.lex(str, index);
      if (result.pass) {
        return result;
      }
    }

    return {};
  }
}

export function Transform(lexer, transform) {
  return new TransformClass(lexer, transform);
}

class TransformClass {
  constructor(lexer, transform) {
    this.lexer = lexer;
    this.transform = transform;
  }

  lex(str, index) {
    const result = this.lexer.lex(str, index);
    if (result.pass) {
      return {
        pass: true,
        token: this.transform(result.token),
        nextIndex: result.nextIndex
      };
    }

    return result;
  }
}

export function ZeroOrMore(type, lexer) {
  return new ZeroOrMoreClass(type, lexer);
}

class ZeroOrMoreClass {
  constructor(type, lexer) {
    this.type = type;
    this.lexer = lexer;
  }

  lex(str, index) {
    const tokens = [];
    let nextIndex = index;
    let result = this.lexer.lex(str, nextIndex);
    while (result.pass) {
      tokens.push(result.token);
      nextIndex = result.nextIndex;
      result = this.lexer.lex(str, nextIndex);
    }

    return {
      pass: true,
      token: new Token(this.type, tokens.map(t => t.value).join("")),
      nextIndex: nextIndex
    };
  }
}

export function Then(type, lexers, combiner = tokens => tokens) {
  return new ThenClass(type, lexers, combiner);
}

class ThenClass {
  constructor(type, lexers, combiner = tokens => tokens) {
    this.type = type;
    this.lexers = lexers;
    this.combiner = combiner;
  }

  lex(str, index) {
    const tokens = [];
    let nextIndex = index;
    for (const lexer of this.lexers) {
      const result = lexer.lex(str, nextIndex);
      if (!result.pass) {
        return {};
      }
      tokens.push(result.token);
      nextIndex = result.nextIndex;
    }

    return {
      pass: true,
      token: new Token(this.type, this.combiner(tokens)),
      nextIndex: nextIndex
    };
  }
}

export const OneOrMore = (type, lexer) => Then(type, [lexer, ZeroOrMore(type, lexer)], tokens => tokens[0].value + tokens[1].value);

export function StringLexer(type, string) {
  return new StringLexerClass(type, string);
}

class StringLexerClass {
  constructor(type, string) {
    this.type = type;
    this.string = string;
  }

  lex(str, index) {
    if (str.startsWith(this.string, index)) {
      return {
        pass: true,
        token: new Token(this.type, this.string),
        nextIndex: index + this.string.length
      };
    }

    return {};
  }
}

export class Token {
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
