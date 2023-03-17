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

type BrowserNode = BrowserFile | BrowserDir;

export class BrowserFS implements Dir {
  private pathTo: string[];
  name: string;
  type: "dir";
  children: BrowserNode[];
  constructor(private readonly key: string) {
    this.pathTo = [];
    this.name = "root";
    this.type = "dir";
    this.children = [];
    this.init();
  }

  /** Initialize BrowserFS or load existing data */
  private init() {
    const existing = localStorage.getItem(this.key);
    if (existing) {
      const root = JSON.parse(existing) as Dir;
      this.children = root.children.map((child) =>
        child.type === "dir" ? new BrowserDir(child.name, child.children) : new BrowserFile(child.name, child.content)
      );
      return;
    }
    this.save();
  }

  private save() {
    if (this.key) {
      localStorage.setItem(this.key, JSON.stringify(this));
    }
  }

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

  getCurrentPath() {
    return this.pathTo.join("/");
  }

  getItemAtPath(pathTo: string) {
    const path = this.normalisePath(pathTo);
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

  setCurrentDir(pathTo: string) {
    const path = this.normalisePath(pathTo);
    this.pathTo = path;
  }

  addChildren(path: string, children: (Dir | File)[]) {
    const item = this.getItemAtPath(path);
    if (!item) {
      throw new Error("folder does not exist");
    }
    if (item.type === "file") {
      throw new Error("cannot add children file");
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
}

class BrowserDir implements Dir {
  type: "dir";
  children: BrowserNode[];
  constructor(public name: string, children: (Dir | File)[]) {
    this.type = "dir";
    this.children = children.map((child) =>
      child.type === "dir" ? new BrowserDir(child.name, child.children) : new BrowserFile(child.name, child.content)
    );
  }

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

  rename(name: string) {
    this.name = name;
    return name;
  }
}

class BrowserFile implements File {
  type: "file";
  children: null;
  constructor(public name: string, public content: string | undefined) {
    this.type = "file";
    this.children = null;
  }

  write(content: string) {
    this.content = content;
    return content;
  }

  read() {
    return this.content;
  }

  rename(name: string) {
    this.name = name;
    return name;
  }
}
