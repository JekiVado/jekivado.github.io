# 当前状态

- 目标：将用户提供的《知识的利息—人人都有成为百万年薪策划的机会》归档为独立静态页面，并接入 `/collection/`。
- 已确认：原 HTML 仅依赖一份 `unified.js`；正文与脚本已归档，目录链接已本地化为页内锚点。
- 范围：保留原始正文与交互；仅替换本地脚本路径及目录链接，不改写课程内容。
- 当前阶段：待发布。
- 最新验证：`node tests/collection-page.test.mjs`、`node --check knowledge-interest/assets/unified.js` 与 `git diff --check` 均通过；真实浏览器已核对 8 个模块、学习进度与第 8 节目录锚点，控制台无页面错误。
- 下一步：提交、发布至 GitHub Pages，并核对线上页面和集合入口。
