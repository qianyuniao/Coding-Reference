// ui-enhance.js — Coding Reference 三维氛围增强层构建后注入器 v2
// v2 新增：行星星系运转（中心恒星+光晕、多行星轨道公转、轨道线、行星环）、渐变透视背景
// 用法：node ui-enhance.js（在 refs-cli 构建完成之后运行，幂等可重复执行）
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const CSS_OUT = path.join(DIST, 'style', 'ui-enhance.css');
const JS_OUT = path.join(DIST, 'js', 'ui-enhance.js');

const CSS = `/* ==== UI3D 增强层 v2 ==== */
html.ui3d body{background:transparent!important}
html.ui3d{min-height:100%}
#ui3d-stage{position:fixed;inset:0;z-index:-2;pointer-events:none;display:block}

/* 无 THREE 时的 CSS 兜底氛围 */
html.ui3d.no3d::before{content:"";position:fixed;inset:0;z-index:-2;pointer-events:none;
  background:
    radial-gradient(1100px 520px at 72% -8%, rgba(94,234,212,.10), transparent 60%),
    radial-gradient(900px 480px at 12% 108%, rgba(96,165,250,.12), transparent 60%),
    repeating-linear-gradient(90deg, rgba(148,163,184,.06) 0 1px, transparent 1px 72px),
    repeating-linear-gradient(0deg, rgba(148,163,184,.06) 0 1px, transparent 1px 72px);}

/* ---- 首页焦点区：光晕追随 + 呼吸光核 ---- */
.wrap-header.h1wrap{position:relative}
.hero-glow{position:absolute;inset:-30px -12px;pointer-events:none;border-radius:26px;z-index:-1;
  background:radial-gradient(320px 190px at var(--mx,50%) var(--my,45%), rgba(94,234,212,.20), rgba(37,99,235,.12) 45%, transparent 72%);
  transition:background-position .15s ease-out, opacity .4s}
.hero-core{position:absolute;left:50%;top:62%;width:150px;height:90px;transform:translate(-50%,-50%);
  background:radial-gradient(closest-side, rgba(94,234,212,.30), rgba(37,99,235,.14) 55%, transparent 75%);
  border-radius:50%;filter:blur(8px);pointer-events:none;z-index:-1;
  animation:ui3d-breathe 4.5s ease-in-out infinite}
@keyframes ui3d-breathe{
  0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(.82)}
  50%{opacity:.85;transform:translate(-50%,-50%) scale(1.18)}}

/* ---- 卡片渐入揭示 + 悬停光追 ---- */
.home-card{position:relative;opacity:0;transform:translateY(20px) scale(.98)}
.home-card.ui3d-in{opacity:1;transform:none;
  transition:opacity .7s cubic-bezier(.2,.7,.3,1), transform .7s cubic-bezier(.2,.7,.3,1),
             box-shadow .35s ease, border-color .35s ease}
.home-card.ui3d-in:hover{box-shadow:0 10px 32px rgba(2,8,23,.16)}
.home-card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  opacity:0;transition:opacity .3s;
  background:radial-gradient(240px 150px at var(--hx,50%) var(--hy,50%),
    rgba(94,234,212,.15), rgba(96,165,250,.09) 50%, transparent 76%)}
.home-card:hover::after{opacity:1}

/* ---- 顶栏收缩 + 极光描边 ---- */
.header-nav{position:relative;transition:padding .35s ease, box-shadow .35s ease}
body.ui3d-scrolled .header-nav{box-shadow:0 8px 28px rgba(2,8,23,.22)}
body.ui3d-scrolled .header-nav .max-container{padding-top:.6rem;transition:padding .35s ease}
body.ui3d-scrolled .header-nav::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;
  background:linear-gradient(90deg,transparent 5%,#22d3ee,#818cf8,#22d3ee,transparent 95%);
  background-size:200% 100%;animation:ui3d-aurora 6s linear infinite;opacity:.9}
@keyframes ui3d-aurora{to{background-position:-200% 0}}

/* ---- 动效减弱可访问性 ---- */
@media (prefers-reduced-motion: reduce){
  .home-card{opacity:1;transform:none}
  .hero-core{animation:none;opacity:.5}
  body.ui3d-scrolled .header-nav::after{animation:none}
  .hero-glow{transition:none}
}
`;

const JS = `/* ==== UI3D 增强层运行时 v2：星系运转 ==== */
(function () {
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isHome = /(^|\\s)home(\\s|$)/.test(body.className || '');

  /* ---------- 主题底色同步：渐变透视背景 + 底色上移 html ---------- */
  var dark = true, baseRGB = [15, 23, 42];
  function syncBg() {
    root.classList.remove('ui3d');
    var b = getComputedStyle(body).backgroundColor;
    root.classList.add('ui3d');
    var m = b.match(/\\d+/g);
    if (m && m.length >= 3) {
      baseRGB = [+m[0], +m[1], +m[2]];
      dark = (baseRGB[0] + baseRGB[1] + baseRGB[2]) < 384;
    }
    // 渐变透视：深色模式底部微亮（星系悬浮感），浅色模式底部微沉
    var d = dark ? 14 : -7;
    var top = 'rgb(' + baseRGB.join(',') + ')';
    var bot = 'rgb(' + baseRGB.map(function (v) { return Math.max(0, Math.min(255, v + d)); }).join(',') + ')';
    root.style.background = 'linear-gradient(180deg,' + top + ' 0%,' + bot + ' 100%)';
    applyMode();
  }

  /* ---------- 顶栏滚动收缩 ---------- */
  addEventListener('scroll', function () {
    body.classList.toggle('ui3d-scrolled', (window.pageYOffset || doc.scrollTop || 0) > 24);
  }, { passive: true });

  /* ---------- 卡片渐入揭示 ---------- */
  var cards = [].slice.call(doc.querySelectorAll('.home-card'));
  if (reduce) {
    cards.forEach(function (c) { c.classList.add('ui3d-in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ui3d-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    cards.forEach(function (c) { io.observe(c); });
  } else {
    cards.forEach(function (c) { c.classList.add('ui3d-in'); });
  }

  /* ---------- 卡片悬停光追 ---------- */
  cards.forEach(function (c) {
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--hx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      c.style.setProperty('--hy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  /* ---------- 首页焦点区：光晕追随 + 呼吸光核 ---------- */
  if (isHome) {
    var hero = doc.querySelector('.wrap-header.h1wrap');
    if (hero) {
      var glowEl = doc.createElement('div'); glowEl.className = 'hero-glow';
      var coreEl = doc.createElement('div'); coreEl.className = 'hero-core';
      hero.appendChild(glowEl); hero.appendChild(coreEl);
      addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = Math.max(-15, Math.min(115, (e.clientX - r.left) / r.width * 100));
        var y = Math.max(-25, Math.min(125, (e.clientY - r.top) / r.height * 100));
        glowEl.style.setProperty('--mx', x.toFixed(1) + '%');
        glowEl.style.setProperty('--my', y.toFixed(1) + '%');
      }, { passive: true });
    }
  }

  /* ================= Three.js 三维氛围层 v2 ================= */
  var MODES = [
    { grid: [0x25, 0x63, 0xeb], star: [0x60, 0xa5, 0xfa], link: [0x5e, 0xea, 0xd4] }, // 深空蓝
    { grid: [0x7c, 0x3a, 0xed], star: [0xa7, 0x8b, 0xfa], link: [0x22, 0xd3, 0xee] }, // 极光紫青
    { grid: [0xd9, 0x77, 0x06], star: [0xfb, 0xbf, 0x24], link: [0xfb, 0x92, 0x3c] }  // 星尘金
  ];
  var modeIdx = 0, target = 0, lastSwitch = performance.now(), lerpT = 1;
  var THREE_OK = false, renderer, scene, camera, fog;
  var grid, starMat, lineMat, group, galaxy;
  var sunCore, sunGlow, planets = [];

  function cur(k, i) { return MODES[modeIdx][k][i] + (MODES[target][k][i] - MODES[modeIdx][k][i]) * lerpT; }
  function rgb01(k) { return [cur(k, 0) / 255, cur(k, 1) / 255, cur(k, 2) / 255]; }

  function applyMode() {
    if (!THREE_OK) return;
    var g = dark ? 1 : 0.55; // 浅色模式整体降饱和
    var gc = rgb01('grid'), sc = rgb01('star'), lc = rgb01('link');
    grid.material.color.setRGB(gc[0], gc[1], gc[2]);
    starMat.color.setRGB(sc[0], sc[1], sc[2]);
    lineMat.color.setRGB(lc[0], lc[1], lc[2]);
    grid.material.opacity = dark ? 0.32 * g : 0.16;
    starMat.opacity = dark ? 0.9 : 0.55;
    lineMat.opacity = dark ? 0.28 : 0.15;
    // 恒星与光晕跟随模式主色
    if (sunCore) { sunCore.material.color.setRGB(lc[0], lc[1], lc[2]); }
    if (sunGlow) { sunGlow.material.color.setRGB(sc[0], sc[1], sc[2]); sunGlow.material.opacity = dark ? 0.85 : 0.5; }
    if (fog) {
      var f = 'rgb(' + baseRGB.join(',') + ')';
      fog.color.copy(new window.THREE.Color(f));
    }
  }

  /* ---- 光晕纹理（canvas 径向渐变 → additive sprite）---- */
  var TEX = null;
  function glowTexture() {
    if (TEX) return TEX;
    var c = doc.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.22, 'rgba(255,255,255,.55)');
    grd.addColorStop(0.55, 'rgba(255,255,255,.14)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    TEX = new window.THREE.CanvasTexture(c);
    return TEX;
  }

  /* ---- 行星星系定义 ---- */
  var PLANETS = [
    { r: 0.5,  orbit: 4.6,  tilt: 0.20,  speed: 0.22, phase: 0.4, color: 0x5eead4, glowScale: 7.5 },
    { r: 0.34, orbit: 6.9,  tilt: -0.28, speed: 0.13, phase: 2.1, color: 0x60a5fa, glowScale: 5.6, ring: true },
    { r: 0.46, orbit: 9.3,  tilt: 0.34,  speed: 0.08, phase: 4.2, color: 0xa78bfa, glowScale: 6.4 },
    { r: 0.24, orbit: 12.0, tilt: -0.12, speed: 0.05, phase: 1.3, color: 0xfbbf24, glowScale: 4.6 }
  ];

  function buildGalaxy() {
    galaxy = new window.THREE.Group();
    galaxy.position.set(0, 2.6, -7);   // 悬于网格上空、灭线方向
    galaxy.rotation.x = -0.42;          // 俯角透视：轨道面朝向观者倾斜
    scene.add(galaxy);

    var tex = glowTexture();

    // 中心恒星：发光内核 + 大光晕 sprite
    sunCore = new window.THREE.Mesh(
      new window.THREE.SphereGeometry(0.62, 24, 24),
      new window.THREE.MeshBasicMaterial({ color: 0x5eead4 })
    );
    galaxy.add(sunCore);
    sunGlow = new window.THREE.Sprite(new window.THREE.SpriteMaterial({
      map: tex, color: 0x60a5fa, transparent: true, opacity: 0.85,
      blending: window.THREE.AdditiveBlending, depthWrite: false
    }));
    sunGlow.scale.set(5.6, 5.6, 1);
    galaxy.add(sunGlow);

    // 行星 + 轨道线 + 各自光晕
    for (var i = 0; i < PLANETS.length; i++) {
      var p = PLANETS[i];
      var orbitGroup = new window.THREE.Group();
      orbitGroup.rotation.x = p.tilt;   // 轨道面倾角 → 立体层次
      galaxy.add(orbitGroup);

      // 轨道环线（渐隐虚线感）
      var seg = 128, oPos = new Float32Array(seg * 3);
      for (var s = 0; s < seg; s++) {
        var a = s / seg * Math.PI * 2;
        oPos[s * 3] = Math.cos(a) * p.orbit;
        oPos[s * 3 + 1] = 0;
        oPos[s * 3 + 2] = Math.sin(a) * p.orbit * 0.94;
      }
      var og = new window.THREE.BufferGeometry();
      og.setAttribute('position', new window.THREE.BufferAttribute(oPos, 3));
      var om = new window.THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: dark ? 0.3 : 0.18 });
      var orbitLine = new window.THREE.LineLoop(og, om);
      orbitGroup.add(orbitLine);

      // 行星本体
      var mesh = new window.THREE.Mesh(
        new window.THREE.SphereGeometry(p.r, 20, 20),
        new window.THREE.MeshBasicMaterial({ color: p.color })
      );
      orbitGroup.add(mesh);

      // 行星光晕
      var pGlow = new window.THREE.Sprite(new window.THREE.SpriteMaterial({
        map: tex, color: p.color, transparent: true, opacity: dark ? 0.8 : 0.45,
        blending: window.THREE.AdditiveBlending, depthWrite: false
      }));
      pGlow.scale.set(p.glowScale * p.r * 2, p.glowScale * p.r * 2, 1);
      orbitGroup.add(pGlow);

      // 行星环（土星式，给第二颗行星）
      var ringMesh = null;
      if (p.ring) {
        ringMesh = new window.THREE.Mesh(
          new window.THREE.RingGeometry(p.r * 1.5, p.r * 2.3, 48),
          new window.THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: dark ? 0.5 : 0.3, side: window.THREE.DoubleSide })
        );
        ringMesh.rotation.x = Math.PI / 2.4;
        orbitGroup.add(ringMesh);
      }

      planets.push({ def: p, mesh: mesh, glow: pGlow, ring: ringMesh, orbitMat: om, angle: p.phase });
    }
  }

  function updateGalaxy(t) {
    if (!galaxy) return;
    // 星系整体缓慢自转 → 立体运转感（沉稳节奏）
    galaxy.rotation.y += 0.0004;
    // 恒星脉动呼吸（舒缓）
    var pulse = 1 + 0.09 * Math.sin(t * 1.2);
    sunCore.scale.setScalar(pulse);
    sunGlow.scale.set(5.6 * pulse, 5.6 * pulse, 1);
    // 行星公转 + 光晕/行星环跟随
    for (var i = 0; i < planets.length; i++) {
      var pl = planets[i], d = pl.def;
      pl.angle = d.phase + t * d.speed;
      var x = Math.cos(pl.angle) * d.orbit;
      var z = Math.sin(pl.angle) * d.orbit * 0.94;
      pl.mesh.position.set(x, 0, z);
      pl.glow.position.set(x, 0, z);
      if (pl.ring) {
        pl.ring.position.set(x, 0, z);
        pl.ring.rotation.z = pl.angle; // 环随公转缓慢滚转
      }
    }
  }

  function initThree() {
    if (!window.THREE) { root.classList.add('no3d'); return; }
    THREE_OK = true;
    var canvas = doc.createElement('canvas'); canvas.id = 'ui3d-stage';
    body.insertBefore(canvas, body.firstChild);
    renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    scene = new window.THREE.Scene();
    fog = new window.THREE.Fog(0x0f172a, 9, 44); scene.fog = fog;
    camera = new window.THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 110);
    camera.position.set(0, 3.4, 11);

    grid = new window.THREE.GridHelper(80, 80, 0x2563eb, 0x2563eb);
    grid.material.transparent = true; grid.material.opacity = 0.32;
    grid.position.y = -2.2; scene.add(grid);

    var N = 520, pos = new Float32Array(N * 3), pts = [];
    for (var i = 0; i < N; i++) {
      var x = (Math.random() * 2 - 1) * 34, y = Math.random() * 18 - 5, z = (Math.random() * 2 - 1) * 34;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      pts.push(new window.THREE.Vector3(x, y, z));
    }
    var sg = new window.THREE.BufferGeometry();
    sg.setAttribute('position', new window.THREE.BufferAttribute(pos, 3));
    starMat = new window.THREE.PointsMaterial({ color: 0x60a5fa, size: 0.13, transparent: true, opacity: 0.9 });
    var stars = new window.THREE.Points(sg, starMat);

    var lp = [];
    for (var a = 0; a < N; a++) {
      for (var b = a + 1; b < N; b++) {
        if (pts[a].distanceTo(pts[b]) < 3.4) {
          lp.push(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]);
          if (lp.length > 1440) break;
        }
      }
      if (lp.length > 1440) break;
    }
    var lg = new window.THREE.BufferGeometry();
    lg.setAttribute('position', new window.THREE.BufferAttribute(new Float32Array(lp), 3));
    lineMat = new window.THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.28 });
    var links = new window.THREE.LineSegments(lg, lineMat);

    group = new window.THREE.Group();
    group.add(stars); group.add(links);
    scene.add(group);

    buildGalaxy();
    applyMode();

    var mx = 0, my = 0;
    addEventListener('mousemove', function (e) {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
    addEventListener('resize', function () {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });

    var t = 0, running = true;
    doc.addEventListener('visibilitychange', function () { running = !doc.hidden; if (running) tick(performance.now()); });

    function tick(now) {
      if (!running) return;
      requestAnimationFrame(tick);
      t = now * 0.001;
      if (now - lastSwitch > 40000) { lastSwitch = now; modeIdx = target; target = (target + 1) % 3; lerpT = 0; }
      if (lerpT < 1) { lerpT = Math.min(1, lerpT + 0.016); applyMode(); }
      if (!reduce) {
        grid.position.z = (t * 1.2) % 1;
        group.rotation.y += 0.0004;
        starMat.opacity = (dark ? 0.72 : 0.45) + 0.12 * Math.sin(t * 1.1);
        updateGalaxy(t);
        camera.position.x += (mx * 1.6 - camera.position.x) * 0.03;
        camera.position.y += ((3.4 - my * 0.9) - camera.position.y) * 0.03;
        camera.lookAt(0, 1.6, -4);
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  }

  (function loadThree() {
    if (window.THREE) return initThree();
    var s = doc.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = initThree;
    s.onerror = function () { root.classList.add('no3d'); };
    doc.head.appendChild(s);
  })();

  /* ---------- 主题切换联动 ---------- */
  syncBg();
  var mo = new MutationObserver(function () { syncBg(); });
  mo.observe(root, { attributes: true, attributeFilter: ['data-color-mode'] });
})();
`;

// ---- 写入资源文件 ----
fs.mkdirSync(path.dirname(CSS_OUT), { recursive: true });
fs.mkdirSync(path.dirname(JS_OUT), { recursive: true });
fs.writeFileSync(CSS_OUT, CSS);
fs.writeFileSync(JS_OUT, JS);

// ---- 注入 HTML 引用标签（幂等）----
const MARK = '<!--ui3d-->';
function inject(file, prefix) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(MARK)) {
    // 已注入过：刷新资源内容即可（标签引用同名文件，无需改动 HTML）
    return false;
  }
  const tags = `${MARK}\n<link rel="stylesheet" href="${prefix}style/ui-enhance.css">\n<script defer src="${prefix}js/ui-enhance.js"></script>`;
  html = html.replace('</head>', tags + '\n</head>');
  fs.writeFileSync(file, html);
  return true;
}

let count = 0;
const pages = [[path.join(DIST, 'index.html'), '']];
const docsDir = path.join(DIST, 'docs');
if (fs.existsSync(docsDir)) {
  for (const f of fs.readdirSync(docsDir)) {
    if (f.endsWith('.html')) pages.push([path.join(docsDir, f), '../']);
  }
}
for (const [file, prefix] of pages) {
  if (fs.existsSync(file) && inject(file, prefix)) count++;
}
console.log(`ui-enhance v2: assets written, ${count} newly injected pages (already-injected pages keep tags)`);
