import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const enPath = path.join(root, "locales/en.json");
const ruPath = path.join(root, "locales/ru.json");
const requiredSections = [
  "languageToggle",
  "appShell",
  "nav",
  "welcome",
  "tour",
  "common",
  "intake",
  "riskReport",
  "readiness",
  "rules",
  "owners",
  "ownerOverrides",
  "campaigns",
  "versionDiff",
  "saveCampaign",
  "labels"
];
const forbidden = [
  /casino bonus checker/i,
  /bonus abuse detector/i,
  /exploit/i,
  /leaky bonus/i,
  /gambling promo tool/i,
  /built for gambling operators/i,
  /affiliate/i,
  /betting service/i,
  /player-facing/i,
  /казино/i,
  /букмекер/i,
  /аффилиат/i,
  /игрок/i
];

const en = readJson(enPath);
const ru = readJson(ruPath);
const enLeaves = leafMap(en);
const ruLeaves = leafMap(ru);
let failed = false;

for (const section of requiredSections) {
  if (!(section in en) || !(section in ru)) {
    console.error(`Missing required section: ${section}`);
    failed = true;
  }
}

const enKeys = Object.keys(enLeaves).sort();
const ruKeys = Object.keys(ruLeaves).sort();
const missingRu = enKeys.filter((key) => !(key in ruLeaves));
const extraRu = ruKeys.filter((key) => !(key in enLeaves));

if (missingRu.length || extraRu.length) {
  console.error("Locale key parity failed.");
  report("Missing RU keys", missingRu);
  report("Extra RU keys", extraRu);
  failed = true;
}

for (const key of enKeys) {
  const enPlaceholders = placeholders(enLeaves[key]);
  const ruPlaceholders = placeholders(ruLeaves[key]);
  if (enPlaceholders.join("\0") !== ruPlaceholders.join("\0")) {
    console.error(
      `Placeholder parity failed for ${key}: EN [${enPlaceholders.join(", ")}], RU [${ruPlaceholders.join(", ")}]`
    );
    failed = true;
  }
}

for (const [locale, leaves] of [
  ["en", enLeaves],
  ["ru", ruLeaves]
]) {
  for (const [key, value] of Object.entries(leaves)) {
    if (typeof value !== "string") {
      continue;
    }
    const hit = forbidden.find((pattern) => pattern.test(value));
    if (hit) {
      console.error(`Forbidden positioning string in ${locale}:${key}: ${hit}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`i18n check passed: ${enKeys.length} leaf keys in EN and RU.`);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Failed to parse ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

function leafMap(value, prefix = "", result = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => leafMap(item, `${prefix}.${index}`, result));
    return result;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      leafMap(child, prefix ? `${prefix}.${key}` : key, result);
    }
    return result;
  }

  result[prefix] = value;
  return result;
}

function placeholders(value) {
  if (typeof value !== "string") {
    return [];
  }

  return Array.from(value.matchAll(/\{([a-zA-Z0-9_]+)\}/g))
    .map((match) => match[1])
    .sort();
}

function report(title, keys) {
  if (!keys.length) {
    return;
  }
  console.error(`${title}:`);
  keys.slice(0, 25).forEach((key) => console.error(`  ${key}`));
  if (keys.length > 25) {
    console.error(`  ...and ${keys.length - 25} more`);
  }
}
