/**
 * @typedef {string | number} SizeValue
 */

/**
 * @typedef {(widget: Widget, event: Event) => void} WidgetEventHandler
 */

/**
 * @typedef {{
 *   create?: (widget: Widget) => void,
 *   destroy?: (widget: Widget) => void,
 *   beforeShow?: (widget: Widget) => void,
 *   afterShow?: (widget: Widget) => void,
 *   mountChild?: (widget: Widget, child: Widget) => void,
 *   unmountChild?: (widget: Widget, child: Widget) => void,
 *   hide?: (widget: Widget) => void,
 *   receive?: (widget: Widget, data: unknown) => void,
 *   click?: WidgetEventHandler,
 *   dblclick?: WidgetEventHandler,
 *   input?: WidgetEventHandler,
 *   change?: WidgetEventHandler,
 *   submit?: WidgetEventHandler,
 *   focus?: WidgetEventHandler,
 *   blur?: WidgetEventHandler,
 *   keydown?: WidgetEventHandler,
 *   keyup?: WidgetEventHandler,
 *   mousedown?: WidgetEventHandler,
 *   mouseup?: WidgetEventHandler,
 *   mousemove?: WidgetEventHandler,
 *   mouseenter?: WidgetEventHandler,
 *   mouseleave?: WidgetEventHandler,
 *   pointerdown?: WidgetEventHandler,
 *   pointerup?: WidgetEventHandler,
 *   pointercancel?: WidgetEventHandler,
 *   pointermove?: WidgetEventHandler,
 *   [key: string]: unknown
 * }} WidgetComponent
 */

/**
 * @typedef {{
 *   readonly components: WidgetComponent[],
 *   readonly children: Widget[],
 *   parent: Widget | undefined,
 *   element: HTMLElement | undefined,
 *   create: () => void,
 *   destroy: () => void,
 *   addChild: (child: Widget) => void,
 *   removeChild: (child: Widget) => void,
 *   show: () => void,
 *   hide: () => void,
 *   send: (data: unknown) => void,
 *   sendDown: (data: unknown) => void,
 *   sendUp: (data: unknown) => void,
 *   sendSiblings: (data: unknown) => void
 * }} Widget
 */

export {};
