import { parseExpression } from "./expressions.js";
import { parseStatementBlock, parseStatement } from "./statements.js";
import { anyType, ensureTypedPattern, parseTypeAnnotation, parseTypeAnnotationSuffix } from "./types.js";

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

  let returnType = anyType;
  if (p.at("{")) {
    p.advance();
    returnType = parseTypeAnnotation(p);
  }

  while(!p.at(":") && !p.at("NEWLINE") && !p.at("RIGHT ARROW") && !p.isDelimiter(p.current)) {
    parameters.push(parseParameter(p));
    if (!p.at(",")) {
      break;
    }
    p.advance();
  }

  let body;

  if (p.at("RIGHT ARROW")) {
    p.advance();
    body = parseStatement(p);
  } else if (!p.at(":")) {
    throw p.syntaxError(p.current, "=> or : expected");
  } else {
    body = parseStatementBlock(p);
  }

  // TODO: also needs an environment
  return p.makeNode("function", { parameters, body, returnType }, t);
}

export function parseParameter(p) {
  const t = p.current;

  if (!p.at("IDENT") && !p.at("FLAG")) {
    throw p.syntaxError(p.current, "Invalid parameter spec");
  }

  const positional = !!p.at("IDENT");
  const nameIdentifier = p.makeNode("identifier", { name: p.current.value }, p.advance());
  let pattern, enumMembers;

  if (p.at("(")) {
    enumMembers = [];
    p.advance();
    while(true) {
      if (p.at(")")) {
        p.advance();
        break;
      }
      if (!p.at("IDENT")) {
        throw p.syntaxError(p.current, "enum member expected");
      }
      enumMembers.push(p.advance().value);
      if (!p.at(")") && !p.at("|")) {
        throw p.syntaxError(p.current, "Expected | to separate enum values");
      }
      if (p.at("|")) { p.advance(); }
    }

    // TODO: set the type of the parameter

    if (enumMembers.length === 0) {
      throw p.syntaxError(p.current, "Empty enum");
    }
  } else if (p.at("{")) {
    pattern = parseTypeAnnotationSuffix(p, nameIdentifier, p.advance());
  }

  pattern = pattern ?? ensureTypedPattern(p, nameIdentifier);

  let defaultValueExpression;

  if (p.at("=")) {
    p.advance();
    const defToken = p.current;
    p.pushDelimiters([",", ":"]);
    defaultValueExpression = parseExpression(p, 0);
    p.popDelimiters();

    if (enumMembers && enumMembers.indexOf(defaultValueExpression.name) == -1) {
      throw p.syntaxError(defToken, "default is not valid for enum");
    }
  }

  return p.makeNode("parameter", { pattern, defaultValueExpression, positional }, t);
}
