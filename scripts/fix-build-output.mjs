import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const serverDir = resolve(".next/server");
const appDir = resolve(serverDir, "app");
const app2Dir = resolve(serverDir, "app 2");

if (!existsSync(app2Dir)) {
  console.log("[fix-build] No 'app 2' directory — build is clean.");
  process.exit(0);
}

console.log("[fix-build] Detected 'app 2' directory — fixing build output...");

rmSync(appDir, { recursive: true, force: true });

renameSync(app2Dir, appDir);

console.log("[fix-build] Renamed 'app 2' → 'app'. Build output fixed.");
