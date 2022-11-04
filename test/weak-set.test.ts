import { WSet } from '../src/weak-set'

describe('WeakSet', () => {
    it('implements weak set props', () => {
        const map = new WSet<any>();
        const object = {};

        map.add(object);
        expect(map.has(object)).toBe(true);
        expect(Object.keys(object).length).toBe(0);
        
        map.delete(object)
        expect(map.has(object)).toBe(false);
    })
})
