import { describe, it, expect} from "vitest";
import { memoize } from "./memoize";

describe('memoize', () => {
  it('calls the wrapped function only once', () => {
    let calls = 0;
    let m = memoize(() => ++calls);

    m();
    m();

    expect(calls).toBe(1);
  });

  it('will call the wrapped function again if the memoizer is reset', () => {
    let calls = 0;
    let m = memoize(() => ++calls);

    m();
    m.reset();
    m();

    expect(calls).toBe(2);
  });
});
