const state = {
  apps: [],
  subject: "全部",
  search: "",
  recent: readJson("learning-space-recent", []),
};

const els = {
  appCount: document.querySelector("#appCount"),
  appsGrid: document.querySelector("#appsGrid"),
  emptyState: document.querySelector("#emptyState"),
  favoritesGrid: document.querySelector("#favoritesGrid"),
  favoritesSection: document.querySelector("#favoritesSection"),
  recentGrid: document.querySelector("#recentGrid"),
  recentSection: document.querySelector("#recentSection"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  subjectChips: document.querySelector("#subjectChips"),
  clearRecentButton: document.querySelector("#clearRecentButton"),
  template: document.querySelector("#appCardTemplate"),
};

init();

async function init() {
  try {
    const response = await fetch(`/apps.json?ts=${Date.now()}`);
    if (!response.ok) throw new Error("Cannot load apps.json");
    const apps = await response.json();
    state.apps = apps.map(normalizeApp).sort(sortApps);
  } catch (error) {
    console.error(error);
    state.apps = [];
  }

  els.appCount.textContent = state.apps.length;
  renderSubjects();
  render();
  bindEvents();
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  els.clearRecentButton.addEventListener("click", () => {
    state.recent = [];
    writeJson("learning-space-recent", state.recent);
    renderRecent();
  });
}

function renderSubjects() {
  const subjects = ["全部", ...new Set(state.apps.map((app) => app.subject).filter(Boolean))];
  els.subjectChips.replaceChildren(
    ...subjects.map((subject) => {
      const button = document.createElement("button");
      button.className = "chip";
      button.type = "button";
      button.textContent = subject;
      button.setAttribute("aria-pressed", subject === state.subject ? "true" : "false");
      button.addEventListener("click", () => {
        state.subject = subject;
        renderSubjects();
        render();
      });
      return button;
    }),
  );
}

function render() {
  const filtered = state.apps.filter((app) => {
    const matchesSubject = state.subject === "全部" || app.subject === state.subject;
    const haystack = `${app.title} ${app.subject} ${app.age} ${app.description}`.toLowerCase();
    const matchesSearch = !state.search || haystack.includes(state.search);
    return matchesSubject && matchesSearch;
  });

  els.appsGrid.replaceChildren(...filtered.map(createCard));
  els.resultCount.textContent = `${filtered.length} 个结果`;
  els.emptyState.hidden = filtered.length > 0;

  const favorites = state.apps.filter((app) => app.favorite).slice(0, 6);
  els.favoritesSection.hidden = favorites.length === 0 || state.search || state.subject !== "全部";
  els.favoritesGrid.replaceChildren(...favorites.map(createCard));

  renderRecent();
}

function renderRecent() {
  const recentApps = state.recent
    .map((id) => state.apps.find((app) => app.id === id))
    .filter(Boolean)
    .slice(0, 4);

  els.recentSection.hidden = recentApps.length === 0 || state.search || state.subject !== "全部";
  els.recentGrid.replaceChildren(...recentApps.map(createCard));
}

function createCard(app) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  const link = node.querySelector(".card-link");
  const icon = node.querySelector(".app-icon");

  link.href = app.url;
  link.addEventListener("click", () => remember(app.id));
  node.style.setProperty("--accent", app.accent);
  icon.textContent = app.icon;
  node.querySelector(".subject").textContent = app.subject;
  node.querySelector(".age").textContent = app.age;
  node.querySelector(".title").textContent = app.title;
  node.querySelector(".description").textContent = app.description;
  return node;
}

function remember(id) {
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 8);
  writeJson("learning-space-recent", state.recent);
}

function normalizeApp(app) {
  return {
    id: app.id || slugify(app.title || app.url || "app"),
    title: app.title || "未命名学习 app",
    subject: app.subject || "其他",
    age: app.age || "8岁",
    description: app.description || "点击打开这个学习 app。",
    url: app.url || "#",
    accent: app.accent || colorFromText(app.subject || app.title || "app"),
    favorite: Boolean(app.favorite),
    icon: app.icon || initials(app.subject || app.title || "学"),
    updatedAt: app.updatedAt || "",
  };
}

function sortApps(a, b) {
  if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
  return a.title.localeCompare(b.title, "zh-Hans");
}

function initials(value) {
  const clean = String(value).replace(/\s+/g, "");
  return clean.slice(0, 1).toUpperCase() || "学";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function colorFromText(value) {
  const palette = ["#2563eb", "#1f7a5d", "#b45309", "#be123c", "#6d5bd0", "#0f766e", "#c2410c"];
  let hash = 0;
  for (const char of String(value)) hash = (hash + char.charCodeAt(0)) % palette.length;
  return palette[hash];
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
