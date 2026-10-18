# 博客日常发布

博客：<https://eigenwill.github.io/>。作者直接使用 [Pages CMS 文章集合](https://app.pagescms.org/eigenwill/eigenwill.github.io/master/collection/posts)或 [GitHub 上传入口](https://github.com/eigenwill/eigenwill.github.io/upload/master/content/posts)，登录并取得仓库写入权限后操作。

每篇文章使用一个目录，正文和图片放在一起。提交到 GitHub 后，GitHub Actions 自动构建并部署到 GitHub Pages，无需运行本地电脑或维护服务器。

## 推荐结构

```text
content/posts/
├── quantum-transport/
│   ├── index.md
│   └── images/
│       ├── diagram.png
│       └── result.png
└── arch-linux/
    ├── index.md
    └── images/
        └── desktop.png
```

正文使用相对图片路径：

```markdown
![实验结果](./images/result.png)
```

图片与正文一起备份、移动或删除。不同文章的 `images/` 中可以使用同名文件，互不覆盖。目录名建议使用小写英文字母、数字和连字符，并与 `slug` 一致。已发布文章请保持 `slug` 稳定，避免已分享链接失效；目录名与 `slug` 不同也可以，文章网址仍由 `slug` 决定。

## 上传本地文章目录

1. 从仓库下载[文章目录模板](../authoring/article-template.zip)，**先解压 ZIP**。里面有 `my-new-post/index.md` 和 `my-new-post/images/`，包含一张可直接预览的示例图。
2. 将 `my-new-post` 改成文章目录名，在 `index.md` 写正文，修改开头的标题、日期和 `slug`。将文章图片放进 `images/`，按实际文件名修改正文中的图片引用。不需要示例图时可以删除它，同时删掉对应引用。
3. 可按下方「本地预检」启动工具，使用「检查文章目录」选择刚才的文章文件夹；这些作者工具只保存在源码仓库，不随博客发布。预检只在浏览器本地读取文件，不上传、不发布；它检查常用单行信息与常见行内图片语法。引用式图片、HTML 和复杂 Markdown 的最终结果以构建为准。
4. 打开 [GitHub 上传入口](https://github.com/eigenwill/eigenwill.github.io/upload/master/content/posts)，登录有写入权限的 GitHub 账号，**将整个文章文件夹拖入上传区**。确认文件列表是 `my-post/index.md`、`my-post/images/result.png` 等，保留文章目录层级。不要上传 ZIP，也不要只把 `index.md` 上传到 `content/posts/` 根目录。
5. 填写提交说明，点击 **Commit changes** 提交到 `master`。在 [Actions](https://github.com/eigenwill/eigenwill.github.io/actions) 等待最新部署流程变绿，再刷新博客。

GitHub 网页支持拖入整个文件夹；每次最多上传 100 个文件，每个文件不超过 25 MiB。更多文件可分批上传到同一个文章目录，或使用 GitHub Desktop / Git 同步。操作依据：[GitHub 官方上传说明](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)。如果浏览器不支持文件夹拖放，可以使用 GitHub Desktop。

## 本地预检（可选）

在源码仓库目录运行：

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory authoring
```

用浏览器打开 `http://127.0.0.1:4174/`，即可检查文章目录。工具只读取你选择的本地文件，不上传文件，也不保存密码或令牌。通过本地 HTTP 服务打开是为了让浏览器能够加载检查模块，不需要将它部署到网上。使用 Pages CMS 或 GitHub 在线发布时不需要运行这个工具。

## 在线写作与插入图片

直接打开 [Pages CMS 文章集合](https://app.pagescms.org/eigenwill/eigenwill.github.io/master/collection/posts)。首次需要登录 GitHub，并将 Pages CMS App 授权到这个仓库。后台在服务端检查身份和仓库授权，知道地址不会获得写入权限。它还支持你明确邀请的协作者，请只邀请可信写作者。可以将这个地址加入浏览器书签。

新建文章时填写标题、日期、摘要、分类、标签和 `slug`。正文保存在 `content/posts/<slug>/index.md`，新文章默认为草稿。**先保存一次草稿**，建立文章目录。

插入图片时，使用编辑器的「插入图片」打开媒体选择器，进入 **当前文章目录**，建立或打开其中的 **`images/`**，再上传、选择图片。例如给 `my-new-post` 插图时，选择 `my-new-post/images/`。随后可继续编辑；准备发布时关闭「草稿」并保存。

Pages CMS 的媒体选择器不能自动切到当前文章的 `images/`。每次上传前请核对当前路径，**不要直接将本地图片拖入或粘贴到正文**，否则 CMS 可能将图片上传到文章根目录。CMS 插入的 `/content/posts/my-new-post/images/result.png` 路径会在构建时转换为正确的公开地址；本地写作仍推荐 `./images/result.png`。

图片目录不存在时，也可以先通过 GitHub 上传文章目录，或在对应 `images/` 中添加 `.gitkeep` 占位文件。Git 不保存空目录，模板已包含这个占位文件。

## 正文格式

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

![实验结果](./images/result.png)
```

| 字段 | 用法 |
| --- | --- |
| `title` | 文章列表和正文页的标题。 |
| `date` | 发布日期，建议使用带引号的 `YYYY-MM-DD`。 |
| `description` | 文章列表中的摘要。 |
| `category` | 一个分类名称，如「半导体物理」「Linux」。 |
| `tags` | 标签列表，如 `["Linux", "笔记"]`。 |
| `slug` | 文章网址标识，发布后尽量保持稳定。新建目录建议同名。 |
| `draft` | 不带引号的 `true` 为草稿，`false` 为发布。 |

正文支持常见 Markdown、代码块、表格和数学公式。没有 YAML 信息区也能构建，系统会从正文和目录名推断基本信息；需要准确稳定的标题、日期和网址时，请明确填写。日期默认取文章首次加入 Git 的时间，本地未跟踪的文件使用文件修改时间。

旧的单文件 `.md` / `.markdown` 文章仍可使用。旧 `/uploads/...` 图片链接继续有效，`public/uploads/` 保留兼容；新文章请使用自己的目录，不再将图片统一堆放在这里。

## 修改、下线与删除

- 修改：在 Pages CMS 或 GitHub 编辑对应的 `index.md`。替换图片时，进入该文章的 `images/`；请保留原目录名与 `slug`。
- 暂时下线：将 `draft` 改为 `true` 并提交。图片和正文留在仓库，公开博客会在构建后移除文章。
- 删除：删除整篇文章目录并提交，让正文和图片一并移除。只在 CMS 删除 `index.md` 可能留下图片，请另外清理其目录。

上传到相同路径会覆盖已有文件；新文章请使用独立目录。移动或重命名源目录时应连同 `images/` 一起操作，并核对 CMS 插入的绝对源路径。

## 发布没有更新时

1. 打开仓库 **Actions**，确认最新流程已成功；仍在运行时稍后刷新。
2. 如果失败，打开日志。检查 YAML、目录层级、重复 `slug`、缺失图片及文件名大小写。图片引用须指向已提交的文件，不能是电脑上的本地绝对路径。
3. 流程成功后刷新博客，必要时强制刷新；确认文章没有 `draft: true`。

## 登录和权限

博客不发布 `/admin/` 页面，也不在公开导航中提供作者入口。旧 `/admin/` 地址从部署内容中删除后返回 404；本地 `authoring/` 工具和模板也不进入发布目录。作者直接在 Pages CMS 或 GitHub 进行操作。

实际上传、编辑和删除由 GitHub 或 Pages CMS 的服务端登录和授权检查保护；Pages CMS 可以通过你授权的 GitHub App 写入仓库。移除公开入口减少了读者误入，真正的权限控制是服务端对身份和仓库授权的验证。GitHub Pages 是静态托管，不能用前端密码实现安全的管理鉴权。详见[安全说明](security.md)。

仓库是公开的，提交的草稿、图片及 Git 历史也可被其他人查看。`draft: true` 只控制博客是否展示文章，不会将仓库文件设为私密。
