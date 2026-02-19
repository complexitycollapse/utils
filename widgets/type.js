/**
 * Types for an immutable, append-only widget spec model.
 * `withComponent` and `withChild` always append and return a new `WidgetSpec`.
 */

/**
 * @typedef {Object} WidgetContext
 * @property {string} widgetId
 */

/**
 * @typedef {Object} WidgetEvent
 * @property {string} type
 * @property {unknown} [nativeEvent]
 */

/**
 * @typedef {Object} BuildChildrenApi
 * @property {(child: WidgetSpec) => void} addChild
 * 
 */

/**
 * @typedef {Object} RenderApi
 * @property {(tagName: string) => unknown} ensureElement
 */

/**
 * @typedef {Object} StyleApi
 * @property {(name: string, value: string) => void} setStyle
 * @property {(name: string, enabled?: boolean) => void} setClass
 * @property {(name: string, value: string) => void} setAttr
 */

/**
 * @typedef {Object} MeasureInput
 * @property {number} availableWidth
 * @property {number} availableHeight
 */

/**
 * @typedef {Object} MeasureOutput
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} LayoutInput
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} LayoutOutput
 * @property {number} [contentX]
 * @property {number} [contentY]
 * @property {number} [contentWidth]
 * @property {number} [contentHeight]
 */

/**
 * Input shape accepted by `WidgetSpec.withComponent`.
 * All hooks are optional and will be normalized into `ComponentSpec`.
 *
 * @typedef {Object} ComponentInput
 * @property {string} [id]
 * @property {number} [priority]
 * @property {ReadonlyArray<string>} [events]
 * @property {ReadonlyArray<string>} [capabilities]
 * @property {(ctx: WidgetContext) => void} [create]
 * @property {(ctx: WidgetContext) => void} [destroy]
 * @property {(ctx: WidgetContext, api: BuildChildrenApi) => void} [buildChildren]
 * @property {(ctx: WidgetContext, input: MeasureInput) => MeasureOutput | void} [measure]
 * @property {(ctx: WidgetContext, input: LayoutInput) => LayoutOutput | void} [layout]
 * @property {(ctx: WidgetContext, api: RenderApi) => void} [render]
 * @property {(ctx: WidgetContext, api: StyleApi) => void} [applyStyle]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onPointerDown]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onPointerUp]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onClick]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onKeyDown]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onKeyUp]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onFocus]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onBlur]
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} [onEvent]
 */

/**
 * Normalized component contract.
 * Every hook exists (no-op when omitted in input).
 *
 * @typedef {Object} ComponentSpec
 * @property {string | undefined} id
 * @property {number} priority
 * @property {ReadonlyArray<string>} events
 * @property {ReadonlyArray<string>} capabilities
 * @property {(ctx: WidgetContext) => void} create
 * @property {(ctx: WidgetContext) => void} destroy
 * @property {(ctx: WidgetContext, api: BuildChildrenApi) => void} buildChildren
 * @property {(ctx: WidgetContext, input: MeasureInput) => MeasureOutput | void} measure
 * @property {(ctx: WidgetContext, input: LayoutInput) => LayoutOutput | void} layout
 * @property {(ctx: WidgetContext, api: RenderApi) => void} render
 * @property {(ctx: WidgetContext, api: StyleApi) => void} applyStyle
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onPointerDown
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onPointerUp
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onClick
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onKeyDown
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onKeyUp
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onFocus
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onBlur
 * @property {(ctx: WidgetContext, event: WidgetEvent) => void} onEvent
 */

/**
 * Immutable widget spec. Append-only semantics.
 *
 * @typedef {Object} WidgetSpec
 * @property {ReadonlyArray<ComponentSpec>} components
 * @property {ReadonlyArray<WidgetSpec>} children
 * @property {(component: ComponentInput | ComponentSpec) => WidgetSpec} withComponent
 * @property {(child: WidgetSpec) => WidgetSpec} withChild
 */

/**
 * Retained runtime widget created from a `WidgetSpec`.
 *
 * @typedef {Object} Widget
 * @property {ReadonlyArray<ComponentSpec>} components
 * @property {ReadonlyArray<Widget>} children
 * @property {() => void} create
 * @property {() => void} destroy
 * @property {(child: Widget) => void} addChild
 * @property {(child: Widget) => boolean} removeChild
 * @property {() => void} clear
 * @property {() => void} render
 * @property {() => void} focus
 */

export {};
