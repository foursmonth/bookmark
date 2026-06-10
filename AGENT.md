# AGENT.md

## 项目概述

Chrome 书签管理扩展，使用 Vue 3 + TypeScript + Naive UI 开发。覆盖浏览器新标签页，提供多列树形书签展示、拖拽排序、搜索过滤等功能。

## 技术栈

- **框架**: Vue 3.2 + TypeScript 4.5
- **UI**: Naive UI 2.34
- **构建**: Vue CLI 5.0
- **拖拽**: vue-draggable-plus (SortableJS)
- **Mock**: mockjs 1.1（开发测试数据）
- **扩展**: Chrome Manifest V3

## 项目结构

```
src/
├── App.vue                    # 根组件，包含 Naive UI providers
├── main.ts                    # 入口文件
├── manifest.json              # Chrome 扩展配置（复制到 dist/）
├── components/
│   ├── BookMarks.vue          # 主组件：书签网格、拖拽逻辑、右键菜单
│   └── FlatNodeRow.vue        # 单行书签节点渲染
└── common/
    ├── type.ts                # 类型定义：TreeNode, FlatNode, DragState 等
    ├── constants.ts           # 常量：缩进宽度、放置区域比例等
    ├── treeUtil.ts            # 树操作：构建、扁平化、DFS 搜索
    ├── chromeUtil.ts          # Chrome API 封装：书签 CRUD、存储
    ├── util.ts                # 工具函数：防抖、集合操作
    ├── envUtil.ts             # 环境检测：是否在 Chrome 扩展中运行
    └── mockBookmarks.json     # Mock 书签数据，用于开发测试
```

## 开发命令

```bash
# 开发模式 (热重载)
yarn serve

# 构建
yarn build

# 构建产物在 dist/，导入 Chrome 扩展管理页面即可安装
```

## 核心模块

### BookMarks.vue

主组件，包含：
- 多列书签网格展示 (`columns: ColumnData[]`)
- 拖拽状态管理 (`dragState: DragState`)
- 右键菜单（新增/编辑/删除）
- 设置抽屉（列数、展开深度）
- 搜索过滤（ESC 清空、清除按钮）

### 树结构

- `TreeNode`: 树形节点，包含 children
- `FlatNode`: 扁平化节点，用于渲染（含缩进、祖先标记）
- `flattenTree()`: 树 → 扁平列表
- `buildTreeNode()`: Chrome 书签节点 → TreeNode

### 拖拽逻辑

使用 `vue-draggable-plus` 实现：
- 支持跨列拖拽
- 支持拖入文件夹内部（inside）
- 支持拖到节点下方（below）
- 自动排除子节点作为放置目标
- ESC 取消拖拽

### Chrome API

封装在 `chromeUtil.ts`:
- `getBookmarkTree()`: 获取书签树
- `createBookmark()`: 创建书签/文件夹
- `updateBookmark()`: 更新标题/URL
- `moveBookmark()`: 移动书签
- `removeBookmark()`: 删除书签（递归删除文件夹）
- `getLocalStorage()` / `setLocalStorage()`: 扩展存储

## 开发约定

1. **组件风格**: 使用 `<script setup>` + TypeScript
2. **状态管理**: 响应式对象 + ref，无 Vuex/Pinia
3. **样式**: scoped CSS，常量定义在 `constants.ts`
4. **图标**: `@vicons/ionicons5`

## 注意事项

- Dev server 已常驻运行，开发时无需手动 `yarn build`
- 只有明确要求测试时才执行 build
- 扩展需在 `chrome://extensions` 加载 `dist/` 目录
- `manifest.json` 在构建时复制到 `dist/`

## Manifest 配置

`src/manifest.json` 关键配置：
- `permissions`: bookmarks（书签访问）、storage（设置存储）、favicon（网站图标）
- `chrome_url_overrides.newtab`: 覆盖新标签页为扩展页面
- `web_accessible_resources`: 允许访问 favicon 资源

## Mock 数据

`mockBookmarks.json` 用于开发环境测试：
- 模拟 Chrome 书签树结构
- 包含多层级的书签和文件夹
- 在非扩展环境（普通浏览器）中自动加载

**生产构建优化**：
- `vue.config.js` 配置 `NormalModuleReplacementPlugin`
- 生产构建时替换为 `mockBookmarks.empty.json`（空数组）
- 减少 ~3.5 KiB 打包体积

