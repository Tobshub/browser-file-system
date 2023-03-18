# Browser File System - in-browser file system

## Overview

Browser File System is a simple file-system like storage for the browser. That's it.

## Installation

```bash
  npm install @tobshub/browser-file-system
```

OR

```bash
 yarn add @tobshub/browser-file-system
```

## Usage

Create a new instance of Browser File System.

The instance requireds a key which should be unique across all created instances

```js
import BrowserFS from "@tobshub/browser-file-system";

const fs = new BrowserFS("browser-fs-key");
```

Creating a new instance of Browser File System creates and saves a `LeanBrowserFS` object in the IndexedDB (by default).

If an instance of Browser File System has been saved with the key you provide, it will load that instance instead of creating a new one.

If you want to limit the storage of BrowserFS or simply prefer to use localStorage, you can do so in the constructor:

```js
const fs = new BrowserFS("localStorage-browser-fs-key", "localstorage");
```

After creating the instance of `BrowserFS`, it is important to call the asynchronous init method on instance:

```js
await fs.init();
```

The `init` method loads previously saved data into the instance. Thus, it is neccessary to call this when you file system requires persistence.

Methods that make changes to the file system internally call the `save` method on the root instance which saves the file system to the storage option, so you do not need to do this yourself.

The Browser File System instance exposes several methods and properties that can be used to simulate a file system-like experience.
