import { clear } from "./2d.js";
import * as canvasModule from "./canvas.js";
import { gameLoop } from "./game-loop.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() { canvasModule.resizeCanvas(canvas); }

addEventListener("resize", resizeCanvas);
resizeCanvas();

gameLoop([
  ({ context }) => clear(context.ctx, "black")
],
{ canvas, ctx });
