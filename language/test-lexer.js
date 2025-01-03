import { Alternatives, OneOrMore, Optional, SingleChar, Then, Token, Transform } from "./lexer.js";

const Digit = SingleChar("digit", /[0-9]/);
const SymbolChar = SingleChar("symbol char", /[0-9a-zA-Z]/);
const OperatorLexer = SingleChar("operator", /[+\-*\/]/);
const NonNegativeIntegerLexer = OneOrMore("integer", Digit);
const NonNegativeDecimalLexer = Then("decimal", [
  NonNegativeIntegerLexer,
  SingleChar("dot", /\./),
  NonNegativeIntegerLexer
], tokens => tokens[0].value + "." + tokens[2].value);
const NonNegativeNumberLexer = Transform(Alternatives("number", [NonNegativeDecimalLexer, NonNegativeIntegerLexer]), token => new Token("number", token.value));
const NumberLexer = Then("number", [Optional(SingleChar("sign", /[-]/)), NonNegativeNumberLexer], tokens => tokens[0].value + tokens[1].value);
const SymbolPart = OneOrMore("symbol", SymbolChar);

export const TestLexer = [NumberLexer, OperatorLexer, SymbolPart];
