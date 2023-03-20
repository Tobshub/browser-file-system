import { useEffect, useState } from "react";
import { ReactTerminal, TerminalContextProvider } from "react-terminal";
import BrowserFS from "@tobshub/browser-file-system";

const commands = (FS, updatePrompt) =>
  FS instanceof BrowserFS
    ? {
        echo: (...args) => args.join(" "),
        ls: (path) => {
          const { item } = FS.getItemAtPath(path && path.length ? path : ".");
          return item?.children.map((child) => child.name).join(" ");
        },
        cd: async (path) => {
          FS.setCurrentDir(path && path.length ? path : ".");
          updatePrompt();
        },
        mkdir: async (pathTo) => {
          try {
            const path = pathTo.split("/");
            const name = path.pop();
            if (!name) {
              throw new Error("can't make that directory");
            }
            const { item } = FS.getItemAtPath(path.join("/").length ? path.join("/") : ".");
            if (!item || item.type === "file") {
              throw new Error("can't create directory there");
            }
            item.type === "root"
              ? await item.addChildren("/", [{ name, type: "dir", children: [] }])
              : await item.addChildren([{ name, type: "dir", children: [] }]);
          } catch (e) {
            return e.message;
          }
        },
        pwd: () => FS.getCurrentPath(),
      }
    : null;

function App() {
  const [FS] = useState(new BrowserFS("browserfs-playground"));
  const [isReady, setReady] = useState(false);
  const [propmt, setPrompt] = useState("");

  const updatePrompt = () => {
    setPrompt(FS.getCurrentPath());
  };

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
            prompt={`~${propmt}$`}
            themes={{
              "terminal-froggy": {
                themeBGColor: "#262626",
                themeToolbarColor: "",
                themeColor: "#b4b4b4",
                themePromptColor: "#54683b",
              },
            }}
            showControlBar={false}
            commands={commands(FS, updatePrompt)}
          />
        ) : (
          <>Getting Ready...</>
        )}
      </TerminalContextProvider>
    </div>
  );
}

export default App;
