// https://github.com/tannerntannern/ts-mixer
/*
 * MIT License
 *
 * Copyright (c) 2024 Tanner Nielsen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * A rigorous type alias for a class.
 */
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

export function Mixin<T, C extends TypeClass[]>(...constructors: C): C[number] & T {
	const prototypes = constructors.map(ct => ct.prototype);

	function MixedClass(...args: any[]) {
		// @ts-ignore: potentially abstract class
		for (const ct of constructors) copyProps(this, new ct(...args));
	}

	// @ts-expect-error
	MixedClass.prototype = hardMixProtos(prototypes, MixedClass);

	Object.setPrototypeOf(MixedClass, hardMixProtos(constructors, null, ['prototype']));

	return MixedClass as C[number] & T;
}

/**
 * Creates a new prototype object that is a mixture of the given prototypes.  The mixing is achieved by first
 * identifying the nearest common ancestor and using it as the prototype for a new object.  Then all properties/methods
 * downstream of this prototype (ONLY downstream) are copied into the new object.
 *
 * The resulting prototype is more performant than softMixProtos(...), as well as ES5 compatible.  However, it's not as
 * flexible as updates to the source prototypes aren't captured by the mixed result.  See softMixProtos for why you may
 * want to use that instead.
 */
export const hardMixProtos = (ingredients: any[], ct: Function | null, exclude: string[] = []): object => {
	const base = nearestCommonProto(...ingredients) ?? Object.prototype;
	const mixedProto = Object.create(base);

	// Keeps track of prototypes we've already visited to avoid copying the same properties multiple times.  We init the
	// list with the proto chain below the nearest common ancestor because we don't want any of those methods mixed in
	// when they will already be accessible via prototype access.
	const visitedProtos = protoChain(base);

	for (const prototype of ingredients) {
		const protos = protoChain(prototype);

		// Apply the prototype chain in reverse order so that old methods don't override newer ones.
		for (let i = protos.length - 1; i >= 0; i--) {
			const newProto = protos[i];

			if (visitedProtos.indexOf(newProto) === -1) {
				copyProps(mixedProto, newProto, ['constructor', ...exclude]);
				visitedProtos.push(newProto);
			}
		}
	}

	mixedProto.constructor = ct;

	return mixedProto;
};

/**
 * Utility function that works like `Object.apply`, but copies getters and setters properly as well.  Additionally gives
 * the option to exclude properties by name.
 */
export const copyProps = (dest: object, src: object, exclude: string[] = []) => {
	const props = Object.getOwnPropertyDescriptors(src);
	for (const prop of exclude) delete props[prop];
	Object.defineProperties(dest, props);
};

/**
 * Identifies the nearest ancestor common to all the given objects in their prototype chains.  For most unrelated
 * objects, this function should return Object.prototype.
 */
export const nearestCommonProto = (...objs: object[]): object | undefined => {
	if (objs.length === 0) return undefined;

	let commonProto: object | undefined = undefined;
	const protoChains = objs.map(obj => protoChain(obj));

	while (protoChains.every(protoChain => protoChain.length > 0)) {
		const protos = protoChains.map(protoChain => protoChain.pop());
		const potentialCommonProto = protos[0];

		if (protos.every(proto => proto === potentialCommonProto)) commonProto = potentialCommonProto;
		else break;
	}

	return commonProto;
};

/**
 * Returns the full chain of prototypes up until Object.prototype given a starting object.  The order of prototypes will
 * be closest to farthest in the chain.
 */
export const protoChain = (obj: object, currentChain: object[] = [obj]): object[] => {
	const proto = Object.getPrototypeOf(obj);
	if (proto === null) return currentChain;

	return protoChain(proto, [...currentChain, proto]);
};
