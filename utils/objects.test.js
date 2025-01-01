import { describe, it, expect } from "vitest";
import { decorateObject, mergeObjects, addUnenumerable, finalObject } from "./objects";

describe('decorateObject', () => {
  it('adds new properties to a frozen object', () => {
    let frozen = finalObject({x: 1, y: 2});

    expect(decorateObject(frozen, {z: 3, w: 4})).toMatchObject({z: 3, w: 4});
  });

  it('preserves existing properties of a frozen object', () => {
    let frozen = finalObject({x: 1, y: 2});

    expect(decorateObject(frozen, {z: 3, w: 4})).toMatchObject({x: 1, y: 2});
  });
});

describe('mergeObjects', () => {
  it('adds the source properties to the target, overriding existing values', () => {
    let target = {x: 1, y: 2, z: 3};
    let source = {x: 100, w: 200};

    mergeObjects(target, source);

    expect(target).toEqual({x: 100, y: 2, z: 3, w: 200});
  });
});

describe('addUnenumerable', () => {
  it('creates a property and assigns the value', () => {
    expect(addUnenumerable({}, "foo", 123).foo).toBe(123);
  });

  it('creates a value that is not enumerated', () => {
    expect(Object.keys(addUnenumerable({}, "foo", 123))).toHaveLength(0);
  });

  it('makes the property read-only if the readWrite parameter is not passed', () => {
    let obj = addUnenumerable({}, "foo", 123);
    expect(() => obj.foo = 1).toThrow();
  });

  it('makes the property writeable if the readWrite parameter is set', () => {
    let obj = addUnenumerable({}, "foo", 123, true);
    obj.foo = 1;
    expect(obj.foo).toBe(1);
  });
});
