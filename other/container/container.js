/*
A simple IOC container. Two phases: defining the services and then using the services. Use
createScope to make a child scope. Use createScopedServices to get a new Services object that
inherits singletons from the parent container. This allows new services to be defined only on the
children. You can also define new singletons at this level to create a child with local state that
can be shared with grandchildren but not parents or siblings.
*/

export function Services(parentContainer) {
  const registry = new Map();
  let frozen = false;

  let obj = {
    add(name, deps, factory, dispose) {
      register(name, {deps, factory, dispose, lifetime: "singleton"});
    },
    addInstance(name, instance) {
      register(name, {instance, lifetime: "singleton"});
    },
    addTransient(name, deps, factory, dispose) {
      register(name, {deps, factory, dispose, lifetime: "transient"});
    },
    addScoped(name, deps, factory, dispose) {
      register(name, {deps, factory, dispose, lifetime: "scoped"});
    },
    get(name) {
      return registry.get(name);
    },
    has(name) {
      return registry.has(name);
    },
    build() {
      frozen = true;
      return Container(obj, parentContainer);
    }
  };

  function register(name, registration) {
    if (frozen) {
      throw new Error("Can't add services once the container has been created.");
    }
    registry.set(name, registration);
  }

  return obj;
}

function Container(services, parent) {
  const singletons = new Map();
  const scoped = new Map();

  let obj = {
    get services() {
      return services;
    },
    get parent() {
      return parent;
    },
    get(name, resolveStack) {
      if (resolveStack && resolveStack.includes(name)) {
        throw new CircularDependencyError(name, resolveStack);
      }

      const {deps, factory, lifetime, instance} = getRegistration(name, obj, resolveStack);
      
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

        // If the singleton is defined at this level then it should be created
        // only at this level, not in the parent.
        if (services.has(name)) {
          const result = instance ?? create(name, deps, factory, resolveStack);
          singletons.set(name, result);
          return result;
        }

        // If the singleton was not defined at this level then obviously it must have been defined
        // at the parent level.
        return parent.get(name, resolveStack);
      }
    },
    createScope() {
      return Container(this.createScopedServices(), obj);
    },
    createScopedServices() {
      return Services(obj);
    }
  };

  function getRegistration(name, container, resolveStack) {
    if (container.services.has(name)) {
      return container.services.get(name);
    }
    if (container.parent) {
      return getRegistration(name, parent, resolveStack);
    }
    throw new ResolveError(name, resolveStack);
  }

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
