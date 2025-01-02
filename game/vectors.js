export function V2(x, y) {
  const obj = {
    dim: 2,
    x,
    y,
    add(v2) {
      if (v2.dim !== obj.dim) {
        throw new Error('Cannot add a vector of different dimensions');
      }
      return V2(obj.x + v2.x, obj.y + v2.y);
    },
    mul(scalar) {
      return V2(obj.x * scalar, obj.y * scalar);
    },
    clamp(lower, upper) {
      if (lower.dim !== obj.dim || upper.dim !== obj.dim) {
        throw new Error('Cannot clamp with a vector of different dimensions');
      }

      return V2(
        Math.max(lower.x, Math.min(upper.x, obj.x)),
        Math.max(lower.y, Math.min(upper.y, obj.y))
      );
    }
  };
}

export function V3(x, y, z) {
  const obj = {
    dim: 2,
    x,
    y,
    z,
    add(v3) {
      if (v3.dim !== obj.dim) {
        throw new Error('Cannot add a vector of different dimensions');
      }
      return V3(obj.x + v3.x, obj.y + v3.y, obj.z + v3.z);
    },
    mul(scalar) {
      return V3(obj.x * scalar, obj.y * scalar, obj.z * scalar);
    },
    clamp(lower, upper) {
      if (lower.dim !== obj.dim || upper.dim !== obj.dim) {
        throw new Error('Cannot clamp with a vector of different dimensions');
      }

      return V3(
        Math.max(lower.x, Math.min(upper.x, obj.x)),
        Math.max(lower.y, Math.min(upper.y, obj.y)),
        Math.max(lower.z, Math.min(upper.z, obj.z))
      );
    }
  };
}

export function V4(x, y, z, w) {
  const obj = {
    dim: 2,
    x,
    y,
    z,
    w,
    add(v4) {
      if (v4.dim !== obj.dim) {
        throw new Error('Cannot add a vector of different dimensions');
      }
      return V4(obj.x + v4.x, obj.y + v4.y, obj.z + v4.z, obj.w + v4.w);
    },
    mul(scalar) {
      return V4(obj.x * scalar, obj.y * scalar, obj.z * scalar, obj.w * scalar);
    },
    clamp(lower, upper) {
      if (lower.dim !== obj.dim || upper.dim !== obj.dim) {
        throw new Error('Cannot clamp with a vector of different dimensions');
      }

      return V4(
        Math.max(lower.x, Math.min(upper.x, obj.x)),
        Math.max(lower.y, Math.min(upper.y, obj.y)),
        Math.max(lower.z, Math.min(upper.z, obj.z)),
        Math.max(lower.w, Math.min(upper.w, obj.w))
      );
    }
  };
}
