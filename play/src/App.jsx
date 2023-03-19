import { useEffect, useState } from "react";
import { ReactTerminal, TerminalContextProvider } from "react-terminal";
import BrowserFS from "../../dist/index.js";

const commands = (FS) =>
  FS instanceof BrowserFS
    ? {
        echo: (...args) => args.join(" "),
        ls: (path) => {
          const { item } = FS.getItemAtPath(path && path.length ? path : ".");
          return item?.children.map((child) => child.name).join(" ");
        },
        cd: async (path) => {
          FS.setCurrentDir(path && path.length ? path : ".");
        },
      }
    : null;

function App() {
  const [FS] = useState(new BrowserFS("terminal-froggy-fs"));
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    FS.init().then(() => {
      setReady(true);
    });
  }, []);

  return (
    <div>
      <TerminalContextProvider>
        {isReady ? (
          <ReactTerminal
            theme="terminal-froggy"
            prompt={`$`}
            themes={{
              "terminal-froggy": {
                themeBGColor: "#262626",
                themeToolbarColor: "",
                themeColor: "#b4b4b4",
                themePromptColor: "#54683b",
              },
            }}
            showControlBar={false}
            commands={commands(FS)}
          />
        ) : (
          <>Getting Ready...</>
        )}
      </TerminalContextProvider>
    </div>
  );
}

export default App;
