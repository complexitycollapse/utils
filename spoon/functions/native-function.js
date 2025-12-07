export default function NativeFunction(name, signature, fn) {
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
