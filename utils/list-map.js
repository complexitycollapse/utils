export function ListMap() {
  let obj = {};
  let table = new Map();

  addProperties(obj, { table });

  function push(key, value) {
    if (table.has(key)) {
      table.get(key).push(value);
    } else {
      table.set(key, [value]);
    }
  }

  return finalObject(obj, {
    push,
    get: key => table.get(key) ?? [],
    has: key => table.has(key),
    entries: () => table.entries(),
    values: () => table.values()
  });
}

export function listMapFromList(keyFn, valueFn, list) {
  let map = ListMap();
  list.forEach(item => map.push(keyFn(item), valueFn(item)));
  return map;
}
