# Petalog · 植物养护提醒

> 上传植物照片，AI 识别物种、评估健康并生成专属养护日程，每日提醒你浇水、施肥、修剪。

一个兼具实用与美感的植物养护助手应用，融合亲生物（Biophilic）设计风格与有机动态光影，将自然生机带入数字界面，营造平静、疗愈的使用体验。

## 📸 界面预览

**植物艺术扉页** — 晨光微曦、枝叶微风摇曳的开屏艺术动态封面，一键步入绿意盎然的花园

![植物艺术扉页](images/1-0.png)

**今日待办** — 汇总所有植物今日到期的养护任务，按植物分组展示，打卡即自动推进下次周期

![今日待办](images/1-1.jpeg)

**我的植物** — 卡片展示植物照片、物种、健康状态与任务数

![我的植物](images/1-2.jpeg)

**植物详情与生长历程** — 双栏布局，集成每日照片打卡时间线、AI 长势分析、养护周期联动与多日生长复盘建议报告

![植物详情](images/1-3.jpeg)

## ✨ 功能特性

- **🌿 艺术动态开屏扉页** — 原生 SVG 龟背竹与枝叶动态摇曳、浮动晨光光晕与生机孢子，支持随时重温与一键入园
- **📷 多模态智能视觉分析** — 上传植物照片，调用 **DeepSeek**（`deepseek-flash`）或 **智谱 GLM**（`GLM-5V-Turbo`）等视觉大模型，精准识别物种、评估健康、排查隐患并提供科学养护建议
- **📈 生长历程与多维时间线** — 支持每天不同时间多次拍照打卡，联动养护任务打卡状态，随时生成多日生长复盘与养护周期动态调整建议
- **📅 自动养护日程** — 根据植物物种与当前生长状态，自动生成浇水、施肥、修剪、光照、巡检等周期性任务
- **🌱 今日待办与任务联动** — 汇总所有植物当天到期任务，一键打卡并记录养护日志，自动推进下一轮提醒日期
- **🔔 每日提醒** — 浏览器通知，每天首次打开时贴心提醒今日待办
- **💾 Node 原生 SQLite 持久化** — 基于 Node.js 内置轻量 SQLite（`node:sqlite`），零第三方外部数据库依赖
- **📱 局域网访问与多设备实时同步** — 支持 `--host` 局域网多设备（手机/平板/电脑）同时访问，数据自动毫秒级同步互通
- **🌐 规范 RESTful API 路由** — 提供规范的 `/api/plants`、`/api/plants/:id`、`/api/plants/:id/observations` 等资源化接口
- **🎨 亲生物设计（Biophilic Design）** — 苔绿/叶绿/土褐/天光蓝色盘，有机曲线、叶脉纹理与纸纤维质感，柔和光影交互

## 🛠 技术栈

- **前端**：React 18 + TypeScript + Vite
- **图标与样式**：lucide-react · 纯手写 CSS 亲生物自然主题 · react-markdown + remark-gfm
- **模型支持**：DeepSeek 官方多模态视觉模型（默认 `deepseek-flash`）、智谱 GLM（`GLM-5V-Turbo`）及任意兼容 OpenAI 规范的视觉大模型
- **后端持久化**：Node.js 原生 `node:sqlite`（DatabaseSync）+ Vite Server RESTful 中间件
- **多端同步**：LocalStorage 离线缓存 + RESTful 后端热更新时间戳轮询

## 🚀 快速开始

### 环境要求

- Node.js 18+（推荐 Node.js 22+ 以支持原生 `node:sqlite`）
- npm 或其他包管理器

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（支持本机及局域网访问）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

启动后控制台会显示：
- 本地访问：`http://localhost:5173/`
- 局域网访问：`http://<你的局域网IP>:5173/`（手机与电脑在同一 Wi-Fi 下可直接扫码或输入网址访问）

### 配置 API

1. 打开应用，进入左侧「设置」
2. 选择预设服务商（已内置 **DeepSeek 官方 API** 与 **智谱 GLM** 一键切换预设）
3. 填入你的 API Key（例如 DeepSeek `sk-***`）
4. 点击「测试连接」确认配置成功即可立即使用

### 使用流程

1. 步入开屏扉页，点击「踏入花园 · 开启记录」进入主页
2. 进入「我的植物」→ 点击「添加植物」
3. 上传植物照片（可选填名称）→ 点击「上传并分析」
4. AI 识别完成后，自动生成科学养护建议与周期日程
5. 在「植物详情」中可每日多次拍照打卡，一键联动养护任务，生成综合生长复盘建议

## 📁 项目结构

```
Petalog/
├── data/
│   └── petalog.db              # Node 原生 SQLite 数据库
├── server/
│   ├── db.ts                   # SQLite 数据表与 CRUD 逻辑
│   └── plugin.ts               # Vite 插件层 RESTful API 路由
├── images/
│   ├── 1-0.png                 # 艺术开屏首页截图
│   ├── 1-1.jpeg                # 今日待办截图
│   ├── 1-2.jpeg                # 我的植物截图
│   └── 1-3.jpeg                # 植物详情截图
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 根组件 + 路由
│   ├── types.ts                # 类型定义
│   ├── constants.ts            # 常量与模型预设配置
│   ├── api/
│   │   └── client.ts           # 多模态 API 客户端（视觉识别 + 生长复盘）
│   ├── lib/
│   │   ├── storage.ts          # RESTful API 客户端与本地缓存
│   │   ├── image.ts            # 图片压缩转 base64
│   │   ├── schedule.ts         # 日程周期与今日任务计算
│   │   ├── notifications.ts    # 浏览器通知
│   │   └── id.ts               # ID 生成
│   ├── hooks/
│   │   └── useStore.tsx        # 全局状态与多端实时同步
│   ├── components/             # UI 组件
│   │   ├── LandingCover.tsx    # 动态植物艺术开屏首页
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TodayView.tsx       # 今日待办
│   │   ├── PlantListView.tsx   # 植物列表
│   │   ├── PlantCard.tsx
│   │   ├── PlantDetail.tsx     # 植物详情与时间线
│   │   ├── AddPlantModal.tsx   # 添加植物
│   │   ├── SettingsView.tsx    # 设置与多端同步面板
│   │   ├── TaskItem.tsx
│   │   ├── HealthBadge.tsx
│   │   └── EmptyState.tsx
│   └── styles/
│       ├── index.css           # 主题变量与全局样式
│       └── components.css      # 组件样式与动效
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 📄 License

MIT
