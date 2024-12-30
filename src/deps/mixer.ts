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
		// @ts-expect-error this is not a function in all cases
		if (descriptors.valueOf.configurable) break;
		result.push(descriptors);
		proto = proto.__proto__;
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
	const ignoreOverwriteToString = Object.keys(Object.getOwnPropertyDescriptors(args[0].prototype)).includes('toString');
	function MixedClass(...constructorArgs: any[]) {
		for (const i of args) {
			const descriptors = getDescriptors(i).reverse();
			for (const j of descriptors) {
				// @ts-expect-error
				Object.assign(this, new j.constructor.value(...constructorArgs));

				for (const descriptorK in j) {
					if (descriptorK === 'constructor') continue;
					if (descriptorK in MixedClass.prototype && descriptorK !== 'toString') continue;
					const descriptor = j[descriptorK];
					if (descriptor.value) {
						if (descriptorK === 'toString' && ignoreOverwriteToString) {
							MixedClass.prototype[descriptorK] = args[0].prototype.toString;
							continue;
						}
						MixedClass.prototype[descriptorK] = descriptor.value;
						continue;
					}
					if (descriptor.get || descriptor.set) {
						Object.defineProperty(MixedClass.prototype, descriptorK, {
							get: descriptor.get,
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
