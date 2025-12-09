import { evalStatement, createEnv, evalExpression } from "../interpreter/interpreter.js";

export function GenericFunction(name) {
  let obj = {
    callable: true,
    isGenericFunction: true,
    name,
    instances: [],
    addInstance(instance) {
      obj.instances.push(instance);
      return obj;
    },
    match(args) {
      if (obj.instances.length === 1) { return obj.instances[0].match(args, obj.instances[0]); }

      for (const instance of obj.instances) {
        const match = instance.match(args, instance);
        if (match.success) { return match; }
      }

      return {};
    }
  };

  return obj;
}

export function NativeFunction(name, signature, fn) {
  let obj = {
    callable: true,
    name,
    signature,
    fn,
    add(env) {
      env.bindings.set(obj.name, obj);
      env.signatures.set(obj.name, obj.signature);
    },
    invoke(actualParameters) {
      return obj.fn(actualParameters);
    },
    match(args) { return signature.match(args, obj); }
  };

  return obj;
}

export function SpoonFunction(signature, env, body) {
  let obj = {
    callable: true,
    signature,
    env,
    body,
    add(name, env) {
      env.bindings.set(name, obj);
      env.signatures.set(name, obj.signature);
    },
    invoke(actualParams) {
      const callEnv = createEnv(obj.env);

      obj.signature.parameters.forEach(p => {
        if (!actualParams.has(p.name) && p.defaultValueExpression) {
          callEnv.bindings.set(p.name, evalExpression(p.defaultValueExpression, env));
        } else {
          callEnv.bindings.set(p.name, actualParams.get(p.name));
        }
      });
      return evalStatement(body, callEnv);
    },
    match(args) { return signature.match(args, obj); }
  };

  return obj;
}
