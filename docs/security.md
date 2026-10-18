# 写作入口与权限

公开博客只提供文章阅读功能，不发布 `/admin/` 或其他管理页面，不在前台导航、页脚中提供作者入口。旧 `/admin/` 地址从部署内容中删除后返回 404。

## 作者如何发布

- 在线编辑：直接打开 [Pages CMS 文章集合](https://app.pagescms.org/eigenwill/eigenwill.github.io/master/collection/posts)，登录 GitHub，并授权 Pages CMS App 访问仓库。
- 上传本地文章：使用 [GitHub 上传入口](https://github.com/eigenwill/eigenwill.github.io/upload/master/content/posts)，保留 `文章目录/index.md` 和 `文章目录/images/` 的结构。
- 模板与预检：源码仓库的 `authoring/` 保存文章模板和本地检查工具，不复制到公开网站的构建产物中。

通过 GitHub 上传、编辑和删除需要仓库写入权限。Pages CMS 同样要求登录和仓库授权，也支持由作者明确邀请的仓库级协作者；知道地址本身不会获得写入权限。Pages CMS 的协作者邀请应只授予可信的写作者，具体鉴权机制见[官方说明](https://pagescms.org/docs/development/authentication/)。

保存内容后由 GitHub Actions 构建，GitHub Pages 持续托管博客；整个流程不依赖作者电脑持续开机。每日写作操作见[发布指南](publishing.md)。

## 为什么不在博客里加一个密码

GitHub Pages 只托管静态文件，无法在服务器端验证博客自建的登录状态。放在前端 JavaScript 中的密码、令牌和判断逻辑会被访问者下载，不能作为管理权限控制。隐藏链接也不能替代鉴权。

本项目通过 GitHub 或授权的 Pages CMS 服务端校验身份和写入权限。公开网站不保存管理密码或访问令牌。移除 `/admin/` 是减少公开管理界面，实际写入保护由这些服务的鉴权提供。

## 构建和发布保护

- 构建程序只解析 YAML 元信息，不执行 JavaScript 或其他语言的元信息；正文经 HTML 清洗后发布。
- 无论作者工具是否意外放回 `web/admin/`、`public/admin/` 或同级 `authoring/`，构建都不会将这些目录复制到网站。
- 现有发布流程只允许 `master` 分支的提交或手动运行触发生产部署。Pull Request 运行测试和构建，不上传或部署生产站点；构建任务只有读取权限，部署任务只获得所需的 Pages 权限。

## 公开仓库的边界

这是公开仓库，任何人都能读取提交的正文、图片、配置和 Git 历史，包括 `draft: true` 的文章。草稿状态只控制是否在博客中展示，不提供保密性。`authoring/` 不随博客发布，但它仍是公开仓库中的源码，不用于保存秘密。

网站公开发布后，读者也可以保存或缓存页面和图片。删除文章或改成草稿，不会撤回他人已经取得的副本。
