// const globalBindings = new Map([
//   ["F11", () => electron.toggleFullScreen()],
//   ["F12", () => console.error("Open dev tools")]
// ]);

export function KeyBindings(localBindings) {
  let obj = {
    localBindings,
    element: undefined,
    addBindingsToElement(element) {
      obj.element = element;
      element.addEventListener("keydown", handleKeydown(obj));
    },
  };

  return obj;
}

function handleKeydown(bindings) {
  return event => {
    const keyString = getKeyString(event);
    console.log(keyString);
    const binding = bindings.localBindings?.get(keyString) ?? globalBindings.get(keyString);
    if (binding) {
      event.stopPropagation();
      event.preventDefault();
      binding(); 
    };
  }
}

export function getKeyString(event) {
  const keys = [];
  if (event.ctrlKey) keys.push("Ctrl");
  if (event.altKey) keys.push("Alt");
  if (event.shiftKey) keys.push("Shift");
  keys.push(event.key);
  const combination = keys.join("-");
  return combination;
}

//document.addEventListener('keydown', handleKeydown(KeyBindings()));
