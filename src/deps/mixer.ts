/**
 * Gets the descriptors of a class.
 * @param c The class to get the descriptors of.
 * @returns The descriptors of the class.
 */
function getDenoDescriptors(c: TypeClass) {
	const protos = [c.prototype];

	let v = c;
	while ((v = Object.getPrototypeOf(v))) {
		if (v.prototype) protos.push(v.prototype);
	}

	return protos.map(x => Object.getOwnPropertyDescriptors(x));
}

/**
 * Gets the descriptors of a class.
 * @param c The class to get the descriptors of.
 * @returns The descriptors of the class.
 */
function getNodeDescriptors(c: TypeClass) {
	let proto = c.prototype;
	const result: Record<string, TypedPropertyDescriptor<unknown> | PropertyDescriptor>[] = [];
	while (proto) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);
		result.push(descriptors);
		proto = Object.getPrototypeOf(proto);
	}
	return result;
}

function getDescriptors(c: TypeClass) {
	//@ts-expect-error
	// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
	return typeof Deno === 'undefined' ? getNodeDescriptors(c) : getDenoDescriptors(c);
}

/**
 * Mixes a class with other classes.
 * @param args The classes to mix.
 * @returns The mixed class.
 */
export function Mixin<T, C extends TypeClass[]>(...args: C): C[number] & T {
	const Base = args[0];

	class MixedClass extends Base {
		constructor(...constructorArgs: any[]) {
			super(...constructorArgs);

			for (const mixin of args.slice(1)) {
				const descriptors = getDescriptors(mixin).reverse();
				for (const desc of descriptors) {
					for (const key in desc) {
						if (key === 'constructor') continue;
						if (key in MixedClass.prototype) continue;
						const descriptor = desc[key];

						if (descriptor.value) {
							// @ts-expect-error
							MixedClass.prototype[key] = descriptor.value;
						} else if (descriptor.get || descriptor.set) {
							Object.defineProperty(MixedClass.prototype, key, {
								get: descriptor.get,
								set: descriptor.set,
							});
						}
					}
				}
			}
		}
	}

	return MixedClass as C[number] & T;
}

// https://github.com/tannerntannern/ts-mixer
export type TypeClass<InstanceType = object, StaticType = object> = (abstract new (
	...args: any[]
) => InstanceType) &
	StaticType;

export const mix =
	(...ingredients: TypeClass[]) =>
	(decoratedClass: any) => {
		ingredients.unshift(decoratedClass);
		const mixedClass = Mixin(...ingredients);
		Object.defineProperty(mixedClass, 'name', {
			value: decoratedClass.name,
			writable: false,
		});
		return mixedClass as any;
	};
