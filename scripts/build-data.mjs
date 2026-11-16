/**
 * 从同江实验室 catalog.json 生成站点数据。
 * 运行：node scripts/build-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = '/Users/fuheng/资料/高中Html交互模型/同江实验室/tongjiang-lab-lessons-2026-10-28';
const catalog = JSON.parse(readFileSync(join(SRC, 'catalog.json'), 'utf8'));

/* ---------- 科目 ---------- */
const SUBJECTS = {
  物理: { slug: 'wuli', order: 1 },
  化学: { slug: 'huaxue', order: 2 },
  生物: { slug: 'shengwu', order: 3 },
  地理: { slug: 'dili', order: 4 },
  历史: { slug: 'lishi', order: 5 },
  数学: { slug: 'shuxue', order: 6 }
};

/* ---------- 教材（册）---------- */
// 归一化各种写法：必修第一册 / 必修1 / 必修 1 / 必修一
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

const BOOK_RE = /(选择性必修|必修)\s*第?\s*([一二三四1-4])\s*册?/g;
const CHAP_RE = /第\s*([一二三四五六七八九十\d]+)\s*章/;

function bookFromMatch(kind, num) {
  const n = CN_NUM[num] || Number(num);
  const cn = ['一', '二', '三', '四'][n - 1];
  if (kind === '选择性必修') {
    return { key: `xxbx${n}`, label: `选择性必修${cn}册`, short: `选必${cn}`, order: 10 + n };
  }
  return { key: `bx${n}`, label: `必修第${cn}册`, short: `必修${cn}`, order: n };
}

/**
 * 教材串里可能同时提到多册（如“必修第二册 第六章 · 选择性必修1 第四章”）。
 * 规则：以第一个“第X章”为准，往前找最近的那一册配对——那才是这门课的主教材。
 */
function parseBookAndChapter(text) {
  const books = [];
  BOOK_RE.lastIndex = 0;
  let bm;
  while ((bm = BOOK_RE.exec(text))) {
    books.push({ index: bm.index, ...bookFromMatch(bm[1], bm[2]) });
  }
  const cm = text.match(CHAP_RE);
  let chap = { num: null, key: 'ch0', label: '未分章', order: 99 };
  if (cm) {
    const n = toNumber(cm[1]);
    if (n) chap = { num: n, key: `ch${n}`, label: `第${n}章`, order: n };
  }

  let book = null;
  if (cm) {
    // 第一个章之前的最近一册
    const before = books.filter(b => b.index < cm.index);
    book = before.length ? before[before.length - 1] : (books[0] || null);
  } else {
    book = books[0] || null;
  }
  if (!book) book = { key: 'other', label: '其他', short: '其他', order: 99 };
  return { book, chap };
}

function toNumber(s) {
  if (/^\d+$/.test(s)) return Number(s);
  if (s === '十') return 10;
  if (s.length === 1) return CN_NUM[s] || 0;
  if (s.startsWith('十')) return 10 + (CN_NUM[s[1]] || 0);
  if (s.endsWith('十')) return (CN_NUM[s[0]] || 0) * 10;
  if (s.includes('十')) {
    const [a, b] = s.split('十');
    return (CN_NUM[a] || 1) * 10 + (CN_NUM[b] || 0);
  }
  return 0;
}

function parseChapter(text) {
  const cm = text.match(CHAP_RE);
  if (!cm) return { num: null, key: 'ch0', label: '未分章', order: 99 };
  const n = toNumber(cm[1]);
  if (!n) return { num: null, key: 'ch0', label: '未分章', order: 99 };
  return { num: n, key: `ch${n}`, label: `第${n}章`, order: n };
}

function parseSection(text) {
  const m = text.match(/第\s*([一二三四五六七八九十\d]+)\s*节/);
  if (!m) return null;
  if (/^\d+$/.test(m[1])) return Number(m[1]);
  return CN_NUM[m[1]] || null;
}

// 从教材串里取第一个书名号内容，当作小节标题
function parseSectionTitle(text) {
  const m = text.match(/「([^」]{2,20})」/);
  return m ? m[1] : null;
}

/* ---------- 组装 ---------- */
const lessons = catalog.lessons.map((l, i) => {
  const subj = SUBJECTS[l.subject] || { slug: 'other', order: 9 };
  const { book, chap } = parseBookAndChapter(l.textbook);
  return {
    slug: l.slug,
    title: l.title,
    subject: l.subject,
    subjectSlug: subj.slug,
    subjectOrder: subj.order,
    bookKey: book.key,
    bookLabel: book.label,
    bookShort: book.short,
    bookOrder: book.order,
    chapterNum: chap.num,
    chapterKey: chap.key,
    chapterLabel: chap.label,
    chapterOrder: chap.order,
    section: parseSection(l.textbook),
    sectionTitle: parseSectionTitle(l.textbook),
    type: l.type || '',
    mainline: l.mainline || '',
    textbook: l.textbook,
    steps: l.steps || 0,
    quiz: l.quiz || 0,
    bytes: l.bytes || 0,
    online: l.online || '',
    file: l.file
  };
});

// 排序：科目 → 册 → 章 → 节
lessons.sort((a, b) =>
  a.subjectOrder - b.subjectOrder ||
  a.bookOrder - b.bookOrder ||
  a.chapterOrder - b.chapterOrder ||
  (a.section || 99) - (b.section || 99)
);

/* ---------- 复制课件到 public/models ---------- */
const outModels = join(ROOT, 'public/models');
mkdirSync(outModels, { recursive: true });
let copied = 0;
for (const l of lessons) {
  const from = join(SRC, l.file);
  if (existsSync(from)) {
    copyFileSync(from, join(outModels, `${l.slug}.html`));
    copied++;
  } else {
    console.warn('缺失文件:', l.file);
  }
}

/* ---------- 手动追加的课件 ---------- */
// 不在上游 catalog 里、由本站自行维护的课件放在 extra-lessons.json，
// 每次重新生成数据时合并进来，避免被脚本覆盖掉。
// 对应的 HTML 文件需自行放进 public/models/。
const EXTRA_PATH = join(ROOT, 'src/data/extra-lessons.json');
if (existsSync(EXTRA_PATH)) {
  const extra = JSON.parse(readFileSync(EXTRA_PATH, 'utf8'));
  lessons.push(...extra);
  lessons.sort((a, b) =>
    a.subjectOrder - b.subjectOrder ||
    a.bookOrder - b.bookOrder ||
    a.chapterOrder - b.chapterOrder ||
    (a.section || 99) - (b.section || 99)
  );
  console.log(`合并额外课件 ${extra.length} 门`);
}

/* ---------- 统计 ---------- */
const subjects = Object.entries(SUBJECTS).map(([name, cfg]) => {
  const list = lessons.filter(l => l.subject === name);
  const books = [...new Set(list.map(l => l.bookKey))];
  return {
    name, slug: cfg.slug, order: cfg.order,
    count: list.length,
    books: books.map(k => {
      const b = list.find(l => l.bookKey === k);
      return { key: k, label: b.bookLabel, short: b.bookShort, order: b.bookOrder, count: list.filter(l => l.bookKey === k).length };
    }).sort((x, y) => x.order - y.order)
  };
}).sort((a, b) => a.order - b.order);

/* ---------- 写出 ---------- */
const outDir = join(ROOT, 'src/data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'lessons.json'), JSON.stringify(lessons, null, 1));

const meta = {
  nameZh: catalog.nameZh,
  name: catalog.name,
  site: catalog.site,
  descriptionZh: catalog.descriptionZh,
  license: catalog.license,
  licenseUrl: catalog.licenseUrl,
  textbookEdition: catalog.textbookEdition,
  lessonCount: lessons.length,
  stepCount: catalog.stepCount,
  subjects
};
writeFileSync(join(outDir, 'site-meta.json'), JSON.stringify(meta, null, 1));

// 搜索索引（轻量）
const index = lessons.map(l => ({
  s: l.slug, t: l.title, j: l.subject, b: l.bookShort, c: l.chapterLabel,
  k: `${l.title} ${l.subject} ${l.bookLabel} ${l.chapterLabel} ${l.sectionTitle || ''} ${l.mainline}`
}));
writeFileSync(join(ROOT, 'public/search-index.json'), JSON.stringify(index));

console.log(`课程 ${lessons.length} 门，复制课件 ${copied} 个`);
console.log('科目分布:', subjects.map(s => `${s.name} ${s.count}`).join(' / '));
const bad = lessons.filter(l => !l.chapterNum || l.bookKey === 'other');
if (bad.length) {
  console.log('\n⚠ 解析存疑:');
  bad.forEach(l => console.log(' ', l.slug, '|', l.bookKey, '|', l.chapterKey, '|', l.textbook.slice(0, 50)));
}
