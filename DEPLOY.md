# EdgeOne Pages 部署说明

## 一、连接仓库

1. 打开 [EdgeOne Pages 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. **新建项目** → **导入 Git 仓库**
3. 授权 GitHub，选择 `100759/gewu-lab`
4. 构建设置：

| 项 | 值 |
|---|---|
| 框架预设 | **Astro** |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 安装命令 | `npm install`（默认） |
| Node 版本 | **24**（根目录 `.nvmrc` 已指定 24.18.0，构建时自动切换） |

5. 点部署。首次构建约 1–2 分钟（要处理 49MB 课件文件）。

## 二、后续更新

推代码即自动部署：

```bash
git add -A
git commit -m "新增课件 xxx"
git push
```

EdgeOne 检测到 push 会自动重新构建。

## 三、域名

先用默认域名（形如 `gewu-lab.edgeone.app`）。
需要绑自有域名时：项目设置 → 域名管理 → 添加域名 → 按提示配置 CNAME。

## 四、注意事项

- **构建产物约 51MB**，其中课件 49MB。EdgeOne 单文件限制 25MB，最大单文件 1.2MB，没问题。
- 课件是静态 HTML，不需要任何运行时环境，纯 CDN 分发。
- 如果要开缓存，`/models/*.html` 可以设长缓存（内容不变），
  `/index.html` 和页面 HTML 建议短缓存或不缓存。

## 五、常见问题

**构建失败：Node 版本过低**

报错形如 `Node.js v22.21.1 is not supported by Astro!`。Astro 7 要求 Node **≥ 22.23.4**，
而 EdgeOne 默认给出的 22.21.1 差一点点，会直接卡在构建第一步。

仓库根目录的 `.nvmrc` 已指定 `24.18.0`，EdgeOne 构建时会自动切换；若仍然报错，
去「项目设置 → Node.js 版本」把它手动选成 24.x（24.18.0 / 24.11.0 / 24.5.0 都在预装列表里）。
改完需要重新触发一次部署。

如果你在本地也遇到这个报错，`nvm use` 后再 `npm run build` 即可。

**页面 404**
确认输出目录填的是 `dist`（不是 `./dist` 或 `build`）。

**课件打不开**
确认 `public/models/*.html` 已提交到仓库。这些文件约 49MB，如果用了 Git LFS 需要在构建环境装 LFS。
当前仓库是直接提交的原始文件，没有用 LFS。
