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
- `F`：全屏
- 平板/触屏：左下方向盘控制转向，右下油门和刹车，右上有视角、暂停、重开按钮

## GitHub Pages 部署

1. 把本目录提交到 GitHub 仓库。
2. 进入仓库 `Settings` → `Pages`。
3. `Build and deployment` 选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/pages.yml` 会自动发布。

项目没有构建步骤，`index.html`、`style.css` 和 `game.js` 放在仓库根目录即可。游戏通过 CDN 加载 Three.js。

## 车辆模型

当前版本引入了外部 `.glb` 车辆模型，并保留程序化碰撞/损坏部件作为车模加载失败时的兜底。

- 来源：https://www.kenney.nl/assets/car-kit
- 作者：Kenney
- 授权：Creative Commons Zero, CC0
- 本地许可证文件：`assets/models/kenney-car-kit/License.txt`
- 警车来源：https://poly.pizza/m/Uj7i2vlmir
- 警车作者：Kay Lousberg
- 警车授权：Creative Commons Zero v1.0 Universal, CC0 1.0
- 警车本地许可证文件：`assets/models/polypizza-kay-lousberg-police-car.LICENSE.txt`
