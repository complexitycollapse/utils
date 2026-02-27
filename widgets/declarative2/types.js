/**
 * @typedef {string | number} SizeValue
 */

/**
 * @typedef {void | Promise<void>} LifecycleResult
 */

/**
 * @typedef {unknown} ChildChannel
 */

/**
 * @typedef {unknown} CapabilityToken
 */

/**
 * @typedef {string | symbol} ContextPathSegment
 */

/**
 * @typedef {readonly ContextPathSegment[]} ContextPath
 */

/**
 * @typedef {{
 *   channel: ChildChannel,
 *   payload: unknown,
 *   child: Widget
 * }} ChildChannelMessage
 */

/**
 * @typedef {(widget: Widget, event: Event) => LifecycleResult} WidgetEventHandler
 */

/**
 * @typedef {(widget: Widget, eventType: string, event: Event) => LifecycleResult} WidgetCatchAllEventHandler
 */

/**
 * @typedef {Record<string, string | number | undefined>} StyleMap
 */

/**
 * @typedef {{extends?: ContextPath, values?: StyleMap}} ThemeExtension
 */

/**
 * @typedef {StyleMap | ThemeExtension} ThemeDescriptor
 */

/**
 * @typedef {{
 *   create?: (widget: Widget) => LifecycleResult,
 *   createChildren?: (widget: Widget) => LifecycleResult,
 *   mount?: (widget: Widget) => LifecycleResult,
 *   activate?: (widget: Widget) => LifecycleResult,
 *   enter?: (widget: Widget) => LifecycleResult,
 *   exit?: (widget: Widget) => LifecycleResult,
 *   deactivate?: (widget: Widget) => LifecycleResult,
 *   unmount?: (widget: Widget) => LifecycleResult,
 *   destroy?: (widget: Widget) => LifecycleResult,
 *   mountChild?: (widget: Widget, child: Widget) => LifecycleResult,
 *   unmountChild?: (widget: Widget, child: Widget) => LifecycleResult,
 *   receive?: (widget: Widget, data: unknown) => LifecycleResult,
 *   eventTypes?: string[],
 *   onEvent?: WidgetCatchAllEventHandler,
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
 *   readonly instantiate: () => WidgetComponent,
 *   readonly with: (other: ComponentSpec) => ComponentSpec,
 *   readonly instantiateAll: () => readonly WidgetComponent[]
 * }} ComponentSpec
 */

/**
 * @typedef {{
 *   readonly components: readonly WidgetComponent[],
 *   readonly children: Widget[],
 *   parent: Widget | undefined,
 *   element: HTMLElement | undefined,
 *   create: () => Promise<void>,
 *   destroy: () => Promise<void>,
 *   addChild: (childSpec: ComponentSpec, options?: { channel?: ChildChannel }) => Widget,
 *   removeChild: (child: Widget) => Promise<void>,
 *   show: () => Promise<void>,
 *   hide: () => Promise<void>,
 *   send: (data: unknown) => void,
 *   sendDown: (data: unknown) => void,
 *   sendUp: (data: unknown) => void,
 *   sendSiblings: (data: unknown) => void,
 *   provideCapability: (token: CapabilityToken, capability: unknown) => void,
 *   revokeCapability: (token: CapabilityToken) => void,
 *   getCapability: (token: CapabilityToken) => unknown,
 *   provideContext: (path: ContextPath, value: unknown) => void,
 *   revokeContext: (path: ContextPath) => void,
 *   getOwnContext: (path: ContextPath) => unknown,
 *   getContext: (path: ContextPath) => unknown
 * }} Widget
 */

export {};
