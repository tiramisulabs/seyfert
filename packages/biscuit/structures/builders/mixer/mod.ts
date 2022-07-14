// deno-lint-ignore-file ban-types

export function mix(...constructors: Function[]) {
    return function (derivedCtor: Function) {
        constructors.forEach((baseCtor) => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
                if (!(name in derivedCtor.prototype)) {
                    // overwrite
                    Object.defineProperty(
                        derivedCtor.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
                    );
                }
            });
        });
    };
}