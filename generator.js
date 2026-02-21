import fs from "fs";
import path from "path";

const POSTS_PATH = "./media/posts";
const STORIES_PATH = "./media/stories";
const OUTPUT_PATH = "./output";
const MAX_ITEMS = 30;
const GROUP_THRESHOLD_MS = 5000;

// 🔥 프로필 이미지 경로 (직접 넣어라)
const PROFILE_IMAGE = "./profile.jpg"; 

function getAllImages(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllImages(filePath));
    } else {
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        results.push(filePath);
      }
    }
  });

  return results;
}

function extractTimestamp(filePath) {
  const name = path.basename(filePath);
  const match = name.match(/^(\d+)/);
  if (!match) return null;
  return parseInt(match[1]);
}

function groupByTimestamp(files) {
  const sorted = files
    .map(f => ({
      path: f,
      ts: extractTimestamp(f)
    }))
    .filter(f => f.ts)
    .sort((a, b) => b.ts - a.ts);

  const groups = [];

  sorted.forEach(file => {
    let placed = false;

    for (let group of groups) {
      if (Math.abs(group[0].ts - file.ts) <= GROUP_THRESHOLD_MS) {
        group.push(file);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([file]);
    }
  });

  return groups.slice(0, MAX_ITEMS);
}

function renderGroupHTML(groups) {
  let html = "";

  groups.forEach(group => {
    const randomClass = `rand-${Math.floor(Math.random()*3)}`;

    if (group.length === 1) {
      html += `<img class="${randomClass}" src="../${group[0].path}" loading="lazy"/>`;
    } else {
      html += `<div class="series ${randomClass}">`;
      group.forEach(img => {
        html += `<img src="../${img.path}" loading="lazy"/>`;
      });
      html += `</div>`;
    }
  });

  return html;
}

function generateHTML(postGroups, storyGroups) {
  if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH);
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>DOUI CAMERA</title>
<style>

body {
  font-family: Helvetica, Arial, sans-serif;
  background: #0b0b0b;
  color: white;
  margin: 0;
}

/* 🔥 HERO HEADER */

.hero {
  display: flex;
  align-items: center;
  gap: 60px;
  padding: 100px 120px 60px;
}

.hero img {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
}

.hero-text h1 {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 4px;
  margin: 0 0 20px 0;
}

.stats {
  font-size: 12px;
  letter-spacing: 3px;
  opacity: 0.6;
  margin-bottom: 30px;
}

.bio {
  font-size: 16px;
  line-height: 1.6;
  font-weight: 300;
}

/* 🔥 TABS */

.tabs {
  display: flex;
  gap: 60px;
  padding: 0 120px 50px;
  font-size: 11px;
  letter-spacing: 4px;
}

.tab {
  cursor: pointer;
  opacity: 0.35;
  transition: 0.4s;
}

.tab.active {
  opacity: 1;
}

/* 🔥 MASONRY GRID */

.grid {
  display: none;
  column-count: 3;
  column-gap: 60px;
  padding: 0 120px 150px;
}

.grid.active {
  display: block;
}

.grid img {
  width: 100%;
  margin-bottom: 60px;
  transform: scale(0.95);
  opacity: 0.85;
  transition: transform 0.6s ease, opacity 0.6s ease;
  break-inside: avoid;
  cursor: pointer;
}

.grid img:hover {
  transform: scale(1.12);
  opacity: 1;
}

.series img {
  margin-bottom: 20px;
}

.rand-0 { margin-top: 0px; }
.rand-1 { margin-top: 60px; }
.rand-2 { margin-top: 120px; }

@media (max-width: 1200px) {
  .grid { column-count: 2; }
}

@media (max-width: 700px) {
  .grid { column-count: 1; }
  .hero { flex-direction: column; align-items: flex-start; padding: 60px 40px; }
  .tabs { padding: 0 40px 40px; }
  .grid { padding: 0 40px 100px; }
}

</style>
</head>
<body>

<div class="hero">
  <img src="../profile.jpg" />
  <div class="hero-text">
    <h1>RHEE DOUI</h1>
    <div class="stats">20 POSTS · 217 FOLLOWERS · 153 FOLLOWING</div>
    <div class="bio">
      This is Only Archiving.<br>
      This is not my Portfolio.
    </div>
  </div>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('posts', this)">POSTS</div>
  <div class="tab" onclick="showTab('stories', this)">STORIES</div>
</div>

<div id="posts" class="grid active">
${renderGroupHTML(postGroups)}
</div>

<div id="stories" class="grid">
${renderGroupHTML(storyGroups)}
</div>

<script>
function showTab(id, el) {
  document.querySelectorAll('.grid').forEach(g => g.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
}
</script>

</body>
</html>
`;

  fs.writeFileSync(`${OUTPUT_PATH}/index.html`, html);
}

function run() {
  const postImages = getAllImages(POSTS_PATH);
  const postGroups = groupByTimestamp(postImages);

  const storyImages = getAllImages(STORIES_PATH);
  const storyGroups = groupByTimestamp(storyImages);

  generateHTML(postGroups, storyGroups);
}

run();