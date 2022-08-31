const isPlainObject = (value: any) => {
    return (
      value !== null
      && typeof value === 'object'
      && typeof value.constructor === 'function'
      // eslint-disable-next-line no-prototype-builtins
      && (value.constructor.prototype.hasOwnProperty('isPrototypeOf') || Object.getPrototypeOf(value.constructor.prototype) === null)
    )
      || (value && Object.getPrototypeOf(value) === null);
};

const isObject = (o: any) => {
    return !!o && typeof o === 'object' && !Array.isArray(o);
};

export const Options = (defaults: any, ...options: any[]): any => {
    if (!options.length) {
      return defaults;
    }

    const source = options.shift();

    if (isObject(defaults) && isPlainObject(source)) {
      Object.entries(source).forEach(([key, value]) => {
        if (typeof value === 'undefined') {
          return;
        }

        if (isPlainObject(value)) {
          if (!(key in defaults)) {
            Object.assign(defaults, { [key]: {} });
          }

          Options(defaults[key], value);
        } else {
          Object.assign(defaults, { [key]: value });
        }
      });
    }

    return Options(defaults, ...options);
};
