import { describe, it, expect } from 'vitest';
// ⬇️ Adjust this to your module path
import { Services, ResolveError, CircularDependencyError } from './container.js';

// Helpers
const val = (v) => () => v;
const tag = (label) => ({ label });

describe('Basics & lifetimes', () => {
  it('singleton by default via Services.add', () => {
    const svcs = Services();
    svcs.add('A', [], val(tag('A')));
    const c = svcs.build();
    const a1 = c.get('A');
    const a2 = c.get('A');
    expect(a1).toBe(a2);
    expect(a1).toEqual(tag('A'));
  });

  it('addInstance registers a singleton instance', () => {
    const inst = tag('I');
    const svcs = Services();
    svcs.addInstance('I', inst);
    const c = svcs.build();
    expect(c.get('I')).toBe(inst);
  });

  it('transient creates a new instance each time', () => {
    const svcs = Services();
    let n = 0;
    svcs.addTransient('T', [], () => ({ id: ++n }));
    const c = svcs.build();
    const t1 = c.get('T');
    const t2 = c.get('T');
    expect(t1).not.toBe(t2);
    expect([t1.id, t2.id]).toEqual([1, 2]);
  });

  it('scoped: same within a scope; different across scopes', () => {
    const svcs = Services();
    let n = 0;
    svcs.addScoped('S', [], () => ({ id: ++n }));

    const root = svcs.build();
    const s1 = root.get('S');
    const s2 = root.get('S');
    expect(s1).toBe(s2);

    const childA = root.createScoped();
    const a1 = childA.get('S');
    const a2 = childA.get('S');
    expect(a1).toBe(a2);
    expect(a1).not.toBe(s1);

    const childB = root.createScoped();
    const b1 = childB.get('S');
    expect(b1).not.toBe(a1);
  });
});

describe('Dependency injection & factories', () => {
  it('passes dependencies as positional args to factory (not via `this`)', () => {
    const svcs = Services();
    svcs.add('A', [], val({ k: 'A' }));
    svcs.add('B', ['A'], function(a) { return { fromA: a.k }; });
    svcs.add('C', ['A', 'B'], function(a, b) { return `${a.k}+${b.fromA}`; });

    const c = svcs.build();
    expect(c.get('C')).toBe('A+A');
  });

  it('resolves through parent registry via Services.createScope()', () => {
    const rootReg = Services();
    rootReg.add('R', [], val(tag('root')));
    const childReg = rootReg.createScope(); // registry scope

    expect(childReg.has('R')).toBe(true);
    expect(childReg.hasLocally('R')).toBe(false);

    const childContainer = childReg.build();
    expect(childContainer.get('R')).toEqual(tag('root'));
  });
});

describe('Error handling', () => {
  it('Container.get of unknown service throws ResolveError', () => {
    const svcs = Services();
    const c = svcs.build();
    expect(() => c.get('MISSING')).toThrow(ResolveError);
  });

  it('missing dependency is rewritten to a user-facing Error with path', () => {
    const svcs = Services();
    // A depends on B, but B is missing
    svcs.add('A', ['B'], function () { return 'a'; });
    const c = svcs.build();

    try {
      c.get('A');
      throw new Error('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const msg = String(err.message);
      expect(msg).toMatch(/Could not resolve A/i);
      expect(msg).toMatch(/Missing dependency B/i);
      expect(msg).toMatch(/Path:\s*A\s*->\s*B/i);
    }
  });

  it('circular dependency reports "Circular" and shows full path including the cycle', () => {
    const svcs = Services();
    svcs.add('A', ['B'], function () { return 'a'; });
    svcs.add('B', ['C'], function () { return 'b'; });
    svcs.add('C', ['A'], function () { return 'c'; });

    const c = svcs.build();

    try {
      c.get('A');
      throw new Error('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const msg = String(err.message);
      expect(msg).toMatch(/Circular dependency/i);
      expect(msg).toMatch(/resolution of A/i);
      expect(msg.replace(/\s+/g, ' ')).toMatch(/A\s*->\s*B\s*->\s*C\s*->\s*A/i);
    }
  });
});

describe('Parent container fallback for singletons', () => {
  it('child container resolves singleton from parent container when not locally registered', () => {
    const reg = Services();
    reg.add('ONE', [], val(tag('one')));

    const parent = reg.build();
    const child = parent.createScoped();

    const p1 = parent.get('ONE');
    const c1 = child.get('ONE'); // not local -> delegated to parent
    expect(c1).toBe(p1);

    const c2 = child.get('ONE');
    expect(c2).toBe(c1);
  });

  it('singleton cache is actually used (regression guard)', () => {
    const svcs = Services();
    let hits = 0;
    svcs.add('S', [], () => ({ hits: ++hits }));

    const c = svcs.build();
    const s1 = c.get('S');
    const s2 = c.get('S');
    expect(s1).toBe(s2);
    expect(s1.hits).toBe(1);
  });
});
