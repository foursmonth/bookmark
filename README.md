# 书签管理器

一个简洁高效的 Chrome 书签管理扩展，替代浏览器默认新标签页。

## 功能特性

- **多列展示** - 可自定义显示列数，书签一目了然
- **树形结构** - 支持文件夹展开/折叠，清晰层级关系
- **拖拽排序** - 拖拽书签到任意位置，支持跨列、跨文件夹移动
- **搜索过滤** - 实时搜索，ESC 或清除按钮快速清空
- **右键菜单** - 编辑、新增、删除书签/文件夹
- **设置持久化** - 展示列数、展开深度等配置自动保存

## 安装

### 方式一：从 Releases 下载（推荐）

1. 前往 [Releases](https://github.com/foursmonth/bookmark/releases) 页面
2. 下载最新版本的 `bookmark-vX.X.X.zip`
3. 解压到任意目录
4. 打开 Chrome，访问 `chrome://extensions`
5. 开启右上角「开发者模式」
6. 点击「加载已解压的扩展程序」，选择解压后的目录
7. 打开新标签页即可使用

### 方式二：自行构建

```bash
# 克隆项目
git clone https://github.com/foursmonth/bookmark.git
cd bookmark

# 安装依赖
yarn install

# 构建
yarn build

# 加载 dist/ 目录到 Chrome
```

### 更新版本

1. 前往 [Releases](https://github.com/foursmonth/bookmark/releases) 下载新版本
2. 解压覆盖旧文件（或解压到新目录）
3. 在 `chrome://extensions` 页面点击扩展的刷新按钮

## 开发

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn serve

# 构建
yarn build
```

## 技术栈

- Vue 3 + TypeScript
- Naive UI
- vue-draggable-plus
- Chrome Extensions Manifest V3

## 使用说明

### 基本操作

- **展开/折叠** - 点击文件夹图标
- **编辑模式** - 切换右上角开关进入编辑模式
- **拖拽** - 编辑模式下拖拽书签调整位置
- **右键菜单** - 编辑模式下右键点击书签

### 快捷键

- `ESC` - 清空搜索框 / 取消拖拽

### 设置

点击右上角齿轮图标可配置：
- 展示列数
- 最大展开深度

## License

MIT
