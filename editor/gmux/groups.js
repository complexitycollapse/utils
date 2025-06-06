export function Group(name, direction, members = [], sizing = {}, props = {}) {
  const group = {
    ...props,
    sizing,
    name,
    direction,
    visible: true,
    members,
    get(name) {
      if (name === group.name) {
        return group;
      } else {
        for (const member of group.members) {
          const found = member.get(name);
          if (found) {
            return found;
          }
        }
      }
    },
    add(name, members, props) {
      const newGroup = Group(name, flip(group.direction), members, props);
      group.members.push(newGroup);
      return newGroup;
    },
    setSize(sizing) {
      group.sizing = sizing;
      group.doLayout();
    },
    setPanel(panel) {
      group.panel = panel;
      group.doLayout();
    },
    removePanel() {
      group.panel = undefined;
      group.doLayout();
    },
    doLayout() {
      const panel = group.panel;
      if (panel) {
        panel.line = group.line;
        panel.col = group.col;
        panel.lines = group.lines;
        panel.cols = group.cols;
        panel.z = group.z;
        panel.visible = group.visible;
        panel.doLayout(group);
      } else {
        recalculateLayout(group);
        group.members.forEach(m => m.doLayout());
      }
    },
    getDimensions(direction, sizing) {
      const obj = sizing ? group.sizing : group;
      if (direction === "horizontal") {
        return {
          pos: obj.col,
          size: obj.cols,
          min: obj.minCols,
          max: obj.maxCols,
          original: group
        };
      } else {
        return {
          pos: obj.line,
          size: obj.lines,
          min: obj.minLines,
          max: obj.maxLines,
          original: group
        };
      }
    },
    setDimensions(direction, pos, size) {
      if (direction === "horizontal") {
        group.col = pos;
        group.cols = size;
      } else {
        group.line = pos;
        group.lines = size;
      }
    },
    stringify(indent = 0) {
      const sizing = group.sizing;
      const spaces = " ".repeat(indent * 2);
      return `${spaces}${group.name}(${group.direction}), {${group.col}, ${group.line}, ${group.cols}, ${group.lines}}:{${sizing.col}, ${sizing.line}, ${sizing.cols}, ${sizing.lines}} [\n${group.members.map(m => m.stringify(indent+1)).join(",\n")}\n${spaces}]`;
    }
  }

  return group;
}

export function Stack(name, members, sizing = {}, props = {}) {
  const stack = Group(name, "z", members, sizing, props);
  stack.doLayout = function () {
    const panel = stack.panel;
    if (panel) {
      panel.line = stack.line;
      panel.col = stack.col;
      panel.lines = stack.lines;
      panel.cols = stack.cols;
      panel.z = stack.z;
      panel.setDimensions(stack);
    } else {
      stack.members.forEach(m => {
        m.line = stack.line;
        m.col = stack.col;
        m.lines = stack.lines;
        m.cols = stack.cols;
        m.z = stack.z;
      });
      stack.members.forEach(m => m.doLayout());
    }
  };

  return stack;
}

function recalculateLayout(group) {
  const groupDimensions = group.getDimensions(group.direction);
  const otherDimensions = group.getDimensions(flip(group.direction));
  const memberDimensions = group.members.filter(m => m.visible).map(m => m.getDimensions(group.direction, true));
  calculateSizes(memberDimensions, groupDimensions.size);

  let pos = groupDimensions.pos;
  memberDimensions.forEach(d => {
    const size = d.original.visible ? d.size : 0;

    // Dimensions along the group axis are set according to the calculation.
    d.original.setDimensions(group.direction, pos, size);
    // Dimensions along the other axis are equal to the group's.
    d.original.setDimensions(
      flip(group.direction),
      otherDimensions.pos,
      otherDimensions.size);
    pos += size;
  });
}

function calculateSizes(dimensions, groupSize) {
  // Find out the total minimum size of all the members and the remaining free space.
  const usedSpace = sum(dimensions.map(m => m.size ?? m.min));
  let freeSpace = groupSize - usedSpace;

  // If there is no free space left, everything gets the minimum size.
  if (freeSpace === 0) {
    dimensions.forEach(m => m.size = m.size ?? m.min ?? 1);
    return;
  }

  // If the members are too large, even at minimum size, we need to shrink them.
  if (freeSpace < 0) {
    shrinkToFit(dimensions, -freeSpace);
    return;
  }

  // Otherwise, we need to stretch the members to fill the space.

  // Members that don't have a size set will need to have one calculated.
  const requireResize = dimensions.filter(m => !m.size);

  // Attempt to distribute the remaining space evenly, respecting the maximum
  // size of each member.
  while (freeSpace > 0 && requireResize.length > 0) {
    const paddings = splitInteger(freeSpace, requireResize.length);
    const undersized = requireResize.filter((m, i) => m.max && m.max < paddings[i]);
    if (undersized.length === 0) {
      requireResize.forEach((m, i) => {
        m.size = paddings[i];
      });
      break;
    }
    undersized.forEach(m => {
      m.size = m.max;
      freeSpace -= m.size;
      removeItem(requireResize, m);
    });
  }
}

function shrinkToFit(dimensions, excess) {
  const empty = dimensions.filter(d => d.original.panel === undefined);
  const emptySize = sum(empty.map(d => d.size));
  
  if (emptySize >= excess) {
    // We can shrink the empty members to fit.
    const reductions = splitInteger(excess, empty.length);
    empty.forEach((d, i) => d.size -= reductions[i]);
  }

  // Otherwise, we need to shrink the members that are not empty.
  empty.forEach(d => d.size = 0);
  const nonEmpty = dimensions.filter(d => d.original.panel);
  const reductions = splitInteger(excess - emptySize, nonEmpty.length);
  nonEmpty.forEach((d, i) => d.size -= reductions[i]);
}

function flip(direction) {
  return direction === "horizontal" ? "vertical" : "horizontal";
}

function removeItem(arr, item) {
  const index = arr.indexOf(item);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

function sum(arr) {
  return arr.reduce((acc, val) => acc + (val ?? 0), 0);
}

// Split an integer into an array of integers that sum to the original
function splitInteger(integer, divisor) {
  const quotient = Math.floor(integer / divisor);
  const remainder = integer % divisor;

  const parts = new Array(divisor).fill(quotient);
  for (let i = parts.length - 1, j = 0; j < remainder; i--, j++) {
    parts[i]++;
  }

  return parts;
}
