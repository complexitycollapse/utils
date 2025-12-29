/**
 * 
 * @returns {any}
 */
export function Signature(parameterList, returnType) {
  let obj = {
    parameterList,
    parameters: new Map(),
    positional: [],
    returnType,
    match(args, instance) {
      const namesUsed = new Set();
      const matchedArgs = [];
      const positional = [];

      // Check all the arguments and create a list of args in evaluation order.
      for (const a of args) {
        if (a.name) {
          if (!obj.parameters.has(a.name)) {
            return { failure: a.name + " is not a valid argument" };
          }
          if (namesUsed.has(a.name)) {
            return { failure: "Duplicate argument name " + a.name };
          }
          matchedArgs.push(a);
          namesUsed.add(a.name);
        } else {
          const arg = { type: "named", value: a.value };
          positional.push(arg);
          matchedArgs.push(arg);
        }
      };

      // Assign parameter names to positional arguments.
      let positionalIndex = 0;
      for (const p of positional) {
        while (namesUsed.has(obj.positional[positionalIndex]?.name)) {
          ++positionalIndex;
        }

        if (positionalIndex >= obj.positional.length) {
          return { failure: "Too many positional args." };
        }

        p.name = obj.positional[positionalIndex].pattern.value.name;
        ++positionalIndex;
      };

      return { success: true, matchedArgs, instance };
    }
  };

  obj.positional = parameterList.filter(p => p.positional);
  obj.parameters = new Map(parameterList.map(p => ([p.pattern.value.name, p])));

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
