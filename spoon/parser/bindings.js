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
    bind(name, value) { obj.bindings.set(name, value); },
    get(name) { obj.bindings.get(name); },
    get names() { return [...obj.bindings.keys()]; }
  };

  return obj;
}
