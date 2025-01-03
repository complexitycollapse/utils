export function ChooserComponent({ component }) {
  if (component === "parameterTest") {
    return <h1>Received parameterTest as selected component</h1>;
  } else {
    return <h1>Did not understand component parameter: {component}</h1>;
  }
}
