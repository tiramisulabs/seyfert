// test written by claude 🩻
import { describe, expect, it } from 'vitest';
import { mix } from '../src/deps/mixer';

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
