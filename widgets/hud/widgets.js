import { createButton } from "../declarative/button.js";
import { listComponent } from "../declarative/list.js";
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
 * @param {{
 *   visualComponentSpec: import("../declarative/types.js").ComponentSpec,
 *   message: unknown,
 *   glowColor?: string,
 *   defaultBackground?: string,
 *   pressedBackground?: string,
 *   pressedClassName?: string,
 *   hoverClassName?: string,
 *   buttonClassName?: string
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
 *   pressedBackground?: string,
 *   hoverClassName?: string,
 *   pressedClassName?: string,
 *   buttonClassName?: string
 * }} [options]
 * @returns {import("../declarative/types.js").ComponentSpec}
 */
export function createHudTextButton(text, options = {}) {
  const {
    glowColor = "rgba(0, 255, 245, 0.72)",
    textColor = "#c6f9ff",
    borderColor = "rgba(75, 255, 249, 0.78)",
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

  /** @type {{
   *   visualComponentSpec: import("../declarative/types.js").ComponentSpec,
   *   message: unknown,
   *   glowColor?: string,
   *   defaultBackground?: string,
   *   pressedBackground?: string,
   *   pressedClassName?: string,
   *   hoverClassName?: string,
   *   buttonClassName?: string
   * }} */
  const buttonOptions = {
    visualComponentSpec,
    message: text,
    glowColor,
    defaultBackground: "transparent",
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
 *   className?: string
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
