import { LexerComponent } from "../../language/lexer-component";

export function ChooserComponent({ component }) {
  if (component === "parameterTest") {
    return <h1>Received parameterTest as selected component</h1>;
  } else if (component === "lexer") {
    return <LexerComponent></LexerComponent>;
  } else {
    return <h1>Did not understand component parameter: {component}</h1>;
  }
}
