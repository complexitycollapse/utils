import { createButton } from "../declarative/button.js";
import { ComponentSpec, childComponentSpec } from "../declarative/widget.js";
import { listComponent } from "../declarative/list.js";
import { gridComponent } from "../declarative/grid.js";
import {
  alignComponent,
  backgroundComponent,
  boxComponent,
  classComponent,
  divComponent,
  paddingComponent,
  styleComponent,
  textComponent
} from "../declarative/components.js";

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @returns {Promise<void>}
 */
function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * @param {{
 *   visualComponentSpec: import("../declarative/types.js").ComponentSpec,
 *   message: unknown,
 *   glowColor?: string,
 *   defaultBackground?: string,
 *   pressedBackground?: string,
 *   pressedClassName?: string,
 *   hoverClassName?: string,
 *   buttonClassName?: string | string[]
 * }} options
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudButton(options) {
  const {
    visualComponentSpec,
    message,
    glowColor = "rgba(0, 255, 245, 0.72)",
    buttonClassName = "hud-btn",
    ...buttonOptions
  } = options;

  return createButton({
    visualComponentSpec,
    message,
    ...buttonOptions
  })
    .with(classComponent(buttonClassName))
    .with(styleComponent({ "--glow-color": glowColor }));
}

/**
 * @param {string} text
 * @param {{
 *   glowColor?: string,
 *   textColor?: string,
 *   borderColor?: string,
 *   defaultBackground?: string,
 *   pressedBackground?: string,
 *   hoverClassName?: string,
 *   pressedClassName?: string,
 *   buttonClassName?: string | string[]
 * }} [options]
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudTextButton(text, options = {}) {
  const {
    glowColor = "rgba(0, 255, 245, 0.72)",
    textColor = "#c6f9ff",
    borderColor = "rgba(75, 255, 249, 0.78)",
    defaultBackground = "transparent",
    pressedBackground = "rgba(0, 255, 245, 0.2)",
    hoverClassName,
    pressedClassName,
    buttonClassName
  } = options;

  const visualComponentSpec = divComponent()
    .with(textComponent(text, { fontSize: 15, fontWeight: 600, color: textColor }))
    .with(paddingComponent("8px 12px"))
    .with(alignComponent("center", "center"))
    .with(backgroundComponent({ color: "transparent" }))
    .with(
      boxComponent({
        width: 1,
        style: "solid",
        color: borderColor,
        radius: 10
      })
    );

  /** 
   * @type {{
   *   visualComponentSpec: import("../declarative/types.js").ComponentSpec,
   *   message: unknown,
   *   glowColor?: string,
   *   defaultBackground?: string,
   *   pressedBackground?: string,
   *   pressedClassName?: string,
   *   hoverClassName?: string,
   *   buttonClassName?: string | string[]
   * }}
   */
  const buttonOptions = {
    visualComponentSpec,
    message: text,
    glowColor,
    defaultBackground,
    pressedBackground
  };

  if (hoverClassName !== undefined) {
    buttonOptions.hoverClassName = hoverClassName;
  }
  if (pressedClassName !== undefined) {
    buttonOptions.pressedClassName = pressedClassName;
  }
  if (buttonClassName !== undefined) {
    buttonOptions.buttonClassName = buttonClassName;
  }

  return createHudButton(buttonOptions);
}

/**
 * @param {{
 *   orientation?: "vertical" | "horizontal",
 *   gap?: string | number,
 *   padding?: string | number,
 *   className?: string | string[]
 * }} [options]
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudList(options = {}) {
  const {
    orientation = "vertical",
    gap = "12px",
    padding = "14px",
    className = "hud-list"
  } = options;

  return divComponent()
    .with(listComponent(orientation))
    .with(styleComponent({ gap, padding }))
    .with(classComponent(className));
}

/**
 * @param {string} title
 * @param {import("../declarative/types.js").ComponentSpec} contentComponentSpec
 * @param {{
 *   panelClassName?: string
 * }} [options]
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudModalWindow(title, contentComponentSpec, options = {}) {
  const { panelClassName } = options;
  const panelClassNames = panelClassName
    ? ["hud-modal-panel", panelClassName]
    : "hud-modal-panel";

  const modalMotionSpec = ComponentSpec(() => {
    return {
      mount(widget) {
        if (!widget.element) {
          return;
        }
        widget.element.classList.remove("is-entering", "is-open", "is-closing");
      },
      async enter(widget) {
        if (!widget.element) {
          return;
        }

        widget.element.classList.remove("is-closing");
        widget.element.classList.add("is-entering");
        await nextFrame();
        if (!widget.element) {
          return;
        }
        widget.element.classList.add("is-open");
        widget.element.classList.remove("is-entering");
        await delay(360);
      },
      async exit(widget) {
        if (!widget.element) {
          return;
        }

        widget.element.classList.remove("is-entering", "is-open");
        widget.element.classList.add("is-closing");
        await delay(240);
        if (!widget.element) {
          return;
        }
        widget.element.classList.remove("is-closing");
      },
      unmount(widget) {
        if (!widget.element) {
          return;
        }
        widget.element.classList.remove("is-entering");
        widget.element.classList.remove("is-open");
        widget.element.classList.remove("is-closing");
      }
    };
  });

  const titleSpec = divComponent()
    .with(classComponent("hud-modal-title"))
    .with(textComponent(title, { fontSize: 18, fontWeight: 700, color: "#d8f7ff" }));

  const panelSpec = createHudList({
    orientation: "vertical",
    gap: "12px",
    padding: "16px",
    className: panelClassNames
  })
    .with(childComponentSpec(titleSpec))
    .with(childComponentSpec(contentComponentSpec));

  return divComponent()
    .with(classComponent("hud-modal-window"))
    .with(modalMotionSpec)
    .with(childComponentSpec(panelSpec));
}

/**
 * @param {string} title
 * @param {string} text
 * @param {string[]} buttonCaptions
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudModalDialog(title, text, buttonCaptions) {
  const textSpec = divComponent()
    .with(classComponent("hud-modal-text"))
    .with(textComponent(text, { fontSize: 14, lineHeight: "1.5", color: "#c6f9ff" }));

  let actionsSpec = createHudList({
    orientation: "horizontal",
    gap: "10px",
    padding: 0,
    className: "hud-modal-actions"
  }).with(styleComponent({ justifyContent: "flex-end" }));

  for (const caption of buttonCaptions) {
    actionsSpec = actionsSpec.with(
      childComponentSpec(
        createHudTextButton(caption, {
          borderColor: "rgba(75, 255, 249, 0.72)",
          pressedBackground: "rgba(0, 255, 245, 0.24)"
        })
      )
    );
  }

  const dialogContentSpec = createHudList({
    orientation: "vertical",
    gap: "12px",
    padding: 0,
    className: "hud-modal-dialog-content"
  })
    .with(childComponentSpec(textSpec))
    .with(childComponentSpec(actionsSpec));

  return createHudModalWindow(title, dialogContentSpec);
}

/**
 * @param {{
 *   title?: string,
 *   columns?: number,
 *   rows?: number,
 *   swatchSize?: number,
 *   spacing?: number
 * }} [options]
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudColourPicker(options = {}) {
  const {
    title = "Colour Picker",
    columns = 12,
    rows = 6,
    swatchSize = 28,
    spacing = 8
  } = options;

  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 720 : window.innerHeight;

  const maxGridWidth = Math.max(220, viewportWidth - 140);
  const maxGridHeight = Math.max(180, viewportHeight - 240);

  const maxCellWidth = Math.floor(maxGridWidth / columns);
  const maxCellHeight = Math.floor(maxGridHeight / rows);
  const fitCellSize = Math.max(6, Math.min(maxCellWidth, maxCellHeight));
  const baseSpacing = Math.max(1, Math.floor(fitCellSize / 6));

  const effectiveSpacing = Math.min(spacing, baseSpacing);
  const effectiveSwatchSize = Math.max(
    6,
    Math.min(swatchSize, fitCellSize - effectiveSpacing)
  );
  const gridWidth =
    (columns * effectiveSwatchSize) + ((columns - 1) * effectiveSpacing);

  let swatchGridSpec = divComponent()
    .with(classComponent("hud-colour-grid"))
    .with(styleComponent({ margin: "0 auto" }))
    .with(
      gridComponent(
        gridWidth,
        effectiveSwatchSize,
        effectiveSwatchSize,
        effectiveSpacing,
        effectiveSpacing
      )
    );

  for (let row = 0; row < rows; row += 1) {
    const saturation = Math.round(20 + ((row / Math.max(1, rows - 1)) * 80));

    for (let column = 0; column < columns; column += 1) {
      const hue = Math.round((column / columns) * 360);
      const color = `hsl(${hue} ${saturation}% 50%)`;

      const swatchVisualSpec = divComponent()
        .with(classComponent("hud-colour-swatch"))
        .with(backgroundComponent({ color }))
        .with(boxComponent({
          width: 1,
          style: "solid",
          color: "rgba(255, 255, 255, 0.2)",
          radius: 7
        }));

      swatchGridSpec = swatchGridSpec.with(
        childComponentSpec(
          createHudButton({
            visualComponentSpec: swatchVisualSpec,
            message: color,
            defaultBackground: color,
            pressedBackground: color,
            buttonClassName: ["hud-btn", "hud-colour-swatch-btn"]
          })
        )
      );
    }
  }

  const contentSpec = divComponent()
    .with(childComponentSpec(swatchGridSpec));

  return createHudModalWindow(title, contentSpec, {
    panelClassName: "hud-modal-panel-wide"
  });
}
