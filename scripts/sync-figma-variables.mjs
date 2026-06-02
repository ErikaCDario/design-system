import fs from "node:fs/promises";

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN) throw new Error("Missing FIGMA_TOKEN");
if (!FIGMA_FILE_KEY) throw new Error("Missing FIGMA_FILE_KEY");

const response = await fetch(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/variables/local`,
  {
    headers: {
      "X-Figma-Token": FIGMA_TOKEN
    }
  }
);

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Figma API error: ${response.status} ${errorText}`);
}

const data = await response.json();

const variables = data.meta?.variables ?? {};
const collections = data.meta?.variableCollections ?? {};

function figmaColorToCss(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? 1;

  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;

  return (
    "#" +
    [r, g, b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
  );
}

function normalizeValue(value) {
  if (
    value &&
    typeof value === "object" &&
    "r" in value &&
    "g" in value &&
    "b" in value
  ) {
    return figmaColorToCss(value);
  }

  return value;
}

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

function setNestedToken(target, path, token) {
  const parts = path.split("/").map(normalizeName);

  let current = target;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (i === parts.length - 1) {
      current[part] = token;
    } else {
      current[part] = current[part] ?? {};
      current = current[part];
    }
  }
}

const tokens = {};

for (const variable of Object.values(variables)) {
  const collection = collections[variable.variableCollectionId];
  if (!collection) continue;

  const modeId = collection.defaultModeId;
  const rawValue = variable.valuesByMode?.[modeId];

  if (rawValue === undefined) continue;

  setNestedToken(tokens, variable.name, {
    value: normalizeValue(rawValue),
    type: variable.resolvedType?.toLowerCase() ?? "unknown"
  });
}

await fs.mkdir("packages/tokens/src", { recursive: true });

await fs.writeFile(
  "packages/tokens/src/tokens.json",
  JSON.stringify(tokens, null, 2)
);

console.log("Figma variables synced to packages/tokens/src/tokens.json");
