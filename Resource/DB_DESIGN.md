# JSON NoSQL Database Design (Lite)

## 1. 核心理念 (Core Concept)
采用 **Document-Oriented (文档型)** 数据库设计。数据以 **JSON** 文件形式存储，模拟 MongoDB/CouchDB 的结构。

## 2. 目录结构 (Directory Structure)
虽然浏览器无法直接写文件到磁盘，但我们在内存/LocalStorage 中维护这个虚拟文件系统结构，并提供 "Export to JSON" 功能。

```text
Resource/
└── database/
    ├── meta.json                # 数据库元数据 (Version, LastSync)
    ├── users/
    │   └── u_default.json       # 用户档案 (Level, XP, Settings)
    └── chats/
        ├── session_list.json    # 会话索引 (ID, Title, Mode, Date)
        └── [session_id].json    # 具体聊天记录 (Messages Array)
```

## 3. 数据模型 (Schema)

### A. User Profile (`users/u_default.json`)
```json
{
  "_id": "u_default",
  "username": "Taoist",
  "level": 5,
  "xp": 450,
  "title": "Senior Architect",
  "preferences": {
    "theme": "warm",
    "apiKey": "sk-***"
  }
}
```

### B. Session List (`chats/session_list.json`)
```json
[
  {
    "id": "sess_1706248000",
    "title": "C# GC 原理讨论",
    "mode": "mode_advanced",
    "created_at": 1706248000000,
    "preview": "GC 分代算法分为..."
  }
]
```

### C. Chat Log (`chats/[session_id].json`)
```json
{
  "_id": "sess_1706248000",
  "messages": [
    {
      "role": "user",
      "content": "GC 是怎么工作的？",
      "timestamp": 1706248001000
    },
    {
      "role": "agent",
      "content": "C# GC 使用分代算法...",
      "timestamp": 1706248005000
    }
  ]
}
```

## 4. API 设计 (js/json_db.js)

我们将实现一个轻量级的 `JsonDB` 类：

```javascript
class JsonDB {
    constructor() { ... }
    
    // CRUD
    collection(name).insert(doc)
    collection(name).find(query)
    collection(name).update(id, updates)
    
    // IO
    exportToZip() // 打包下载所有 JSON
}
```
