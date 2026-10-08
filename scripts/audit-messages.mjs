// Static audit: every t("...") call must resolve in fr/ar/en message files.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const locales = ["fr", "ar", "en"];
const messages = Object.fromEntries(
  locales.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, `src/messages/${l}.json`), "utf8"))]),
);

function hasPath(obj, dotted) {
  return dotted.split(".").every((k) => {
    if (obj && typeof obj === "object" && k in obj) {
      obj = obj[k];
      return true;
    }
    return false;
  });
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(entry.name)) yield p;
  }
}

const problems = [];
for (const file of walk(path.join(ROOT, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  // namespace bindings: const t = useTranslations("ns") / getTranslations({ locale, namespace: "ns" })
  const bindings = new Map();
  const bindingRe =
    /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([a-zA-Z]+)"|\{[^}]*namespace:\s*"([a-zA-Z]+)"[^}]*\})/g;
  let m;
  while ((m = bindingRe.exec(src))) {
    bindings.set(m[1], m[2] ?? m[3]);
  }
  if (bindings.size === 0) continue;

  for (const [variable, ns] of bindings) {
    const callRe = new RegExp(`(?<![\\w.])${variable}\\(\\s*(?:["'\`]([a-zA-Z0-9_.]+)["'\`])`, "g");
    let c;
    while ((c = callRe.exec(src))) {
      const key = c[1];
      if (!key) continue; // dynamic (template with ${})
      const full = `${ns}.${key}`;
      for (const locale of locales) {
        if (!hasPath(messages[locale], full)) {
          problems.push(`${path.relative(ROOT, file)}: ${variable}("${key}") -> ${full} missing in ${locale}`);
        }
      }
    }
    // template-literal static-ish keys like t(`sortOptions.${key}`) are skipped (dynamic)
  }
}

if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("messages audit: OK");
