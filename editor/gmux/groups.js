export function Group(name, direction, members = [], sizing = {}, props = {}) {
  const group = {
    ...props,
    sizing,
    name,
    direction,
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
        panel.setDimensions(group);
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
  const memberDimensions = group.members.map(m => m.getDimensions(group.direction, true));
  calculateSizes(memberDimensions, groupDimensions.size);

  let pos = groupDimensions.pos;
  memberDimensions.forEach(d => {
    // Dimensions along the group axis are set according to the calculation.
    d.original.setDimensions(group.direction, pos, d.size);
    // Dimensions along the other axis are equal to the group's.
    d.original.setDimensions(
      flip(group.direction),
      otherDimensions.pos,
      otherDimensions.size);
    pos += d.size;
  });
}

function calculateSizes(dimensions, groupSize) {
  // Find out the total minimum size of all the members and the remaining free space.
  const usedSpace = sum(dimensions.map(m => m.size ?? m.min));
  const freeSpace = groupSize - usedSpace;

  // If there is no free space left, everything gets the minimum size.
  if (freeSpace <= 0) {
    dimensions.forEach(m => m.size = m.size ?? m.min ?? 1);
    return;
  }

  // Members that don't hae a size set will need to have one calculated.
  const requireResize = dimensions.filter(m => !m.size);

  // Attempt to distribute the remaining space evenly, respecting the maximum
  // size of each member.
  while (freeSpace > 0 && requireResize.length > 0) {
    const padding = freeSpace / requireResize.length;
    const undersized = requireResize.filter(m => m.max && m.max < padding);
    if (undersized.length === 0) {
      requireResize.forEach(m => {
        m.size = padding;
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
