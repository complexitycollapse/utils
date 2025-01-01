export function resizeCanvas(canvas) {
  const widthToHeight = 16/9;
  const adjustedWidth = window.innerHeight * widthToHeight;
  const adjustedHeight = window.innerWidth / widthToHeight;

  if (adjustedWidth > window.innerWidth) {
    canvas.width = window.innerWidth;
    canvas.height = adjustedHeight;
  } else {
    canvas.width = adjustedWidth;
    canvas.height = window.innerHeight;
  }
};
