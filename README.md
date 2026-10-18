# Will's blog

博客：**https://eigenwill.github.io/** · 写作后台：**https://eigenwill.github.io/admin/**

延续原博客风格的个人网站：三栏文章列表、全文搜索、年份归档、文章目录、数学公式、代码复制和深色模式。内容以 Markdown 文件维护，GitHub Actions 自动构建并发布到 GitHub Pages。

## 发布一篇带图片的文章

每篇文章一个目录，正文与图片放在一起：

```text
content/posts/my-new-post/
├── index.md
└── images/
    └── result.png
```

`index.md` 中使用相对图片路径：

```markdown
---
title: "我的新文章"
date: "2026-10-18"
description: "一句话介绍文章。"
category: "随笔"
tags: ["记录"]
slug: "my-new-post"
draft: false
---

## 从这里开始

![实验结果](./images/result.png)
```

1. 在[管理入口](https://eigenwill.github.io/admin/)下载文章目录模板并解压，将 `my-new-post` 改成文章名，编辑 `index.md`，图片放进 `images/`。
2. 可先用后台的「检查文章目录」在本地预检，再打开[上传入口](https://github.com/eigenwill/eigenwill.github.io/upload/master/content/posts)。将整个文章文件夹拖入 GitHub，确认保留 `文章名/index.md` 和 `文章名/images/…`；不要上传 ZIP 或把 `index.md` 单独放到根目录。
3. 提交到 `master`，在 [Actions](https://github.com/eigenwill/eigenwill.github.io/actions) 等待部署完成，文章会自动发布。

不同文章可使用同名图片。新文章建议目录名与 `slug` 相同，发布后保持 `slug` 稳定。`draft: true` 的文章仅存入仓库，不在博客展示。旧单文件 Markdown 与 `/uploads/` 图片链接仍兼容。

## 在线编辑与图片管理

可使用 [Pages CMS](https://app.pagescms.org/eigenwill/eigenwill.github.io/master/collection/posts)。首次需登录 GitHub 并将 Pages CMS App 授权到本仓库。新建文章先填写 `slug`，保存草稿建立目录；插图时从「插入图片」进入对应文章的 `images/`，再上传并选择。媒体目录需要手动选择，请勿将本地图片直接拖入或粘贴到正文，以免图片落入公共根目录。准备发布时关闭「草稿」并保存。

GitHub 保存正文、图片并管理写入权限，GitHub Pages 托管公开页面，GitHub Actions 自动构建。关闭电脑后仍正常运行，无需额外数据库或服务器。管理入口是公开说明页，实际写入受 GitHub 登录及仓库权限保护。

详细操作、模板格式与 CMS 图片路径说明见[发布指南](docs/publishing.md)。

## 本地开发

使用 Node.js 22 或更新的兼容版本：

```sh
npm ci
npm test
npm run build
python3 -m http.server 4173 --directory dist
```

打开 `http://localhost:4173`。修改 Markdown 或界面文件后重新运行构建。

## 目录

| 路径 | 用途 |
| --- | --- |
| `content/posts/<文章名>/` | 每篇文章的 `index.md` 与 `images/` |
| `web/` | 前台页面、脚本、样式和 `/admin/` 管理入口 |
| `public/uploads/` | 旧 `/uploads/...` 图片链接兼容目录；新图片随文章归档 |
| `.pages.yml` | Pages CMS 后台字段与媒体配置 |
| `scripts/` | Markdown 构建与发布数据生成 |
| `test/` | 内容解析、草稿、公式与安全清洗的测试 |
| `.github/workflows/deploy.yml` | 提交后自动构建并直接部署到 GitHub Pages |
| `dist/` | 本地构建输出，不提交到源码分支 |

原博客两篇文章及旧文章链接已保留。旧 Hugo 版本位于备份分支 `codex/archive-before-new-blog-20261018`，迁移保留了完整提交历史。
