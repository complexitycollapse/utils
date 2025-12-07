/**
 * 
 * @returns {any}
 */
export function Signature(parametersList) {
  let obj = {
    parameters: new Map(),
    positional: [],
    match(args) {
      const namesUsed = new Set();
      const result = [];
      const positional = [];

      // Check all the arguments and create a list of args in evaluation order.
      args.forEach(a => {
        if (a.name) {
          if (!obj.parameters.has(a.name)) {
            throw new Error(a.name + " is not a valid argument");
          }
          if (namesUsed.has(a.name)) {
            throw new Error("Duplicate argument name " + a.name);
          }
          result.push({ type: a.type, name: a.name, value: a.value });
          namesUsed.add(a.name);
        } else {
          const arg = { type: "named", value: a.value };
          positional.push(arg);
          result.push(arg);
        }
      });

      // Assign parameter names to positional arguments.
      let positionalIndex = 0;
      positional.forEach(p => {
        while (namesUsed.has(obj.positional[positionalIndex]?.name)) {
          ++positionalIndex;
        }

        if (positionalIndex >= obj.positional.length) {
          throw new Error("Too many positional args.");
        }

        p.name = obj.positional[positionalIndex].name;
        ++positionalIndex;
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
