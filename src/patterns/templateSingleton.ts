
class Singleton {
  private static _instance: Singleton;
  private constructor() {}
  static get instance(): Singleton {
    if (!this._instance)
      this._instance = new Singleton();
    return this._instance;
  }
}