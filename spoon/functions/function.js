import { evalStatement, createEnv } from "../interpreter/interpreter.js";

export function NativeFunction(name, signature, fn) {
  let obj = {
    callable: true,
    name,
    signature,
    fn,
    add(env) {
      env.bindings.set(obj.name, obj);
      env.signatures.set(obj.name, obj.signature);
    }
  };

  return obj;
}

export function SpoonFunction(signature, env, body) {
  let obj = {
    callable: true,
    signature,
    env,
    body,
    fn(actualParams) {
      const newEnv = createEnv(obj.env, actualParams);
      return evalStatement(body, createEnv(obj.env, actualParams));
    },
    add(name, env) {
      env.bindings.set(name, obj);
      env.signatures.set(name, obj.signature);
    }
  };

  return obj;
}
