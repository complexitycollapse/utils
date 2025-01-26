import { Alternatives, InverseLexer, OneOrMore, Optional, SingleChar, StringLexer, Then, Token, Transform } from "./lexer.js";

const Digit = SingleChar("digit", /[0-9]/);
const SymbolChar = SingleChar("symbol char", /[0-9a-zA-Z]/);
const OperatorLexer = SingleChar("operator", /[+\-*\/\?:!]/);
const PostIncrement = StringLexer("++", "++");
const PostDecrement = StringLexer("--", "--");
const NonNegativeIntegerLexer = OneOrMore("integer", Digit);
const NonNegativeDecimalLexer = Then("decimal", [
  NonNegativeIntegerLexer,
  SingleChar("dot", /\./),
  NonNegativeIntegerLexer
], tokens => tokens[0].value + "." + tokens[2].value);
const NonNegativeNumberLexer = Transform(Alternatives([NonNegativeDecimalLexer, NonNegativeIntegerLexer]), token => new Token("number", token.value));
const SymbolPart = OneOrMore("symbol", SymbolChar);
const Keywords = Then("keyword", 
  [Alternatives([StringLexer("", "if"), StringLexer("", "else"), StringLexer("", "def")]), 
  InverseLexer(SymbolChar)],
tokens => tokens[0].value);

export const TestLexer = [NonNegativeNumberLexer, PostIncrement, PostDecrement, OperatorLexer, SymbolPart];
