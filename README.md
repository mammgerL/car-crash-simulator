# 撞车模拟器

一个纯静态 2D 撞车模拟器网页游戏，可直接部署到 GitHub Pages。

## 本地运行

```bash
python3 -m http.server 5173
```

打开 `http://localhost:5173`。

## 操作

- `WASD` 或方向键：驾驶
- `Space`：刹车
- `P`：暂停
- `R`：重新开始
- `F`：全屏

## GitHub Pages 部署

1. 把本目录提交到 GitHub 仓库。
2. 进入仓库 `Settings` → `Pages`。
3. `Build and deployment` 选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/pages.yml` 会自动发布。

项目没有构建步骤，`index.html`、`style.css` 和 `game.js` 放在仓库根目录即可。
