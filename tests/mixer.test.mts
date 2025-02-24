// test written by claude 🩻
import { describe, expect, it } from 'vitest';
import { mix } from '../lib/deps/mixer';

describe('mix decorator', () => {
	// Helper classes for testing
	class BaseClass {
		baseProperty = 'baseValue';
		baseMethod() {
			return 'base';
		}

		toString() {
			return 'from base';
		}
	}

	class MixinOne {
		propertyOne = 1;
		methodOne() {
			return 'one';
		}

		toString() {
			return 'from one';
		}
	}

	class MixinTwo {
		propertyTwo = 'two';
		methodTwo() {
			return 'two';
		}
	}

	it('should correctly mix classes and preserve properties', () => {
		@mix(MixinOne, MixinTwo)
		class TestClass extends BaseClass {
			testProperty = 'test';
			testMethod() {
				return 'test';
			}
		}
		interface TestClass extends MixinOne, MixinTwo {}
		const instance = new TestClass();

		// Check properties
		expect(instance.baseProperty).toBe('baseValue');
		expect(instance.propertyOne).toBe(1);
		expect(instance.propertyTwo).toBe('two');
		expect(instance.testProperty).toBe('test');

		// Check methods
		expect(instance.baseMethod()).toBe('base');
		expect(instance.methodOne()).toBe('one');
		expect(instance.methodTwo()).toBe('two');
		expect(instance.testMethod()).toBe('test');
		expect(instance.toString()).toBe('from base');
	});

	it('should correctly mix classes and preserve the original class name', () => {
		@mix(MixinOne, MixinTwo)
		class TestClass extends BaseClass {
			testMethod() {
				return 'test';
			}
		}
		interface TestClass extends MixinOne, MixinTwo {}
		const instance = new TestClass();

		// Check if the class name is preserved
		expect(TestClass.name).toBe('TestClass');

		// Check if methods from all classes are available
		expect(instance.baseMethod()).toBe('base');
		expect(instance.methodOne()).toBe('one');
		expect(instance.methodTwo()).toBe('two');
		expect(instance.testMethod()).toBe('test');
	});

	it('should handle mixing with no additional mixins', () => {
		@mix()
		class TestClass extends BaseClass {
			testMethod() {
				return 'test';
			}
		}

		const instance = new TestClass();

		expect(TestClass.name).toBe('TestClass');
		expect(instance.baseMethod()).toBe('base');
		expect(instance.testMethod()).toBe('test');
	});

	it('should handle mixing with getters and setters', () => {
		class MixinWithAccessors {
			private _value = '';

			get value(): string {
				return this._value;
			}

			set value(val: string) {
				this._value = val;
			}
		}

		interface TestClass extends MixinWithAccessors {}

		@mix(MixinWithAccessors)
		class TestClass extends BaseClass {}

		const instance = new TestClass();

		instance.value = 'test';

		expect(instance.value).toBe('test');
	});

	it('should not override existing methods in the target class', () => {
		class MixinWithConflict {
			baseMethod() {
				return 'mixin';
			}
		}

		@mix(MixinWithConflict)
		class TestClass extends BaseClass {
			baseMethod() {
				return 'override';
			}
		}

		const instance = new TestClass();
		expect(instance.baseMethod()).toBe('override');
	});

	it('should handle constructor arguments', () => {
		class MixinWithConstructor {
			constructor(public name: string) {}

			getName() {
				return this.name;
			}
		}
		interface TestClass extends MixinWithConstructor {}
		@mix(MixinWithConstructor)
		class TestClass extends BaseClass {
			constructor(name: string) {
				super();
				this.name = name;
			}

			name: string;
		}

		const instance = new TestClass('test');
		expect(instance.getName()).toBe('test');
	});

	it('should handle multiple levels of inheritance', () => {
		class Level1 {
			level1() {
				return 'level1';
			}
		}

		class Level2 extends Level1 {
			level2() {
				return 'level2';
			}
		}
		interface TestClass extends Level1, Level2 {}
		@mix(Level2)
		class TestClass extends BaseClass {}

		const instance = new TestClass();

		expect(instance.level1()).toBe('level1');
		expect(instance.level2()).toBe('level2');
	});
});
