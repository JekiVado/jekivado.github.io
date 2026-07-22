# JekiVado GitHub Pages

这是一个由 GitHub Pages 发布的静态站点仓库，用于托管个人原型、复盘页和其他可直接在浏览器打开的内容。

## 访问入口

- 集合导航页：https://jekivado.github.io/collection/
- 站点根目录：https://jekivado.github.io/

`collection/` 是全部已发布内容的统一入口；访问根目录会自动跳转到该页面。

## 目录约定

- `collection/`：导航集合页及其网页图标。
- `escape01/`：可试玩的静态原型。
- `ServerAnalysis/`：云资源盘点与基础设施费用汇报；目录入口为四个主体的汇总页，`analysis/` 存放各主体明细，根目录其余 `.html` 为早期资源盘点快照。
- `DanceNewReports/`：产品报告档案页面。
- `index.html`：根目录入口页。

静态页面应使用相对路径引用同目录资源，确保其能在 `https://jekivado.github.io/<目录>/` 下直接访问。

## 新增页面

1. 在仓库根目录建立一个新的目录，并在其中放入 `index.html`（或独立的 `.html` 页面）。
2. 用本地静态服务器打开页面，确认资源路径和移动端布局正常。
3. 在 `collection/index.html` 的对应折叠模块中增加导航卡片；新增模块时，同步补齐模块摘要、数量和颜色变量。
4. 运行 `node --test tests/collection-page.test.mjs`，确认集合页仍覆盖全部入口。
5. 将变更提交并推送到 `main`；GitHub Pages 会自动构建发布。

## 本地预览

```bash
python3 -m http.server 8080 --directory .
```

然后访问 `http://localhost:8080/collection/`。

## 注意事项

GitHub Pages 托管的是公开静态内容。`collection/` 使用不收录提示来降低搜索曝光，但链接本身不是权限控制；不要提交密码、密钥、个人数据或其他敏感内容。
