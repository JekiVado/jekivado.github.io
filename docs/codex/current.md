# 当前状态

- 目标：将 `/ascii-page-motion/` 的字符圆场改为 WebGL 实例化渲染，尽量复现参考站点的视觉与交互。
- 已确认：当前 Canvas 2D 版本每帧遍历 12,508 个字符，导致桌面端卡顿；参考站点使用 GPU 字符图集、环带实例与着色器。
- 范围：只改 `ascii-page-motion/` 与相应测试；不复制第三方私有源码或资源。
- 当前阶段：待发布。
- 最新验证：`node --check ascii-page-motion/app.js`、`node tests/ascii-showcase.test.mjs`、`git diff --check` 均通过；本地 WebGL2 上下文、着色器、点击波纹与 GET/RETURN 往返均已实测。
- 下一步：提交并发布到 GitHub Pages，再核对线上资源版本。
