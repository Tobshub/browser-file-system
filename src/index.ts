export {};

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

type Dir = FSNode & { type: "dir"; children: (Dir | File)[]; content?: null };
type File = FSNode & {
  type: "file";
  children?: null;
  content: string | undefined;
};

/**  */
type BrowserNode = BrowserFile | BrowserDir;

/** BrowserFS instance */
export class BrowserFS implements Dir {
  private pathTo: string[];
  name: string;
  type: "dir";
  children: BrowserNode[];
  constructor(private readonly key: string, private readonly storage: Storage = localStorage) {
    this.pathTo = [];
    this.name = "root";
    this.type = "dir";
    this.children = [];
    this.init();
  }

  /** Initialize BrowserFS or load existing data */
  private init() {
    const existing = this.storage.getItem(this.key);
    if (existing) {
      const root = JSON.parse(existing) as Dir;
      this.children = root.children.map((child) =>
        child.type === "dir" ? new BrowserDir(child.name, child.children) : new BrowserFile(child.name, child.content)
      );
      return;
    }
    this.save();
  }

  /** Save the current file system in the storage */
  private save() {
    if (this.key) {
      this.storage.setItem(this.key, JSON.stringify(this));
    }
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
   * @param pathTo - a relative or absolute path to an item in the file system
   * @returns the item at the end of the path or null if the item is not found
   */
  getItemAtPath(pathTo?: string) {
    const path = this.normalisePath(pathTo ?? ".");
    let item: BrowserFS | BrowserNode | null = this;

    for (let move of path) {
      if (!item || item.type === "file") {
        break;
      }
      const nextItem: BrowserNode | null = item.children.find((child) => child.name === move) ?? null;
      item = nextItem;
    }
    return item;
  }

  /**
   * Takes a path to an directory in the file system and sets the `this.pathTo` to the absolute path of that directory
   *
   * Fails if the path points to a file or does not exist
   * @param path - the relative or absolute path to the directory in the file system
   * */
  setCurrentDir(path: string) {
    const pathTo = this.normalisePath(path);
    const item = this.getItemAtPath(pathTo.join("/"));

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
  addChildren(path: string, children: (Dir | File)[]) {
    const item = this.getItemAtPath(path);
    if (!item) {
      throw new Error("folder does not exist");
    }
    if (item.type === "file") {
      throw new Error("can't add children file");
    }
    for (let newChild of children) {
      if (item.children.find((child) => child.name === newChild.name && child.type === newChild.type)) {
        throw new Error("item already exists");
      }
      item.children.push(
        newChild.type === "dir"
          ? new BrowserDir(newChild.name, newChild.children)
          : new BrowserFile(newChild.name, newChild.content)
      );
    }
    this.save();
  }

  /**
   * Removes an item from the file system
   *
   * Throws an error if the item's parent does not exist
   *
   * @param pathTo - a relative or absolute path to an item in the file system
   */
  removeItem(pathTo: string) {
    const path = this.normalisePath(pathTo);
    const name = path.pop();
    const parentItem = this.getItemAtPath(path.join("/"));
    if (!parentItem || parentItem.type === "file") {
      throw new Error("item does not exist");
    }
    parentItem.children = parentItem.children.filter((child) => child.name !== name);
    this.save();
  }
}

/**
 * A node, in the BrowserFS instance, that can have children
 */
class BrowserDir implements Dir {
  type: "dir";
  children: BrowserNode[];
  constructor(public name: string, children: (Dir | File)[]) {
    this.type = "dir";
    this.children = children.map((child) =>
      child.type === "dir" ? new BrowserDir(child.name, child.children) : new BrowserFile(child.name, child.content)
    );
  }

  /**
   * Adds the children to the item at the provided path
   *
   * Throws an error if the item at the path does not exist or is a file
   *
   * @param path - a relative or absolute path to a directory in the file system
   * @param children - an array of children to add to the item at the specified path
   */
  addChildren(children: (Dir | File)[]) {
    for (let newChild of children) {
      if (this.children.find((child) => child.name === newChild.name && child.type === newChild.type)) {
        throw new Error("item already exists");
      }
      this.children.push(
        newChild.type === "dir"
          ? new BrowserDir(newChild.name, newChild.children)
          : new BrowserFile(newChild.name, newChild.content)
      );
    }
  }

  /**
   * Changes the name of the node
   *
   * @param name - the new name to give to the node
   * @returns the new name of the node
   */
  rename(name: string) {
    this.name = name;
    return name;
  }
}

/**
 * A node, in the BrowserFS instance, that can have content
 */
class BrowserFile implements File {
  type: "file";
  children: null;
  constructor(public name: string, public content: string | undefined) {
    this.type = "file";
    this.children = null;
  }

  /**
   * Writes (or overwrites) the content on the node
   *
   * @param content set the content of the node
   * @returns the new content
   */
  write(content: string) {
    this.content = content;
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
   * Changes the name of the node
   *
   * @param name - the new name to give to the node
   * @returns the new name of the node
   */
  rename(name: string) {
    this.name = name;
    return name;
  }
}
