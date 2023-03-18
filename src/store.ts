import localforage, { INDEXEDDB, LOCALSTORAGE } from "localforage";

const storage = localforage.createInstance({
  name: "browser-file-storage",
  description: "file storage for your browser",
});

export default class Store<V> {
  private storage: LocalForage;
  constructor(
    value: V,
    private readonly key: string,
    private readonly options?: { driver: "indexeddb" | "localstorage" }
  ) {
    this.storage = storage;
    this.init();
  }

  init() {
    if (!this.options || this.options.driver === "indexeddb") {
      this.storage.config({ driver: INDEXEDDB });
    } else {
      this.storage.config({ driver: LOCALSTORAGE });
    }
  }

  async get() {
    const value = (await this.storage.getItem(this.key)) as V;
    return value;
  }

  set(value: V) {
    return this.storage.setItem(this.key, value);
  }
}
