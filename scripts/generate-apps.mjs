import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const appsDir = path.join(root, "apps");
const outputFile = path.join(root, "apps.json");

const accentPalette = ["#2563eb", "#1f7a5d", "#b45309", "#be123c", "#6d5bd0", "#0f766e", "#c2410c"];

const apps = [];

for (const entry of await safeReadDir(appsDir)) {
  if (entry.isDirectory()) {
    const folder = entry.name;
    const htmlPath = path.join(appsDir, folder, "index.html");
    const html = await safeReadFile(htmlPath);
    if (!html) continue;
    apps.push(appFromHtml({ id: folder, html, url: `apps/${folder}/`, fallbackTitle: folder }));
  }

  if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html") {
    const html = await safeReadFile(path.join(appsDir, entry.name));
    if (!html) continue;
    const id = entry.name.replace(/\.html$/i, "");
    apps.push(appFromHtml({ id, html, url: `apps/${entry.name}`, fallbackTitle: id }));
  }
}

apps.sort((a, b) => {
  if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
  return a.title.localeCompare(b.title, "zh-Hans");
});

await writeFile(outputFile, `${JSON.stringify(apps, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputFile)} with ${apps.length} app(s).`);

async function safeReadDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function safeReadFile(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function appFromHtml({ id, html, url, fallbackTitle }) {
  const title = meta(html, "learning-title") || titleTag(html) || humanize(fallbackTitle);
  const subject = meta(html, "learning-subject") || "其他";
  const age = meta(html, "learning-age") || "8岁";
  const description = meta(html, "learning-description") || "点击打开这个学习 app。";
  const accent = meta(html, "learning-accent") || colorFromText(subject || title);
  const favorite = ["true", "yes", "1"].includes(meta(html, "learning-favorite").toLowerCase());

  return {
    id,
    title,
    subject,
    age,
    description,
    url,
    accent,
    favorite,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

function meta(html, name) {
  const escaped = escapeRegExp(name);
  const patterns = [
    new RegExp(`<meta\\s+[^>]*name=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1].trim());
  }

  return "";
}

function titleTag(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].trim()) : "";
}

function humanize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function colorFromText(value) {
  let hash = 0;
  for (const char of String(value)) hash = (hash + char.charCodeAt(0)) % accentPalette.length;
  return accentPalette[hash];
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
