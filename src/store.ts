import localforage, { INDEXEDDB, LOCALSTORAGE } from "localforage";

const storage = localforage.createInstance({
  name: "browser-file-storage",
  description: "file storage for your browser",
});

export default class Store<V> {
  private storage: LocalForage;
  constructor(value: V, private readonly key: string, options?: { driver: "indexeddb" | "localstorage" }) {
    this.storage = storage;
    this.init(value, options);
  }

  private init(value: V, options?: { driver: "indexeddb" | "localstorage" }) {
    if (!options || options.driver === "indexeddb") {
      this.storage.config({ driver: INDEXEDDB });
    } else {
      this.storage.config({ driver: LOCALSTORAGE });
    }
    this.set(value);
  }

  get() {
    return this.storage.getItem(this.key) as V;
  }

  set(value: V) {
    return this.storage.setItem(this.key, value);
  }
}
