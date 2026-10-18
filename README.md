# Will's blog

博客：**https://eigenwill.github.io/** · 写作后台：**https://eigenwill.github.io/admin/**

延续原博客风格的个人网站：三栏文章列表、全文搜索、年份归档、文章目录、数学公式、代码复制和深色模式。内容以 Markdown 文件维护，GitHub Actions 自动构建并发布到 GitHub Pages。

## 发布一篇 Markdown 博文

1. 打开 [上传入口](https://github.com/eigenwill/eigenwill.github.io/upload/master/content/posts)，登录自己的 GitHub 账号。
2. 拖入 `.md` 文件，选择提交到 `master`，点击 **Commit changes**。
3. 在 [Actions](https://github.com/eigenwill/eigenwill.github.io/actions) 等待部署完成，博客会自动出现新文章。

普通 Markdown 文件也能上传。推荐使用后台提供的模板填写标题、发布日期和固定链接，方便长期整理。`draft: true` 的文章仅存入仓库，不会发布。

```markdown
---
title: 我的新文章
date: 2026-10-18
description: 一句话介绍文章。
category: 随笔
tags: [记录]
slug: my-new-post
draft: false
---

# 正文标题

在这里开始写作。
```

## 在线编辑与图片管理

可选使用 [Pages CMS](https://app.pagescms.org/eigenwill/eigenwill.github.io/master/collection/posts)。首次需要你登录 GitHub 并将 Pages CMS App 授权到本仓库；之后可以在网页编辑正文、管理草稿和上传图片。关闭“保存为草稿”并保存后即触发发布。

GitHub 是文章存储和权限管理后端；GitHub Pages 托管公开页面。网站无需额外数据库、服务器或在前端保存访问令牌。后台入口本身是公开的说明页面，实际写入操作均由 GitHub 登录及仓库权限保护。

详细步骤见 [发布指南](docs/publishing.md)。

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
| `content/posts/` | Markdown 博文源文件 |
| `web/` | 前台页面、脚本、样式和 `/admin/` 管理入口 |
| `public/uploads/` | 上传的图片；公开地址 `/uploads/...` |
| `.pages.yml` | Pages CMS 后台字段与媒体配置 |
| `scripts/` | Markdown 构建与发布数据生成 |
| `test/` | 内容解析、草稿、公式与安全清洗的测试 |
| `.github/workflows/deploy.yml` | 提交后自动构建并直接部署到 GitHub Pages |
| `dist/` | 本地构建输出，不提交到源码分支 |

原博客两篇文章及旧文章链接已保留。旧 Hugo 版本位于备份分支 `codex/archive-before-new-blog-20261018`，迁移保留了完整提交历史。
