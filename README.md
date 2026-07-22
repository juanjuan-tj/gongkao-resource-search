# 学习资源库

这是一个用于整理备考学习入口的静态导航页面，主要用于个人学习、资料索引和链接归档。

在线访问：部署 GitHub Pages 后，将网站链接填写在这里。

## 功能

- 按年份、科目、机构或老师名称搜索资料
- 直接跳转到对应的第三方网盘链接
- 纯静态部署，适用于 GitHub Pages

## 更新资料

将原始资料文本保持为“资料名称 + 下一行链接”的配对格式，然后在 PowerShell 执行：

```powershell
.\tools\build-resources.ps1 -InputFile '你的资料文本路径'
```

它会更新 `data/resources.json`。提交并推送到 GitHub 后，GitHub Pages 会自动更新。

## GitHub Pages 发布

1. 新建 GitHub 仓库，例如 `gongkao-resource-search`。
2. 上传本项目中的全部文件（保留目录结构）。
3. 仓库设置中打开 **Settings → Pages**，在 **Build and deployment** 选择 **Deploy from a branch**、`main` 分支、`/(root)` 目录并保存。
4. 等待一两分钟，即可在 Pages 页面看到访问地址。

## Netlify 管理后台

项目内已包含 `admin.html`、Netlify Functions 和 Netlify Blobs 数据接口。将同一仓库导入 Netlify 后，按以下步骤启用后台：

1. 在 Netlify 新建项目并连接本 GitHub 仓库；构建命令留空，发布目录填 `.`。
2. 在 **Project configuration → Environment variables** 新增 `ADMIN_EMAIL`，值为你用来登录后台的邮箱；可选新增 `PUBLIC_SITE_ORIGIN`，值为 `https://juanjuan-tj.github.io`。
3. 在 **Project configuration → Identity** 点击 **Enable Identity**，启用 **Invite only**，再邀请 `ADMIN_EMAIL` 对应的邮箱并设置密码。
4. 打开 `https://你的Netlify项目.netlify.app/admin`，使用该邮箱登录并维护资料。
5. 将 [assets/config.js](assets/config.js) 中的 `RESOURCE_API_URL` 改为 `https://你的Netlify项目.netlify.app/.netlify/functions/resources`，上传该文件到 GitHub；GitHub Pages 即会读取后台的最新资料。

不要把 Netlify token、管理员密码或任何密钥提交到 GitHub 仓库。

## 免责声明

本站内容仅用于学习交流和资料索引，不用于任何商业用途。详见 [免责声明](DISCLAIMER.md)。
