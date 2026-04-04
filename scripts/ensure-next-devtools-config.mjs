import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SAFE_SHORTCUT = "Alt+Shift+KeyD";
const CONFIG_PATHS = [
  path.resolve(process.cwd(), ".next", "cache", "next-devtools-config.json"),
  path.resolve(
    process.cwd(),
    ".next",
    "dev",
    "cache",
    "next-devtools-config.json",
  ),
];

async function readCurrentConfig(configPath) {
  try {
    const content = await readFile(configPath, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function main() {
  for (const configPath of CONFIG_PATHS) {
    await mkdir(path.dirname(configPath), { recursive: true });

    const currentConfig = await readCurrentConfig(configPath);
    const nextConfig = {
      ...currentConfig,
      hideShortcut: SAFE_SHORTCUT,
    };

    await writeFile(configPath, JSON.stringify(nextConfig, null, 2));
    console.log(
      `[next-devtools] hideShortcut configured as ${SAFE_SHORTCUT} in ${configPath}`,
    );
  }
}

await main();
