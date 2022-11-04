let counter = Date.now() % 1e9;
const hasDefine = Object.defineProperty && (function() {
  try {
    // Avoid IE8's broken Object.defineProperty
    return (Object.defineProperty({}, 'x', { value: 1 }) as any).x === 1;
  } catch (e) {}
})();

/**
 * WeakMap implementation
 */
export class WSet<K extends object> {
  private _: string;
  constructor() {
    this._ = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
  }
  add(key: K) {
    if (hasDefine) {
      Object.defineProperty(key, this._, {
        configurable: true,
        writable: true,
        value: true,
      });
    } else {
      (key as any)[this._] = true;
    }
  }
  has(key: K) {
    return !!(key as any)[this._];
  }
  delete(key: K) {
    if (!(key as any)[this._]) return false;
    (key as any)[this._] = undefined;
    return true;
  }
}