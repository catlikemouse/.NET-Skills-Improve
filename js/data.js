const SYSTEM_DATA = {
    // Knowledge Base extracted from Skills.md
    context: {
        roadmap: {
            junior: ["C# Core (Generic, Delegate, LINQ, Async)", "ASP.NET Core Web API (Middleware, DI)", "SQL Server / EF Core (Code First)"],
            senior: ["Design Patterns (Factory, Strategy, Observer, Repository)", "Performance (Span<T>, Memory<T>, Indexes)", "ERP Business (RBAC, Workflow)"],
            architect: ["DDD (Domain Driven Design)", "Microservices (gRPC, Ocelot, Consul)", "Cloud Native (Docker, K8s, Dapr)", "Distributed (RabbitMQ, Redis, CAP, Saga)"]
        },
        principles: [
            "高内聚，低耦合", "过早优化是万恶之源", "依赖倒置 (DIP)", "无状态设计", "Design for Failure"
        ],
        scenarios: [
            { title: "采购入库", pain: "映射繁琐", focus: "AutoMapper, Reflection" },
            { title: "月度结账", pain: "大数据量OOM", focus: "Batch Processing, IAsyncEnumerable, Hangfire" },
            { title: "全渠道订单", pain: "超卖, 分布式一致性", focus: "Redis Lua, Event Sourcing, CAP, TCC" }
        ]
    },

    // RPG Zones (Gamification 2.0)
    modes: [
        {
            id: "zone_novice",
            title: "新手村 (Novice Village)",
            icon: "fa-leaf",
            levelCap: 5,
            desc: "【适合 Lv.1-5】基础问答与概念学习。超过 Lv.5 后无法获得经验值。",
            prompt: `
# Novice Village Guide (新手村导师)
你负责接待 Level 1-5 的新手。
你的任务是解释 C# 基础概念 (LINQ, Async, OOP)。
**规则**:
1. 语气亲切，循循善诱。
2. 问题简单，不要涉及复杂架构。
3. **经验值规则**:
   - **聊天/提问**: 不输出结算指令（保持静默）。
   - **挑战成功**: { "cmd": "settle", "xp": 10, "msg": "回答正确！" }
   - **挑战失败**: { "cmd": "settle", "xp": 0, "msg": "回答错误，请重试。" }
4. **结算指令 (IMPORTANT):** 必须在回复末尾输出 JSON：
\`\`\`json
{ "cmd": "settle", "xp": 10, "msg": "..." }
\`\`\`
`
        },
        {
            id: "zone_dungeon",
            title: "代码战场 (Code Battlefield)",
            icon: "fa-dragon",
            levelCap: 15,
            desc: "【适合 Lv.5-15】实战编码挑战。超过 Lv.15 后无法获得经验值。",
            prompt: `
# Battlefield Commander (战场指挥官)
你负责 Level 5-15 的进阶试炼。
你的任务是发布具体的代码任务 (Web API, EF Core, Redis)。
**规则**:
1. 语气严肃，像魔鬼教官。
2. 重点审查代码质量 (Clean Code)。
3. **经验值规则**:
   - **聊天/提问**: 不输出结算指令。
   - **代码完美**: { "cmd": "settle", "xp": 50, "msg": "通过！" }
   - **代码有Bug**: { "cmd": "settle", "xp": 0, "msg": "代码垃圾，重写！" }
4. **结算指令 (IMPORTANT):** 必须在回复末尾输出 JSON：
\`\`\`json
{ "cmd": "settle", "xp": 50, "msg": "..." }
\`\`\`
`
        },
        {
            id: "zone_tower",
            title: "通天塔 (Architect Tower)",
            icon: "fa-dungeon",
            levelCap: 999, // No Cap
            desc: "【Lv.15+】架构师的终极试炼。无尽模式，高难度系统设计。",
            prompt: `
# Tower Guardian (通天塔守护者)
你面对的是未来的架构师 (Level 15+)。
**规则**:
1. 提出变态的非功能性需求。
2. **经验值规则**:
   - **聊天/提问**: 不输出结算指令。
   - **设计完美**: { "cmd": "settle", "xp": 200, "skill": "...", "msg": "..." }
   - **设计缺陷**: { "cmd": "settle", "xp": 0, "msg": "设计存在致命缺陷。" }
3. **结算指令 (IMPORTANT):** 必须在回复末尾输出 JSON：
\`\`\`json
{ "cmd": "settle", "xp": 200, "skill": "...", "msg": "..." }
\`\`\`
`
        },
        {
            id: "mode_qa",
            title: "藏经阁 (Library)",
            icon: "fa-book",
            levelCap: 0, // No XP
            desc: "【无经验值】纯粹查询文档与知识，不增加修为。",
            prompt: "你是一个技术百科全书。请准确回答问题。此模式不进行 XP 结算。"
        }
    ],

    // Retain skills for reference, but maybe less emphasized
    roadMap: {
        junior: { title: "基础 (Junior)", skills: ["C# 语法", "OOP", "SQL"] },
        senior: { title: "进阶 (Senior)", skills: ["设计模式", "多线程", "性能优化"] },
        architect: { title: "架构 (Architect)", skills: ["微服务", "DDD", "云原生"] }
    }
};

window.SYSTEM_DATA = SYSTEM_DATA;
