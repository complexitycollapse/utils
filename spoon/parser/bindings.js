/**
 * @typedef {Object} Bindings
 * @property {undefined|Bindings} parent
 * @property {Map<string, Signature>} signatures
 * @property {string => Object} get
 * @property {string => boolean} has
 * @property {(name: string, value: Object) => set} bind
 * @property {() => string[]} names
 */

/**
 * 
 * @param {undefined|Bindings} parent 
 * @param {undefined|[[string, Object]]} bindingEntries
 * @param {undefined|[[string, Signature]]} signatureEntries
 * @param {undefined|[[string, Type]]} typeEntries
 * @returns {Bindings}
 */
export default function Bindings(parent, bindingEntries, signatureEntries, typeEntries) {
  let obj = {
    parent,
    bindings: new Map(bindingEntries ?? []), // the values of the symbols
    signatures: new Map(signatureEntries ?? []), // function signatures associated with the symbols
    types: new Map(typeEntries), // the types of the symbols
    has(name) { return obj.bindings.has(name); },
    bind(name, value, type) {
      if (obj.bindings.has(name)) {
        throw new Error(name + "is already bound in this context.");
      }
      obj.bindings.set(name, value);
      obj.types.set(name, type);
    },
    get(name) {
      const home = getHome(name);
      if (home) { return home.bindings.get(name) }
      throw new Error(`Unbound variable ${name}`);
    },
    getType(name) {
      const home = getHome(name);
      if (home) { return home.types.get(name) }
      throw new Error(`Unbound variable ${name}`);
    },
    addSignature(name, signature) {
      if (!obj.signatures.has(name)) {
        obj.signatures.set(name, [signature]);
        obj.bindings.set(name, "function");
      } else {
        obj.signatures.get(name).push(signature);
      }
    },
    getSignatures(name) {
      const home = getHome(name);
      if (home) { 
        if (home.bindings.get(name) != "function") {
          throw new Error(name + " isn't bound to a function.");
        }
        return home.signatures.get(name);
      }
      throw new Error(`Unbound variable ${name}`);
    },
    get names() { return [...obj.bindings.keys()]; }
  };

  function getHome(name, bindings = obj) {
    if (bindings.bindings.has(name)) {
      return bindings;
    }
    if (bindings.parent) {
      return getHome(name, bindings.parent);
    }
  }

  return obj;
}
