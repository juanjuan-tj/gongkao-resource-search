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

## 免责声明

本站内容仅用于学习交流和资料索引，不用于任何商业用途。详见 [免责声明](DISCLAIMER.md)。
