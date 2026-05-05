import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./lib/checks/ts-extension-loader.mjs", pathToFileURL("./"));
