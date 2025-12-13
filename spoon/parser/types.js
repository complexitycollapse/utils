export const typeType = defineType("type");

export default function Type(name, parameters) {
  let obj = {
    name,
    parameters,
    prototypeForInstances: defineType(name),
    createInstance(tag, args) {
      const x = new obj.prototypeForInstances({ tag, args });
      return x;
    },
    isTypeOf(instance) {
      return instance instanceof obj.prototypeForInstances;
    }
  };

  obj.prototype = typeType;
  return obj;
}

function defineType(name, methods = {}) {
  // Constructor function for this "type"
  function Type(props = {}) {
    if (!(this instanceof Type)) {
      // Allow calling without `new`
      return new Type(props);
    }
    Object.assign(this, props);
  }

  // Add instance methods to the prototype
  Object.assign(Type.prototype, methods);

  // Optional: identify the type by name (helpful for debugging)
  Type.typeName = name;

  return Type;
}
