export function memoize(initFn) {
  let value = undefined, memoized = false;

  let fn = () => {
    if (!memoized) {
      value = initFn();
      memoized = true;
    }
    return value;
  }

  fn.reset = () => {
    value = undefined;
    memoized = false;
  }

  return fn;
}

export function memoizedProperty(host, name, initFn) {
  Object.defineProperty(host, name, {
    configurable: true,
    enumerable: true,
    get: memoize(() => initFn.apply(host)),
    writable: true
  });
}
