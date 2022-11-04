import { WMap } from '../src/weak-map'


describe('WeakMap', () => {
    it('implements weak map props', () => {
        const map = new WMap<any, number>();
        const object = {};

        map.set(object, 1);
        expect(map.get(object)).toBe(1);
        expect(map.has(object)).toBe(true);
        
        map.delete(object)
        expect(map.get(object)).toBe(undefined);
    })
})
