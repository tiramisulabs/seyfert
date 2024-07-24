/**
 * Gets the descriptors of a class.
 * @param c The class to get the descriptors of.
 * @returns The descriptors of the class.
 */
function getDescriptors(c: TypeClass) {
	let proto = c.prototype;
	const result: Record<string, TypedPropertyDescriptor<unknown> | PropertyDescriptor>[] = [];
	while (proto) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);
		// @ts-expect-error this is not a function in all cases
		if (descriptors.valueOf.configurable) break;
		result.push(descriptors);
		proto = proto.__proto__;
	}
	return result;
}

/**
 * Mixes a class with other classes.
 * @param args The classes to mix.
 * @returns The mixed class.
 */
export function Mixin<T, C extends TypeClass[]>(...args: C): C[number] & T {
	function MixedClass(...constructorArgs: any[]) {
		for (const i of args) {
			const descriptors = getDescriptors(i);
			for (const j of descriptors) {
				// @ts-expect-error
				Object.assign(this, new j.constructor.value(...constructorArgs));

				for (const descriptorK in j) {
					if (descriptorK === 'constructor') continue;
					const descriptor = j[descriptorK];
					if (descriptor.value) {
						MixedClass.prototype[descriptorK] = descriptor.value;
						continue;
					}
					if (descriptor.get) {
						Object.defineProperty(MixedClass.prototype, descriptorK, {
							get: descriptor.get,
						});
						continue;
					}
					if (descriptor.set) {
						Object.defineProperty(MixedClass.prototype, descriptorK, {
							set: descriptor.set,
						});
					}
				}
			}
		}
	}

	return MixedClass as C[number] & T;
}

// https://github.com/tannerntannern/ts-mixer
export type TypeClass<InstanceType = {}, StaticType = {}> = (abstract new (
	...args: any[]
) => InstanceType) &
	StaticType;

export const mix =
	(...ingredients: TypeClass[]) =>
	(decoratedClass: any) => {
		const mixedClass = Mixin(...ingredients.concat([decoratedClass]));

		Object.defineProperty(mixedClass, 'name', {
			value: decoratedClass.name,
			writable: false,
		});

		return mixedClass as any;
	};
