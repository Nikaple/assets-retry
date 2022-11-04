/**
 * WeakMap implementation
 */
export class WMap<K extends object, V> {
  private _: string;
  constructor() {
    this._ = `_WM_${Math.random().toString().substring(2)}`;
  }
  delete(key: K) {
    const entry = (key as any)[this._];
    const hasKey = entry && entry[0] === key;
    if (hasKey) {
      delete (key as any)[this._];
    }
    return hasKey;
  }
  get(key: K): V | undefined {
    const entry = (key as any)[this._];
    if (entry && entry[0] === key) {
      return entry[1];
    }
  }
  has(key: K) {
    const entry = (key as any)[this._];
    return entry && entry[0] === key;
  }
  set(key: K, value: V) {
    (key as any)[this._] = [key, value];
  }
}