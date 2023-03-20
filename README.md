# Browser File System - in-browser file system

## Overview

Browser File System is a simple file-system like storage for the browser. That's it.

A demo built with [react-terminal](https://www.npmjs.com/package/react-terminal) as a 'terminal' interface is live [here](https://codesandbox.io/p/github/Tobshub/browser-file-system/main?file=%2Fplay%2Fsrc%2FApp.jsx&workspace=%257B%2522activeFileId%2522%253A%2522clfh5e3s4000ag3hjff1g9sa8%2522%252C%2522openFiles%2522%253A%255B%2522%252FREADME.md%2522%252C%2522%252Fplay%252Fsrc%252FApp.jsx%2522%255D%252C%2522sidebarPanel%2522%253A%2522EXPLORER%2522%252C%2522gitSidebarPanel%2522%253A%2522COMMIT%2522%252C%2522spaces%2522%253A%257B%2522clfh63kw900sa2v6jgq3edrlp%2522%253A%257B%2522devtools%2522%253A%255B%255D%252C%2522key%2522%253A%2522clfh63kw900sa2v6jgq3edrlp%2522%252C%2522name%2522%253A%2522cd%2520play%2520%2526%2526%2520yarn%2520%2526%2526%2520yarn%2520dev%2522%257D%257D%252C%2522currentSpace%2522%253A%2522clfh63kw900sa2v6jgq3edrlp%2522%252C%2522spacesOrder%2522%253A%255B%2522clfh63kw900sa2v6jgq3edrlp%2522%255D%252C%2522hideCodeEditor%2522%253Afalse%257D). Run the `cd play && yarn && yarn dev` task or do that yourself in the terminal, and launch the preview.

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

Although this is not recommended.

After creating the instance of `BrowserFS`, it is important to call the asynchronous init method on instance:

```js
await fs.init();
```

The `init` method loads previously saved data into the instance. Thus, it is neccessary to call this when you file system requires persistence.

Methods that make changes to the file system internally call the `save` method on the root instance which saves the file system to the storage option, so you do not need to do this yourself.

The Browser File System instance exposes several methods and properties that can be used to simulate a file system-like experience.
