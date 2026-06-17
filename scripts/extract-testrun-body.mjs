import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "landing-page/_content/testrun-body.html");
const html = execSync("git show fe59e8a:landing-page/testrun.html", {
  cwd: root,
  encoding: "utf8",
});
const m = html.match(/<section id="testrun"[^>]*>([\s\S]*?)<\/section>/);
if (!m) throw new Error("testrun section not found");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, m[1].trim());
console.log("Wrote", out, m[1].length, "chars");
