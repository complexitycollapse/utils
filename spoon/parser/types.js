export const typeType = defineType("type");
export const stringType = Type("string");
export const numberType = Type("number");
export const anyType = Type("any");
export const booleanType = Type("boolean");

export function parseTypeAnnotation(p) {
  const typeName = p.expect("IDENT").value;
  const typeArgs = [];
  while (!p.at("}")) { typeArgs.push(p.expect("IDENT").value); }
  p.expect("}");
  return { name: typeName, typeArgs };
}

export function parseTypeAnnotationSuffix(p, l, t) {
  const pattern = ensurePattern(p, l);
  const patternType = parseTypeAnnotation(p);
  return p.makeNode(
    "typed pattern",
    { value: pattern.value, patternType },
    t);
}

export function ensurePattern(p, node) {
  if (node.type === "identifier") {
    return p.makeNode("pattern", { value: node }, node);
  } else if (node.type != "pattern" && node.type != "typed pattern") {
    throw p.syntaxError(node, "Pattern expected");
  }
  return node;
}

export function ensureTypedPattern(p, node) {
  if (node.type === "typed pattern") { return node; }
  else {
    const pattern = ensurePattern(p, node);
    return p.makeNode(
      "typed pattern",
      { value: pattern.value, patternType: anyType },
      pattern);
  }
}

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
