# Zhongyi Learning Space

一个给孩子使用的学习 app 入口页。部署到 Vercel 后，你可以把每个 HTML 小工具放进 `apps/`，首页会用卡片方式显示，方便孩子点击使用。

## 添加新的 HTML app

每个 app 建议一个文件夹，并且里面有 `index.html`：

```text
apps/
  multiplication/
    index.html
  science-quiz/
    index.html
```

如果只是一个单独的 HTML 文件，也可以直接放进去：

```text
apps/
  spelling-game.html
```

然后运行：

```bash
npm run refresh
```

生成脚本会扫描 `apps/*/index.html`，自动更新 `apps.json`。

## 自定义标题、科目和说明

在每个 app 的 `index.html` 里面加入这些 meta：

```html
<title>乘法小练习</title>
<meta name="learning-subject" content="数学">
<meta name="learning-age" content="8岁">
<meta name="learning-description" content="快速练习乘法，适合每天 5 分钟热身。">
<meta name="learning-accent" content="#2563eb">
<meta name="learning-favorite" content="true">
```

如果没有写，系统会用文件夹名称自动生成标题。

## 本地预览

```bash
npm run refresh
npm start
```

然后打开：

```text
http://localhost:5173
```

## Vercel 部署

1. 把这个文件夹推到 GitHub。
2. 在 Vercel 新建项目，选择这个 repo。
3. Build Command 使用 `npm run build`。
4. Output Directory 使用 `.`。

以后新增或修改 `apps/` 里的 HTML app 后，提交到 GitHub，Vercel 会自动重新生成入口清单并部署。
