import { clear } from "./2d.js";
import * as canvasModule from "./canvas.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() { canvasModule.resizeCanvas(canvas); }

addEventListener("resize", resizeCanvas);
resizeCanvas();

function gameLoop() {
  clear(ctx, "black");
  window.requestAnimationFrame(gameLoop);
}

gameLoop();
