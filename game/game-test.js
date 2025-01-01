import * as canvasModule from "./canvas.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() { canvasModule.resizeCanvas(canvas); }

addEventListener("resize", () => resizeCanvas(canvas));
resizeCanvas();

function gameLoop() {
  ctx.fillColor = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  window.requestAnimationFrame(gameLoop);
}

gameLoop();
