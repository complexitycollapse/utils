import { LexerComponent } from "../../language/lexer-component";
import { PrattParserComponent } from "../../language/pratt-parser-component";

export function ChooserComponent({ component }) {
  if (component === "parameterTest") {
    return <h1>Received parameterTest as selected component</h1>;
  } else if (component === "lexer") {
    return <LexerComponent></LexerComponent>;
  } else if (component === "pratt-parser") {
    return <PrattParserComponent></PrattParserComponent>;
  } else {
    return <h1>Did not understand component parameter: {component}</h1>;
  }
}
