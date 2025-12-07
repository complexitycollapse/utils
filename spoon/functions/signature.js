/**
 * 
 * @returns {any}
 */
export function Signature(parametersList) {
  let obj = {
    parameters: new Map(),
    positional: [],
    match(args) {
      // TODO: this doesn't check that the correct params are passed.

      const result = new Map();
      const namesUsed = new Set();
      const argsWithNames = [
        ...args.named.entries(),
        ...args.enums.entries(),
        ...args.switches.entries()
      ];

      argsWithNames.forEach(([name, value]) => {
        namesUsed.add(name);
        result.set(name, value);
      });

      let currentPositionalParam = 0;
      args.positional.forEach(arg => {
        while (currentPositionalParam < obj.positional.length &&
           namesUsed.has(obj.positional[currentPositionalParam].name)) {
          ++currentPositionalParam;
        }
        if (currentPositionalParam >= obj.positional.length) {
          throw new Error("Too many positional args.");
        }
        result.set(obj.positional[currentPositionalParam].name, arg);
        ++currentPositionalParam;
      });

      return result;
    }
  };

  obj.positional = parametersList.filter(p => p.type === "positional");
  obj.parameters = new Map(parametersList.map(p => ([p.name, p])));

  return obj;
}

export function PositionalParameter(name, position) {
  return Parameter(name, position, "positional");
}

export function NamedParameter(name) {
  return Parameter(name, undefined, "named");
}

export function Parameter(name, position, type) {
  let obj = {
    name,
    position,
    type,
    get positional() { return position != undefined; },
    get enum() { return false; }
  };

  return obj;
}
