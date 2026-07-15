import { readFile, writeFile } from "node:fs/promises";

const dts = "dist/index.d.ts";
const dcts = "dist/index.d.cts";
const dtsMap = "dist/index.d.ts.map";
const dctsMap = "dist/index.d.cts.map";

const types = await readFile(dts, "utf8");
await writeFile(
  dcts,
  types.replace("sourceMappingURL=index.d.ts.map", "sourceMappingURL=index.d.cts.map"),
);

try {
  const map = await readFile(dtsMap, "utf8");
  await writeFile(dctsMap, map.replace('"file":"index.d.ts"', '"file":"index.d.cts"'));
} catch {
  // Declaration maps are optional.
}
