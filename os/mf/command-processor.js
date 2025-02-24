import { Alternatives, Lexer, SingleChar, StringLexer, Then, Transform, OneOrMore, Token } from "../../language/lexer.js";

// Use this to create a command
export function Command(descriptor) {
  return {
    name: descriptor.name,
    syntax: CommandSyntax(descriptor.syntax),
    fn: descriptor.fn
  }
}

export function exited() {
  return exit;
}

const commands = new Map([
  ["exit", Command({ name: "exit", syntax: [], fn: () => exit = true })],
  ["testcom", Command({ name: "testcom", syntax: [
    { name: "arg1", required: true, positional: true }, 
    { name: "arg2", required: false, positional: false }], 
    fn: ({arg1, arg2}) => console.log("arg1: " + arg1 + ", arg2: " + arg2) })]
]);

let exit = false;

// Interprets a string as a command and executes it.
export function executeCommand(commandText) {
  const commandName = commandText.split(" ")[0];
  const command = commands.get(commandName);

  if (!command) {
    console.log("Unknown command: " + commandName);
    return;
  }

  const args = parseArgs(commandText.substring(commandName.length).trim());
  const bindingResult = bindParameters(command.syntax, args);

  if (bindingResult.errors.length > 0) {
    console.log(bindingResult.errors[0]);
    return;
  }

  command.fn(Object.fromEntries(bindingResult.bindings));
}

// Describes the syntax (i.e. parameters) of a command
export function CommandSyntax(parameterDescriptors) {
  let obj = {
    parameters: new Map(parameterDescriptors.map(p => [p.name, p])),
    positionalParameters: parameterDescriptors.filter(p => p.required),

    addParameter(name, required, positional) {

      const parameterDef = {
        name,
        required,
        position: positional ? obj.positionalParameters.length : undefined
      };

      obj.parameters.set(name, parameterDef);
      if (positional) {
        obj.positionalParameters.push(parameterDef);
      }
    },

    hasParameter(name) {
      return obj.parameters.has(name);
    },
    getPositionalParameter(index) {
      return obj.positionalParameters[index];
    },
    getUnfulfiledParameters(filled) {
      return [...obj.parameters.values()].filter(p => p.required && !filled.includes(p.name));
    }
  };

  return obj;
}

function CommandParameterBinder(syntax) {
  function getParameterValue(arg) {
    switch (arg.type) {
      case "number":
        return parseFloat(arg.value);
      case "negative number":
        return -parseFloat(arg.value);
      case "string": 
      case "symbol":
        return arg.value;
      default:
        throw new Error("Unknown argument type: " + arg.type);
    }
  }

  let nextParameter;
  const bindings = new Map();
  let positionalParameterIndex = 0;
  const obj = {
    errors: [],
    consume(arg) {
      if (nextParameter) {
        // handle value for keyword parameter
        if (bindings.has(nextParameter)) {
          obj.errors.push("Parameter specified more than once: " + nextParameter);
        } else {
          const value = getParameterValue(arg);
          bindings.set(nextParameter, value);
        }
        nextParameter = undefined;
      } else if (arg.type === "symbol" && arg.value[0] === "-") {
        // handle next keyword parameter
        nextParameter = arg.value.substring(1);
        if (!syntax.hasParameter(nextParameter)) {
          obj.errors.push("Unknown parameter: " + nextParameter);
        }
      } else {
        // handle positional parameter
        const parameter = syntax.getPositionalParameter(positionalParameterIndex);
        if (!parameter) {
          obj.errors.push("Positional parameter not found for: " + arg.value);
        } else {
          const value = getParameterValue(arg);
          bindings.set(parameter.name, value);
          ++positionalParameterIndex;
        }        
      }
    },
    get bindings() {
      if (nextParameter) {
        obj.errors.push("Missing value for parameter: " + nextParameter);
        nextParameter = undefined;
      }
      syntax.getUnfulfiledParameters(Array.from(bindings.keys())).forEach(p => {
        obj.errors.push("Missing value for parameter: " + p.name);
      });
      return { bindings, errors: obj.errors };
    }
  };

  return obj;
}

function bindParameters(commandSyntax, args) {
  const binder = CommandParameterBinder(commandSyntax);
  args.forEach(arg => binder.consume(arg));
  return binder.bindings;  
}

const Digit = SingleChar("digit", /[0-9]/);
const NonNegativeIntegerLexer = OneOrMore("integer", Digit);
const NonNegativeDecimalLexer = Then("decimal", [
  NonNegativeIntegerLexer,
  SingleChar("dot", /\./),
  NonNegativeIntegerLexer
], tokens => tokens[0].value + "." + tokens[2].value);
const NonNegativeNumberLexer = Transform(Alternatives([NonNegativeDecimalLexer, NonNegativeIntegerLexer]), token => new Token("number", token.value));
const NumberLexer = Alternatives([
  NonNegativeNumberLexer, 
  Then("negative number", [SingleChar("minus", /-/), NonNegativeNumberLexer], tokens => tokens[1].value)
]);

const SymbolChar = SingleChar("symbol char", /[0-9a-zA-Z]/);
const quotedString = Then("string", [ // TODO this doesn't handle double spaces because the lexer eats all the spaces
  SingleChar("start quote", /\"/),
  Alternatives([
    Transform(StringLexer("escaped quote", "\\\""), () => new Token("quote", "\"")),
    OneOrMore("string content", SymbolChar)
  ]),
  SingleChar("end quote", /\"/)
], ([, ...tokens]) => {
    tokens.pop();
    return tokens.map(t => t.value).join(" ");
  });
const symbol = OneOrMore("symbol", SymbolChar);
const positionalParameter = Then("symbol", [SingleChar("dash", /-/), symbol], tokens => "-" + tokens[1].value);
const argument = Alternatives([NumberLexer, quotedString, positionalParameter, symbol]);
const args = OneOrMore("arguments", argument);
const commandLexer = [argument];

function parseArgs(argsText) {
  const lexer = new Lexer(commandLexer, argsText);
  const tokens = lexer.tokenize();
  return tokens;
}
