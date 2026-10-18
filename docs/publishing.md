# 博客日常发布

博客地址：<https://eigenwill.github.io/>。文章管理入口：<https://eigenwill.github.io/admin/>。

文章保存在 GitHub 仓库的 `content/posts/` 中。每次提交后，GitHub Actions 自动构建并部署到 GitHub Pages。无需租用服务器或维护数据库。

## 上传本地 Markdown

1. 写好 UTF-8 编码的 `.md` 或 `.markdown` 文件。可以在管理入口下载模板；建议使用有意义的文件名，如 `2026-10-18-my-new-post.md`。
2. 在管理入口点击「上传 Markdown」，登录 GitHub，将文件拖入上传区。填写提交说明，点击 **Commit changes**，提交到 `master` 分支。
3. 打开管理入口的「发布状态」，等待最新一次 GitHub Actions 流程变为绿色，再刷新博客。构建和部署通常需要几分钟。

管理入口的「检查文件」只会在浏览器本地读取文件，检查常用信息，不会将文件上传到服务器，也不会自动发布。最终是否发布成功，以 GitHub Actions 的状态为准。

## 在线写作与图片

打开管理入口中的「在线写作 / 管理文章」，进入此仓库的 [Pages CMS 文章集合](https://app.pagescms.org/eigenwill/eigenwill.github.io/master/collection/posts)。

首次使用需要你自己登录 GitHub，并将 Pages CMS 的 GitHub App 安装并授权到 `eigenwill/eigenwill.github.io` 仓库。仅授权你希望它管理的仓库即可。这一步需要仓库所有者亲自完成。

进入仓库后，可以在文章集合中新建或编辑文章，填写标题、日期、摘要、分类和标签，并添加图片。新建文章默认为草稿；准备发布时，关闭「草稿」后保存。保存会将改动写入 GitHub，同样触发自动构建与部署。

图片存放在仓库的 `public/uploads/`，博客中对应 `/uploads/` 路径。例如图片文件 `public/uploads/example.png`，Markdown 写法为：

```markdown
![图片说明](/uploads/example.png)
```

直接用 GitHub 上传图片时，请放进 `public/uploads/`；上传文章时，请放进 `content/posts/`。

## 推荐的文章格式

```markdown
---
title: "我的新文章"
date: "2026-10-18"
description: "一两句话，介绍这篇文章。"
category: "学习笔记"
tags: ["笔记", "随想"]
slug: "my-new-post"
draft: false
---

## 从这里开始

文章正文。
```

| 字段 | 用法 |
| --- | --- |
| `title` | 显示在文章列表和正文页的标题。 |
| `date` | 发布日期，建议使用带引号的 `YYYY-MM-DD`。 |
| `description` | 列表页显示的摘要。 |
| `category` | 一个分类名称，如「半导体物理」「Linux」「学习笔记」。 |
| `tags` | 标签列表，如 `["Linux", "笔记"]`。 |
| `slug` | 文章地址中的标识，建议使用小写英文字母、数字和连字符。发布后尽量保持稳定。 |
| `draft` | `true` 为草稿，不出现在公开博客；`false` 为发布文章。 |

只上传没有 YAML 信息区的 Markdown 也可以。系统会用正文的第一个一级标题作为标题；没有一级标题时，使用去掉日期前缀的文件名。日期默认取文件首次加入 Git 的时间，本地未跟踪的文件才使用文件修改时间；文章标识默认由去掉日期前缀的文件名生成。需要准确稳定的日期、分类、标签、摘要和文章地址时，请使用上面的格式显式填写。

正文支持常见 Markdown 写法、代码块、表格与数学公式。请将文章内容写在第二个 `---` 之后。

## 修改、下线和删除文章

- 修改：在 Pages CMS 编辑并保存，或打开「查看文章源」，找到对应文件，在 GitHub 编辑后提交。
- 暂时下线：把文章的 `draft` 改为 `true` 并提交。草稿文件仍保留在仓库中。
- 删除：在 Pages CMS 或 GitHub 删除文章文件并提交。等待构建完成后，公开博客会移除它。

同名文件可能覆盖仓库中已有文章。上传新文章时使用独立文件名；修改旧文章时保留原文件与 `slug`，避免改变已分享的链接。

## 发布没有更新时

1. 打开仓库的 **Actions**，查看最新一次流程是否成功。如果仍在运行，请稍后刷新。
2. 如果失败，打开失败步骤的日志，检查文章 YAML 是否缺少引号、列表格式是否正确、文件是否放在 `content/posts/`。
3. 如果流程已经成功，刷新博客；必要时使用浏览器强制刷新。
4. 检查文章是否写了 `draft: true`。草稿不会被发布。

## 登录和权限

`/admin/` 是公开的管理入口。它不包含密码或访问令牌，也不能绕过仓库权限修改内容。真正的上传、编辑和删除操作在 GitHub 或通过你授权的 Pages CMS 完成，并受 GitHub 登录与仓库权限保护。

仓库是公开的，因此提交到仓库的文章草稿、图片及其 Git 历史也可以被其他人查看。`draft: true` 只控制文章是否出现在公开博客，不会将仓库中的文件设为私密。
