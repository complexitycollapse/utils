export function finalObject(obj, methods) {
  addMethods(obj, methods);
  Object.freeze(obj);
  return obj;
}

export function addProperties(obj, props, writable) {
  forAllOwnProperties(props, key => {
    Object.defineProperty(obj, key, {
      value: props[key],
      enumerable: true,
      writable
    })
  });
  return obj;
}

export function decorateObject(obj, props) {
  return Object.freeze(Object.assign(Object.create(obj), props));
}

export function addMethods(obj, props) {
  if (props == undefined) { return obj; }

  forAllOwnProperties(props, key => {
    Object.defineProperty(obj, key, {
      value: props[key]
    })
  });
  return obj;
}

export function addUnenumerable(obj, propertyName, initialValue, readWrite) {
  Object.defineProperty(obj, propertyName, {
    value: initialValue,
    enumerable: false,
    writable: readWrite
  });
  return obj;
}

export function forAllOwnProperties(obj, callback) {
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      callback(key);
    }
  }
}

export function mergeObjects(target, source) {
  Object.entries(source).forEach(e => target[e[0]] = e[1]);
}
