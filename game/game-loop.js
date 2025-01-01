let currentFrameTime = 0, lastFrameTime = 0;

export function gameLoop(pipeline, context) {
  currentFrameTime = performance.now();
  const deltaTime = (currentFrameTime - lastFrameTime) / 1000;
  const frameData = { deltaTime, currentFrameTime, context };

  pipeline.forEach(item => {
    item(frameData);
  });

  lastFrameTime = currentFrameTime;
  window.requestAnimationFrame(() => gameLoop(pipeline, context));
}
