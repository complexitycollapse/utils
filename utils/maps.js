export function mergeMaps(target, source) {
  [...source.entries()].forEach(e=> target.set(e[0], e[1]));
}
