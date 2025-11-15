export function Services(parent) {
  const registry = new Map();
  let obj = {
    add(name, deps, factory, dispose) {
      registry.set(name, {deps, factory, dispose, lifetime: "singleton"});
    },
    addInstance(name, instance) {
      registry.set(name, {instance, lifetime: "singleton"});
    },
    addTransient(name, deps, factory, dispose) {
      registry.set(name, {deps, factory, dispose, lifetime: "transient"});
    },
    addScoped(name, deps, factory, dispose) {
      registry.set(name, {deps, factory, dispose, lifetime: "scoped"});
    },
    createScope() {
      return Services(obj);
    },
    get(name) {
      if (registry.has(name)) return registry.get(name);
      if (parent) return parent.get(name);
    },
    has(name) {
      return registry.has(name) || (parent && parent.has(name));
    },
    hasLocally(name) {
      return registry.has(name);
    },
    build() {
      return Container(obj);
    }
  };

  return obj;
}

function Container(services, parent) {
  const singletons = new Map();
  const scoped = new Map();

  let obj = {
    get services() {
      return services;
    },
    get(name, resolveStack) {
      if (resolveStack && resolveStack.includes(name)) {
        throw new CircularDependencyError(name, resolveStack);
      }

      if (!services.has(name)) throw new ResolveError(name, resolveStack);
      const {deps, factory, lifetime, instance} = services.get(name);
      
      if (lifetime == "transient") {
        return create(name, deps, factory, resolveStack);
      }

      if (lifetime == "scoped") {
        if (scoped.has(name)) return scoped.get(name);
        const result = instance ?? create(name, deps, factory, resolveStack);
        scoped.set(name, result);
        return result;
      }

      if (lifetime == "singleton") {
        if (singletons.has(name)) return singletons.get(name);

        if (parent == null || services.hasLocally(name)) {
          const result = instance ?? create(name, deps, factory, resolveStack);
          singletons.set(name, result);
          return result;
        }
        
        // We only get here if we have a parent AND the service was defined in the parent
        // rather in the child (in which case the instance should be shared with the parent)
        if (parent) {
          return parent.get(name, resolveStack);
        }
      }
    },
    createScoped() {
      return Container(Services(services), obj);
    }
  };

  function create(name, deps, factory, resolveStack) {
    resolveStack = resolveStack ?? [];
    resolveStack.push(name);

    try {
      const dependencies = deps.map((dep) => obj.get(dep, resolveStack));

      if (typeof factory !== "function" && factory !== undefined) {
        throw new Error(`Factory for ${name} is not a function`);
      }

      return factory ? factory(...dependencies) : undefined;
    } finally {
      resolveStack.pop();
    }
  }

  return obj;
}

export class ResolveError extends Error {
  constructor(dependencyName, resolveStack) {
    resolveStack = resolveStack ?? [];
    super(`Could not resolve ${resolveStack[0]}. Missing dependency ${dependencyName}. Path: ${prettyPrintDependencyTrace(resolveStack, 0, dependencyName)}`);
    this.name = 'ResolveError';
    this.dependencyName = dependencyName;
    this.resolveStack = resolveStack;
  }
}

export class CircularDependencyError extends Error {
  constructor(dependencyName, resolveStack) {
    super(`Circular dependency found in resolution of ${resolveStack[0]}. Path: ${prettyPrintDependencyTrace(resolveStack, resolveStack.indexOf(dependencyName), dependencyName)}`);
    this.name = 'CircularDependencyError';
    this.dependencyName = dependencyName;
    this.resolveStack = resolveStack;
  }
}

function prettyPrintDependencyTrace(resolveStack, firstElementIndex, lastElement) {
  const result = resolveStack.length == 0 ? [] : resolveStack.slice(firstElementIndex);
  if (lastElement !== undefined) {
    result.push(lastElement);
  }
  return result.join(' -> ');
}
