# DeepSeek .NET Architect System (架构师修行)

> **"From CRUD to Architect"** - 这是一个基于 DeepSeek AI 驱动的沉浸式 RPG 学习系统。它将 .NET 架构师的学习路线游戏化，你将扮演一名修仙者，通过完成 AI 发布的架构挑战，从“练气期”（初级开发）一步步飞升至“大乘期”（首席架构师）。

![System Preview](https://via.placeholder.com/800x400?text=DeepSeek+Architect+System)

## 🌟 核心特色 (Core Features)

### 1. 沉浸式 RPG 体验 (Gamification 2.0)
系统不再是枯燥的问答，而是分为三个**试炼区域 (Zones)**：
*   **🍃 新手村 (Novice Village)**: `Lv.1 - Lv.5`. 基础语法与概念 (LINQ, Async). 语气亲切的导师引导。
*   **🔥 代码战场 (Code Battlefield)**: `Lv.5 - Lv.15`. 复杂的业务场景代码编写. 魔鬼教官严格 Review，有 Bug 拒绝给分。
*   **🏰 通天塔 (Architect Tower)**: `Lv.15+`. 也就是无尽模式。挑战高并发、微服务拆分、DDD 落地等架构难题。

### 2. 隐形协议系统 (Invisible Protocol)
*   **智能结算**: AI 会在后台通过 JSON 协议自动结算你的经验值 (XP) 和技能 (Skill Unlock)。
*   **沉浸体验**: 前端通过拦截器自动隐藏所有通讯协议代码，你看到的只有自然语言回复和金色的系统奖励提示。

### 3. 本地持久化 (Local Persistence)
*   你的等级、经验、聊天记录、API Key 全部存储在本地 (`LocalStorage` + `JSON DB`)。
*   刷新页面不丢失进度，甚至支持导出存档。

## 🛠️ 技术栈 (Tech Stack)

体现架构师的极简主义美学：**No Frameworks, Just Code.**

*   **Frontend**: Native HTML5 + Vanilla JS (ES6+). 无 React/Vue 打包负担。
*   **Styling**: 纯 CSS3 (Variables, Flexbox, Grid). 实现了“太极生两仪”的启动动画与毛玻璃特效。
*   **AI Integration**: 直连 DeepSeek API，支持流式输出 (Streaming Typewriter)。

## 📂 目录结构 (Directory Structure)

```bash
/
├── start_website.bat      # [Entry] 一键启动脚本 (Windows)
├── server.js              # [Backend] Node.js 轻量级服务器
├── index.html             # [UI] 沉浸式单页入口
├── Skills.md              # [Knowledge] 技能树定义
├── Resource/              # [Data] 存档目录
│   ├── chat_logs.json     # 聊天记录
│   └── user_profile.json  # 用户档案
├── js/
│   ├── app.js             # 主逻辑控制器
│   ├── api.js             # DeepSeek API 封装 (Stream)
│   ├── state.js           # 状态管理 (XP, Level System)
│   ├── data.js            # 游戏数据 (Prompts, Zones)
│   ├── components.js      # UI 渲染组件
│   └── json_db.js         # 前端 NoSQL 引擎
└── css/
    ├── intro.css          # 启动动画与核心布局
    ├── style.css          # 通用样式
    └── animations.css     # 粒子与特效
```

## 🚀 快速开始 (Quick Start)

1.  **启动**: 双击根目录下的 `start_website.bat`。
2.  **访问**: 打开浏览器访问 [http://localhost:8000](http://localhost:8000)。
3.  **配置**: 点击右上角设置图标，输入你的 DeepSeek API Key (仅本地存储)。
4.  **开始**: 在聊天框输入 "System Startup" 或直接开始提问，迎接你的第一场试炼！

---
*Created with DeepSeek Agentic Coding.*
