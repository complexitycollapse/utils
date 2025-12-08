import { parseExpression } from "./expressions.js";
import { parseStatementBlock } from "./statements.js";

export function parseFunctionDefinition(p, t) {
  if (!p.at("IDENT")) {
    throw p.syntaxError(p.current(), "valid function name expected");
  }

  const name = p.advance().value;
  const fn = parseFunctionExpression(p, t);
  return p.makeNode("function definition", { name, fn });
}

export function parseFunctionExpression(p, t) {
  const parameters = [];
  while(!p.at(":") && !p.at("NEWLINE") && !p.isDelimiter(p.current)) {
    parameters.push(parseParameter(p));
    if (!p.at(",")) {
      break;
    }
    p.advance();
  }

  if (!p.at(":")) {
    throw p.syntaxError(p.current, "statement expected");
  }

  const body = parseStatementBlock(p, true);

  // TODO: also needs an environment
  return p.makeNode("function", { parameters, body }, t);
}

function parseParameter(p) {
  const t = p.current;

  if (!p.at("IDENT") && !p.at("FLAG")) {
    throw p.syntaxError(p.current, "Invalid parameter spec");
  }

  const positional = !!p.at("IDENT");
  const name = p.advance().value;
  let type = p.at("IDENT") ? p.advance().value : undefined;

  if (p.at("{")) {
    p.advance();
    type = [];
    while(true) {
      if (p.at("}")) {
        p.advance();
        break;
      }
      if (!p.at("IDENT")) {
        throw p.syntaxError(p.current, "enum member expected");
      }
      type.push(p.advance().value);
    }
  }

  let defaultValueExpression;

  if (p.at("=")) {
    p.advance();
    const defToken = p.current;
    p.pushDelimiters([",", ":"]);
    defaultValueExpression = parseExpression(p, 0);
    p.popDelimiters();

    if (Array.isArray(type) && type.indexOf(defaultValueExpression.name) == -1) {
      throw p.syntaxError(defToken, "default is not valid for enum");
    }
  }

  return p.makeNode("parameter", { name, type, defaultValueExpression, positional }, t);
}
