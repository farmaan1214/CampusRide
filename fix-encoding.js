const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');

const bgCss = `
/* ===== DYNAMIC BACKGROUND ===== */
.dynamic-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: var(--bg);
}
.blob-wrapper {
  position: absolute;
  will-change: transform;
}
.blob-w-1 { top: -10%; left: -10%; }
.blob-w-2 { top: 40%; right: -15%; }
.blob-w-3 { bottom: -10%; left: 20%; }

.blob {
  filter: blur(90px);
  border-radius: 50%;
  animation: floatBg 20s ease-in-out infinite alternate;
  will-change: transform;
}
.blob-1 {
  width: 500px; height: 500px;
  background: var(--indigo-light);
  opacity: 0.35;
}
.blob-2 {
  width: 600px; height: 600px;
  background: var(--coral);
  opacity: 0.25;
  animation-delay: -7s;
}
.blob-3 {
  width: 450px; height: 450px;
  background: var(--green);
  opacity: 0.2;
  animation-delay: -14s;
}
@keyframes floatBg {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  50% { transform: translate(40px, -60px) scale(1.1) rotate(180deg); }
  100% { transform: translate(-30px, 30px) scale(0.9) rotate(360deg); }
}
`;

let cssContent = lines.slice(10, 932).join('\n').replace('background: var(--bg);', 'background: transparent;');
fs.writeFileSync('public/css/style.css', bgCss + cssContent, 'utf8');

const head = lines.slice(0, 9).join('\n');
const link = '    <link rel="stylesheet" href="/css/style.css">';
const bgHtml = `
<!-- ===== DYNAMIC BACKGROUND ===== -->
<div class="dynamic-bg">
  <div class="blob-wrapper blob-w-1"><div class="blob blob-1"></div></div>
  <div class="blob-wrapper blob-w-2"><div class="blob blob-2"></div></div>
  <div class="blob-wrapper blob-w-3"><div class="blob blob-3"></div></div>
</div>
`;
const body = bgHtml + lines.slice(933, 1417).join('\n');
const script = '    <script src="/js/script.js"></script>\n</body>\n</html>';

fs.writeFileSync('public/index.html', head + '\n' + link + '\n' + body + '\n' + script, 'utf8');

console.log('Fixed encoding and added dynamic BG!');
