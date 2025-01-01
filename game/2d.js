export function clear(ctx, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawImage(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh, rotation) {
  ctx.setTransform(1, 0, 0, 1, dx, dy);
  ctx.rotate(rotation * 2 * Math.PI);
  ctx.drawImage(image, sx, sy, sw, sh, -dw/2, -dh/2, dw, dh);
}
