import BrowserFS from "../../dist/index";

const fs = new BrowserFS("test-browser-fs");

async function main() {
  // call init first
  await fs.init();
  // rest of fs operations...
}

main();
