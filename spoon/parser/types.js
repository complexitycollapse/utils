export const typeType = defineType("type");
export const stringType = Type("string");
export const numberType = Type("number");
export const anyType = Type("any");

export function Type(name, parameters) {
  const obj = new typeType({
    name,
    parameters,
    prototypeForInstances: defineType(name),
    createInstance(tag, args) {
      const x = new obj.prototypeForInstances({ tag, args });
      return x;
    },
    isTypeOf(instance) {
      if (obj === stringType) {
        return typeof instance === "string" || instance instanceof String;
      } 
      if (obj === numberType) {
        return typeof instance === "number"
      }
      if (obj === anyType) {
        return true;
      }
      return instance instanceof obj.prototypeForInstances;
    }
  });

  return obj;
}

function defineType(name, methods = {}) {
  // Constructor function for this "type"
  const NewType = function (props = {}) {
    if (!(this instanceof NewType)) {
      // Allow calling without `new`
      return new NewType(props);
    }
    Object.assign(this, props);
  }

  // Try to give the constructor a meaningful name
  try {
    Object.defineProperty(NewType, "name", {
      value: name,
      configurable: true,
    });
  } catch {
    // Some environments may not allow redefining function.name; ignore if so.
  }

  try {
    Object.defineProperty(NewType.prototype, Symbol.toStringTag, {
      value: name,
    });
  } catch {
    // Symbol.toStringTag might not be supported everywhere; safe to ignore.
  }

  // Add instance methods to the prototype
  Object.assign(NewType.prototype, methods);

  // Optional: identify the type by name (helpful for debugging)
  NewType.typeName = name;

  return NewType;
}
