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
import { BrowserFS } from "@tobshub/browser-file-system";

const fs = new BrowserFS("browser-fs-key");
```

Creating a new instance of Browser File System creates and saves a `BrowserFSDir` object in the localStorage (by default).

If an instance of Browser File System has been saved with the key you provide, it will load that instance instead of creating a new one.

If you want to make the storage more temporary, you can use sessionStorage instead by passing the `sessionStorage` object into the constructor as the second parameter.

```js
import { BrowserFS } from "@tobshub/browser-file-system";

const fs = new BrowserFS("browser-fs-key", sessionStorage);
```

The Browser File System instance exposes several methods and properties that can be used to simulate a file system-like experience.
