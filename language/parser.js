import { Lexer } from "./lexer";

export function Parser(lexerConfig, code) {
  const lexer = new Lexer(lexerConfig, code);
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

  return {
    get token() { return token; },
    push,
    advance,
    swallow,
    symbol,
    tokenStream
  };
}
