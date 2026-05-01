# 撞车模拟器

一个纯静态 3D 撞车模拟器网页游戏，可直接部署到 GitHub Pages。车辆会在撞击后逐步变形、掉件、碎灯、冒烟，并可切换车内视角观察损坏。

## 本地运行

```bash
python3 -m http.server 5173
```

打开 `http://localhost:5173`。

## 操作

- 开始界面：选择 `运动轿车`、`SUV`、`皮卡` 或 `警用车`
- `WASD` 或方向键：驾驶
- `Space`：刹车
- `C` 或 `V`：切换追车视角 / 车内视角
- `P`：暂停
- `R`：重新开始
- `M`：声音开关（静音/取消静音）
- `F`：全屏
- 平板/触屏：左下方向盘控制转向，右下油门和刹车，右上有视角、暂停、重开按钮

## GitHub Pages 部署

1. 把本目录提交到 GitHub 仓库。
2. 进入仓库 `Settings` → `Pages`。
3. `Build and deployment` 选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/pages.yml` 会自动发布。

项目没有构建步骤，`index.html`、`style.css` 和 `game.js` 放在仓库根目录即可。游戏通过 CDN 加载 Three.js。

## 车辆模型

当前版本使用更写实的外部 `.glb` 车型，并保留程序化碰撞/损坏部件作为车模加载失败时的兜底。

- 当前启用车型来源：Poly Pizza（CC-BY 3.0）
- 本地授权与来源映射：`assets/models/poly-pizza-realistic/ATTRIBUTION.txt`
- 历史模型文件仍保留在仓库中（Kenney/旧警车），便于回退与对比
