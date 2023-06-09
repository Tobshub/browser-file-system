import Store from "./store";

interface FSNode {
  /**
   * The name of a node
   *
   * Should be unique across its direct siblings
   */
  name: string;
  /**
   * The type of a node
   *
   * Can either be a Directory or a File
   * */
  type: "dir" | "file";
  /* Directories and Files stored under the current node */
}

type LeanBrowserFSDir = FSNode & { type: "dir"; children: (LeanBrowserFSDir | LeanBrowserFSFile)[]; content?: null };
type LeanBrowserFSFile = FSNode & {
  type: "file";
  children?: null;
  content: string | undefined;
};

/** Hydrated Node with methods */
type BrowserFSNode = BrowserFSFile | BrowserFSDir;
/** Lean Node without methods */
export type LeanBrowserFSNode = LeanBrowserFSDir | LeanBrowserFSFile;
type LeanBrowserFS = Pick<BrowserFS, "name" | "type" | "children">;

/** Creates a Browser File System instance */
export default class BrowserFS {
  private pathTo: string[];
  name: string;
  type: "root";
  children: LeanBrowserFSNode[];
  private storage: Store<LeanBrowserFS>;
  constructor(private readonly key: string, storage?: "indexeddb" | "localstorage") {
    this.pathTo = [];
    this.name = "root";
    this.type = "root";
    this.children = [];
    this.storage = new Store(this.key, storage ? { driver: storage } : undefined);
  }

  /** Initialize BrowserFS or load existing data from storage */
  public async init() {
    const root = await this.storage.get();
    if (root) {
      this.children = root.children;
      return;
    }
    this.save();
  }

  /** Save the current file system in the storage */
  async save() {
    await this.storage.set({ children: this.children, name: this.name, type: this.type });
  }

  /**
   * Takes a path (relative or absolute) to an item in the file system and returns an array of the absolute path to the input
   * @returns an array containing moves to a specific directory
   */
  private normalisePath(pathTo: string) {
    const path = pathTo.split("/");
    let absolutePath = [...this.pathTo];

    if (path[0] === "") {
      absolutePath = [];
      path.shift();
    }

    for (let dir of path) {
      switch (dir) {
        case "..": {
          absolutePath.pop();
        }
        case ".":
        case "": {
          break;
        }
        default: {
          absolutePath.push(dir);
        }
      }
    }
    return absolutePath;
  }

  /** @returns the current active directory path */
  getCurrentPath() {
    return this.pathTo.join("/");
  }

  /**
   * Takes a path to an item in the file system and returns that item if it is found
   *
   * Returns null if the item isn't found
   * @param pathTo - a relative or absolute path to an item in the file system
   * @returns the item at the end of the path or null if the item is not found
   */
  getItemAtPath(pathTo?: string): { item: BrowserFSNode | BrowserFS | null; path: string[] } {
    const path = this.normalisePath(pathTo ?? ".");
    let item: LeanBrowserFSNode | LeanBrowserFS | null = this;
    for (let move of path) {
      if (!item || item.type === "file") {
        throw new Error("item doesn't exist")
      }
      const nextItem: LeanBrowserFSNode | null = item.children.find((child) => child.name === move) ?? null;
      item = nextItem;
    }
    return {
      item: item
        ? item.type === "root"
          ? this
          : item.type === "dir"
          ? new BrowserFSDir(item.name, item.children, this)
          : new BrowserFSFile(item.name, item.content, this)
        : null,
      path,
    };
  }

  /**
   * Takes a path to an item in the file system and returns that item if it is found
   *
   * Returns null if the item isn't found
   * @param pathTo - a relative or absolute path to an item in the file system
   * @returns the item at the end of the path or null if the item is not found
   */
  private getRawItemAtPath(pathTo?: string) {
    const path = this.normalisePath(pathTo ?? ".");
    let parent: LeanBrowserFSDir | LeanBrowserFS | null = null;
    let item: LeanBrowserFSNode | LeanBrowserFS | null = this;

    for (let move of path) {
      if (!item || item.type === "file") {
        throw new Error("path does not exist")
      }
      const nextItem: LeanBrowserFSNode | null = item.children.find((child) => child.name === move) ?? null;
      parent = item;
      item = nextItem;
    }
    return { item, parent, path };
  }

  /**
   * Takes a path to an directory in the file system and sets the `this.pathTo` to the absolute path of that directory
   *
   * Fails if the path points to a file or does not exist
   * @param path - the relative or absolute path to the directory in the file system
   * */
  setCurrentDir(path: string) {
    const { item, path: pathTo } = this.getItemAtPath(path);
    if (!item) {
      throw new Error("directory does not exist");
    }
    if (item.type === "file") {
      throw new Error("can't change active directory to a file");
    }
    this.pathTo = pathTo;
  }

  /**
   * Adds the children to the item at the provided path
   *
   * Throws an error if the item at the path does not exist or is a file
   *
   * @param path - a relative or absolute path to a directory in the file system
   * @param children - an array of children to add to the item at the specified path
   */
  async addChildren(path: string, children: (LeanBrowserFSDir | LeanBrowserFSFile)[]) {
    const { item } = this.getItemAtPath(path);
    if (!item) {
      throw new Error("folder does not exist");
    }
    if (item.type === "file") {
      throw new Error("can't add children file");
    }
    for (let newChild of children) {
      if (item.children.find((child) => child.name === newChild.name)) {
        throw new Error("item already exists");
      }
      item.children.push(newChild);
    }
    await this.save();
  }

  /**
   * Removes an item from the file system
   *
   * Throws an error if the item's parent does not exist
   *
   * @param pathTo - a relative or absolute path to an item in the file system
   */
  async removeItem(pathTo: string) {
    const { item, parent, path } = this.getRawItemAtPath(pathTo);
    // parent should be non nullable so user can't remove the root
    if (!item || !parent) {
      throw new Error("item does not exist");
    }
    // make sure item is not a parent of or the current active directory
    if (this.getCurrentPath().startsWith(path.join("/"))) {
      throw new Error("can't remove that directory");
    }
    parent.children = parent.children.filter((child) => child.name !== item.name);
    await this.save();
  }

  /**
   * Renames item at the given path
   *
   * Throws an error if the item is a direct or indirect parent of the current path
   * Throws an error if the item is the root node or the BrowserFS instance
   *
   * @param {String} pathTo the path the item to rename
   * @param {String} newName the new name to give the item
   * */
  async renameItem(pathTo: string, newName: string) {
    // make sure the item is not a parent of or is not the current active directory
    if (this.getCurrentPath().startsWith(this.normalisePath(pathTo).join("/"))) {
      throw new Error("cannot rename that item");
    }
    const { parent, item } = this.getRawItemAtPath(pathTo);
    if (!item) {
      throw new Error("item does not exist");
    }
    if (item.type === "root") {
      throw new Error("can't rename root");
    }
    if (parent && parent.children.find((child) => child.name === newName)) {
      throw new Error("item already exists");
    }
    item.name = newName;
    await this.save();
  }
  /**
   * Move an item at `pathTo` to `newParentPath`
   *
   * Copies the item and leaves the original by default
   *
   * The name of the item stays the same unless `newName` is provided
   * @param {String} pathTo the path to the the item
   * @param {String} newParentPath the parent path of the new location
   * @param {Object} options (optional) options to change the type of move, e.g. full move/copy
   * */
  async moveItem(pathTo: string, newParentPath: string, options?: { moveType?: "move" | "copy" }) {
    // make sure the item is not a parent of or is not the current active directory
    if (this.getCurrentPath().startsWith(this.normalisePath(pathTo).join("/"))) {
      throw new Error("cannot move that item");
    }
    const { item, parent: oldParent } = this.getRawItemAtPath(pathTo);
    if (!item || !oldParent) {
      throw new Error("item not found");
    }
    if (item.type === "root") {
      throw new Error("can't move the root directory");
    }
    const { item: newItem, parent: newParent, path: newPath } = this.getRawItemAtPath(newParentPath);
    if (!newParent && newItem?.type !== "root") {
      throw new Error("can't move item to specified path");
    }

    if (!newItem && newParent) {
      const name = newPath.pop();
      const parent = new BrowserFSDir(newParent.name, newParent.children, this);
      await parent.addChildren([{ ...item, name: name as string }]);
    } else if (newItem) {
      if (newItem.type === "file") {
        throw new Error("item already exists at that path.");
      }
      const newItemParent = new BrowserFSDir(newItem.name, newItem.children, this);
      await newItemParent.addChildren([{...item}])
    } else {
      throw new Error('Error: unknown');
    }

    // if moveType option is move, do a full move and delete the original item
    if (options && options.moveType === "move") {
      await this.removeItem(pathTo)
    }

    await this.save();
  }
}

/**
 * A node, in the BrowserFS instance, that can have children
 */
class BrowserFSDir implements LeanBrowserFSDir {
  type: "dir";
  children: LeanBrowserFSNode[];
  constructor(public name: string, children: (LeanBrowserFSDir | LeanBrowserFSFile)[], private root: BrowserFS) {
    this.type = "dir";
    this.children = children;
  }

  /**
   * Adds the children to the item at the provided path
   *
   * Throws an error if the item at the path does not exist or is a file
   *
   * @param path - a relative or absolute path to a directory in the file system
   * @param children - an array of children to add to the item at the specified path
   */
  async addChildren(children: (LeanBrowserFSDir | LeanBrowserFSFile)[]) {
    for (let newChild of children) {
      if (this.children.find((child) => child.name === newChild.name)) {
        throw new Error("item already exists");
      }
      this.children.push(newChild);
    }
    await this.save();
  }

  /**
   * Calls the parent save function
   *
   * Stops when the root save function is called
   * */
  private async save() {
    await this.root.save();
  }
}

/**
 * A node, in the BrowserFS instance, that can have content
 */
class BrowserFSFile implements LeanBrowserFSFile {
  type: "file";
  children: null;
  constructor(public name: string, public content: string | undefined, private root: BrowserFS) {
    this.type = "file";
    this.children = null;
  }

  /**
   * Writes (or overwrites) the content on the node
   *
   * @param content set the content of the node
   * @returns the new content
   */
  async write(content: string) {
    this.content = content;
    await this.save();
    return content;
  }

  /**
   * Reads the content of the node
   *
   * @returns the content of the node
   */
  read() {
    return this.content;
  }

  /**
   * Calls the parent save function
   *
   * Stops when the root save function is called
   * */
  private async save() {
    await this.root.save();
  }
}
