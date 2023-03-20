import localforage, { INDEXEDDB, LOCALSTORAGE } from "localforage";

/** Instance of LocalForage */
const storage = localforage.createInstance({
  name: "browser-file-storage",
  description: "file storage for your browser",
});

/**
* Wrapper for LocalForage
*
* It is initialized with a single key (that should be unique across all instances). 
*
* Each instance can only interact with the data saved under the initial key.
*
* Exposes `get` and `set` methods for the data under the key.
 */
export default class Store<V> {
  private storage: LocalForage;
  constructor(
    private readonly key: string,
    private readonly options?: { driver: "indexeddb" | "localstorage" }
  ) {
    this.storage = storage;
    this.init();
  }

  private init() {
    if (!this.options || this.options.driver === "indexeddb") {
      this.storage.config({ driver: INDEXEDDB });
    } else {
      this.storage.config({ driver: LOCALSTORAGE });
    }
  }

  get() {
    return this.storage.getItem(this.key) as Promise<V>
  }

  set(value: V) {
    return this.storage.setItem(this.key, value);
  }
}
