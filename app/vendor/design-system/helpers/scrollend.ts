// Polyfill for 'scrollend' event support
// Adapted from https://github.com/argyleink/scrollyfills/blob/main/src/scrollend.js
// (c) 2023 Adam Argyle, ISC license

const isSupported = () => typeof window === "undefined" || "onscrollend" in window;

let pointers: Set<number>;
let scrollendEvent: Event;
// Map of scroll-observed elements.
let observedElements: WeakMap<object, { scrollListener: (evt: Event) => void; listeners: number }>;

export function addScrollendEventListener(
  element: ObservableElement,
  listener: (event: Event) => void,
) {
  if (isSupported()) {
    // If the browser supports scrollend natively, use the native event.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    element.addEventListener("scrollend", listener as EventListener);
    return;
  }

  pointers = pointers || new Set();
  scrollendEvent = scrollendEvent || new Event("scrollend");
  observedElements = observedElements || new WeakMap();

  // Track if any pointer is active
  document.addEventListener(
    "touchstart",
    (e) => {
      for (const touch of e.changedTouches) {
        pointers.add(touch.identifier);
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    (e) => {
      for (const touch of e.changedTouches) {
        pointers.delete(touch.identifier);
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "touchcancel",
    (e) => {
      for (const touch of e.changedTouches) {
        pointers.delete(touch.identifier);
      }
    },
    { passive: true },
  );

  // Forward and observe calls to a native method.
  function observe(proto: ObservableElement, method: "add" | "remove", handler: ObserveFunction) {
    const _method = `${method}EventListener` as const;
    const native = proto[_method];
    proto[_method] = function () {
      // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
      const args: any = Array.prototype.slice.apply(arguments, [0]);
      native.apply(this, args);
      args.unshift(native);
      handler.apply(this, args);
    };
  }

  function onAddListener(
    this: ObservableElement,
    originalFn: ObservedFunction,
    type: ObserveType,
    _handler: Listener,
    _options: Options,
  ) {
    // Polyfill scrollend event on any element for which the developer listens
    // to 'scrollend' explicitly or 'scroll' (so that adding a scrollend
    // listener from within a scroll listener works).
    if (type !== "scroll" && type !== "scrollend") {
      return;
    }

    const scrollport = this;
    let data = observedElements.get(scrollport);
    if (data === undefined) {
      let timeout = 0;
      data = {
        scrollListener: (_evt) => {
          window.clearTimeout(timeout);
          timeout = window.setTimeout(() => {
            if (pointers.size && data?.scrollListener) {
              // if pointer(s) are down, wait longer
              window.setTimeout(data.scrollListener, 100);
            } else {
              // dispatch
              if (scrollport) {
                scrollport.dispatchEvent(scrollendEvent);
              }

              timeout = 0;
            }
          }, 100);
        },
        listeners: 0, // Count of number of listeners.
      };
      originalFn.apply(scrollport, ["scroll", data.scrollListener]);
      observedElements.set(scrollport, data);
    }

    data.listeners++;
  }

  function onRemoveListener(
    this: ObservableElement,
    originalFn: ObservedFunction,
    type: ObserveType,
    _handler: Listener,
    _options: Options,
  ) {
    if (type !== "scroll" && type !== "scrollend") {
      return;
    }

    const scrollport = this;
    const data = observedElements.get(scrollport);

    // Mismatched addEventListener / removeEventListener
    // TODO: Should we explicitly track added listeners to prevent this?
    if (data === undefined) {
      return;
    }

    // If there are still listeners, nothing more to do.
    if (--data.listeners > 0) {
      return;
    }

    // Otherwise, remove the added listeners.
    originalFn.apply(scrollport, ["scroll", data.scrollListener]);
    observedElements.delete(scrollport);
  }

  observe(Element.prototype, "add", onAddListener);
  observe(window, "add", onAddListener);
  observe(document, "add", onAddListener);
  observe(Element.prototype, "remove", onRemoveListener);
  observe(window, "remove", onRemoveListener);
  observe(document, "remove", onRemoveListener);
}

type ObservableElement = Element | Window | Document;
type ObservedFunction = (
  type: string,
  handler: (evt: Event) => void,
  options?: boolean | AddEventListenerOptions,
) => void;
type ObserveType = "scroll" | "scrollend";
type Options = boolean | AddEventListenerOptions | undefined;

type ObserveFunction = (
  this: ObservableElement,
  originalFn: ObservedFunction,
  type: ObserveType,
  handler: Listener,
  options: Options,
) => void;
type Listener = (event: Event) => void;
