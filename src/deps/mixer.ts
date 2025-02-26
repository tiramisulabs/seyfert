const IgnoredProps = ['constructor', 'prototype', 'name'];
export function copyProperties(target: InstanceType<TypeClass>, source: TypeClass) {
	const keys = Reflect.ownKeys(source);
	for (const key of keys) {
		if (IgnoredProps.includes(key as string)) continue;
		if (key in target) continue;
		const descriptor = Object.getOwnPropertyDescriptor(source, key);
		if (descriptor) {
			Object.defineProperty(target, key, descriptor);
		}
	}
}

export function Mixin<T, C extends TypeClass[]>(...mixins: C): C[number] & T {
	const Base = mixins[0];

	class MixedClass extends Base {
		constructor(...args: any[]) {
			super(...args);
			for (const mixin of mixins.slice(1)) {
				// @ts-expect-error
				const mixinInstance = new mixin(...args);
				copyProperties(this, mixinInstance);
				let proto = Object.getPrototypeOf(mixinInstance);
				while (proto && proto !== Object.prototype) {
					copyProperties(this, proto);
					proto = Object.getPrototypeOf(proto);
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
