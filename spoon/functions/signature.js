/**
 * 
 * @returns {any}
 */
export function Signature(parametersList) {
  let obj = {
    parameters: new Map(),
    positional: [],
    match(args, instance) {
      const namesUsed = new Set();
      const matchedArgs = [];
      const positional = [];

      // Check all the arguments and create a list of args in evaluation order.
      args.forEach(a => {
        if (a.name) {
          if (!obj.parameters.has(a.name)) {
            return { failure: a.name + " is not a valid argument" };
          }
          if (namesUsed.has(a.name)) {
            return { failure: "Duplicate argument name " + a.name };
          }
          matchedArgs.push({ type: a.type, name: a.name, value: a.value });
          namesUsed.add(a.name);
        } else {
          const arg = { type: "named", value: a.value };
          positional.push(arg);
          matchedArgs.push(arg);
        }
      });

      // Assign parameter names to positional arguments.
      let positionalIndex = 0;
      positional.forEach(p => {
        while (namesUsed.has(obj.positional[positionalIndex]?.name)) {
          ++positionalIndex;
        }

        if (positionalIndex >= obj.positional.length) {
          return { failure: "Too many positional args." };
        }

        p.name = obj.positional[positionalIndex].name;
        ++positionalIndex;
      });

      return { success: true, matchedArgs, instance };
    }
  };

  obj.positional = parametersList.filter(p => p.positional);
  obj.parameters = new Map(parametersList.map(p => ([p.name, p])));

  return obj;
}

export function Parameter(name, positional, type, defaultValueExpression) {
  let obj = {
    name,
    type,
    positional,
    defaultValueExpression,
    get enum() { return false; }
  };

  return obj;
}
