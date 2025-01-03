import { useState, useEffect } from "react";
import { TestLexer } from "./test-lexer";
import { Lexer } from "./lexer";

export function LexerComponent() {
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const lexer = new Lexer(TestLexer, code);
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
      <h1>Lexer</h1>
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
