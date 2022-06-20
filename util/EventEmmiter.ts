// deno-lint-ignore-file ban-types


/**
 * An event emitter (observer pattern)
 * */
export class EventEmitter {
   listeners = new Map<PropertyKey, Function[]>;

   #addListener(event: string, func: Function) {
      this.listeners.set(event, this.listeners.get(event) || []);
      this.listeners.get(event)?.push(func);
      return this;
   }

   on(event: string, func: Function) {
      return this.#addListener(event, func);
   }

   #removeListener(event: string, func: Function) {
      if (this.listeners.has(event)) {
         const listener = this.listeners.get(event);

         if (listener?.includes(func)) {
            listener.splice(listener.indexOf(func), 1);

            if (listener.length === 0) {
               this.listeners.delete(event);
            }
         }
      }

      return this;
   }

   off(event: string, func: Function) {
      return this.#removeListener(event, func);
   }

   once(event: string, func: Function) {
      // it is important for this to be an arrow function
      const closure = () => {
         func();
         this.off(event, func);
      }

      const listener = this.listeners.get(event) ?? [];

      listener.push(closure);

      return this;
   }

   emit(event: string, ...args: unknown[]) {
      const listener = this.listeners.get(event);

      if (!listener) {
         return false;
      }

      listener.forEach((f) => f(...args));

      return true;
   }

   listenerCount(eventName: string) {
      return this.listeners.get(eventName)?.length ?? 0;
   }

   rawListeners(eventName: string): Function[] | undefined {
      return this.listeners.get(eventName);
   }

}


export default EventEmitter;