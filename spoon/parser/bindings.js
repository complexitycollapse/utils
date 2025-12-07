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
 * @returns {Bindings}
 */
export default function Bindings(parent, bindingEntries, signatureEntries) {
  let obj = {
    parent,
    bindings: new Map(bindingEntries ?? []),
    signatures: new Map(signatureEntries ?? []),
    has(name) { return obj.bindings.has(name); },
    bind(name, value) { obj.bindings.set(name, value); },
    get(name) { obj.binfings.get(name); },
    get names() { return [...bindings.keys()]; }
  };

  return obj;
}
