/**
 * samuelphan.com — pub/sub event bus
 * Lightweight publish/subscribe for decoupled component communication.
 */
export function createEventBus() {
  const listeners = {};

  return {
    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
      return () => this.off(event, fn);
    },

    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },

    emit(event, data) {
      if (!listeners[event]) return;
      listeners[event].forEach(fn => {
        try { fn(data); } catch (e) { console.error(`[pubsub] ${event}:`, e); }
      });
    },

    once(event, fn) {
      const wrapper = (data) => {
        this.off(event, wrapper);
        fn(data);
      };
      this.on(event, wrapper);
    },
  };
}

// Singleton bus for the whole app
export const bus = createEventBus();
