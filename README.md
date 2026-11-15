# 格物 · 高中交互模型库

按「科目 → 教材 → 教学进度」三级分类的高中交互式教学模型站。打开即演示，可下载单文件离线使用。

技术栈：**Astro 7（静态构建）** + GitHub + EdgeOne Pages。

---

## 快速开始

```bash
npm install
npm run dev      # 开发预览 http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 预览构建结果
```

---

## 目录结构

```
site/
├── public/
│   ├── models/          # 54 个课件 HTML（自包含，可直接下载）
│   ├── thumbs/          # 卡片缩略图（webp，从课件截图裁切）
│   └── favicon.svg
├── scripts/
│   ├── build-data.mjs   # 从 catalog.json 生成站点数据 + 复制课件
│   ├── shoot-thumbs.sh  # 批量给课件截图
│   └── crop-thumbs.py   # 把截图裁成 3:2 缩略图
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── data/
│   │   ├── lessons.json     # 生成：全部课件元信息
│   │   └── site-meta.json   # 生成：站点统计与科目结构
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro          # 首页
│   │   ├── all.astro            # 全部课件（科目→册→章）
│   │   ├── [subject]/index.astro # 科目页
│   │   ├── m/[slug].astro       # 课件详情（iframe 演示 + 下载）
│   │   ├── search.astro         # 站内搜索
│   │   ├── submit.astro         # 投稿
│   │   └── about.astro          # 关于与授权
│   └── styles/global.css
└── astro.config.mjs
```

---

## 加一门新课

1. 把课件 HTML 放进 `public/models/<slug>.html`
2. 在 `catalog.json` 里加一条记录（或直接改 `src/data/lessons.json`）
3. 重新跑 `node scripts/build-data.mjs` 生成数据
4. 截图做缩略图：`bash scripts/shoot-thumbs.sh` → `python3 scripts/crop-thumbs.py`
5. `git push` → EdgeOne 自动构建上线

**数据解析规则**：`catalog.json` 的 `textbook` 字段形如
`必修第二册 · 第五章第三节（印刷页 p.10–13）`。
解析器以**第一个「第X章」为准，往前找最近的「册」**配对——这样能正确处理
「必修第二册 第六章 · 选择性必修1 第四章」这类跨册引用。

---

## 部署到 EdgeOne Pages

1. 把仓库推到 GitHub
2. EdgeOne Pages 控制台 → 新建项目 → 连接该仓库
3. 构建设置：
   - 框架预设：**Astro**
   - 构建命令：`npm run build`
   - 输出目录：`dist`
4. 之后每次 `git push` 自动构建部署

> 构建产物约 70 MB（其中课件 49 MB），单文件最大 1.2 MB，在 EdgeOne 单文件 25 MB 限制内。

---

## 授权

课件内容来自 [铜匠实验室（Tongjiang Lab）](https://lab.tongjiang.app)，以 **CC BY-NC 4.0** 分享，
仅限非商业教学用途，转载请署名原作者「铜匠十点睡觉」。

本站代码 MIT。课件内联打包的 [three.js](https://threejs.org) 为 MIT 协议。

**如果你要商用或大规模再分发，请先确认授权范围。**
