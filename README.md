# MiroBoard - 现代化交互式白板协作软件

一个高度还原 **Miro / FigJam** 核心体验的现代化无限画布白板软件，基于 React 19 + TypeScript + Vite + Tailwind CSS 构建。

## ✨ 核心特性

1. **无限漫游画布 (Infinite Canvas)**
   - 滚轮平滑缩放（以鼠标光标为中心，支持 10% ~ 500%）
   - 按住空格键或切换抓手工具自由漫游拖动画布
   - 点状网格 (Dots) / 方格线条 (Lines) / 纯白无网格三种视觉模式快速切换
   - 一键自适应全部内容视口 (Fit to content)

2. **丰富的白板图形与元素库**
   - **经典便签 (Sticky Note)**：Miro 经典高饱和/马卡龙多色便签（黄、蓝、绿、粉、橙、紫），双击直接原地文字编辑
   - **常用图形 (Shapes)**：矩形、圆角矩形、圆形、决策菱形、三角形、五角星
   - **智能连接线 (Connectors & Arrows)**：
     - 支持直线、平滑贝塞尔曲线、折线三种形态
     - 鼠标悬停任意元素边缘自动激活 4 向吸附锚点（Top / Right / Bottom / Left），一键拉出连线
     - 拖动便签或形状时，连线自动吸附跟随移动！
   - **自由画笔 (Pen)**：矢量平滑笔触自由涂鸦手绘
   - **分区容器 (Frame)**：类似 Miro Frame，可作为模块和话题组织区域
   - **独立文本 (Text)**：可调节字号、粗细、排版与对齐
   - **橡皮擦 (Eraser)**：点击或划过任意元素快速清除

3. **对象操作与交互**
   - 鼠标框选多选（Marquee selection）与 Shift+点击多选
   - 8 向交互式拉伸调整手柄 (Resize handles)
   - 浮动工具栏 (Context Toolbar)：随选中对象浮动出现，支持快捷改色、边框粗细/样式调整、字号增减、对齐方式、图层上下移等
   - 快速复制副本（Ctrl+D）与批量删除（Delete / Backspace）
   - 完备的撤销/重做历史栈（Ctrl+Z / Ctrl+Y）

4. **预置工业级模版库 (Templates)**
   - 💡 **头脑风暴 (Brainstorming)**：痛点、解决方案与行动项多色便签阵列
   - 📋 **敏捷看板 (Kanban Board)**：待办 (To Do)、进行中 (In Progress)、已完成 (Done) 任务看板
   - 🔀 **业务流程图 (Flowchart)**：包含请求起点、判断分支、业务处理与终止节点的标准连线流程
   - 📊 **SWOT 态势分析**：四象限矩阵战略分析模型

5. **右下角鹰眼缩略图 (Minimap Radar)**
   - 全局微缩雷达实时展示所有白板元素分布
   - 蓝色半透明视口框实时同步当前屏幕可视区域，点击小地图任意位置瞬间穿梭定位

6. **导出与工程存储**
   - 📷 **导出为高清 PNG 图片**（Retina 2x 导出）
   - 🎨 **导出为矢量 SVG**（保留完整矢量属性）
   - 💾 **保存为 JSON 工程文件**
   - 📂 **导入/打开本地 JSON 工程**

## 📱 安卓手机运行与 App 化支持

本项目已完成**原生触屏手势适配**与**安卓应用化打包工程**：

### 方式 1：安卓手机直接扫码打开 & 一键安装为独立 App（推荐）
1. 确保手机与电脑连接同一个 Wi-Fi 网络；
2. 手机浏览器直接打开：`http://192.168.10.2:5173/`（或在电脑白板右上角点击**【手机版】**直接扫码）；
3. **原生触屏体验**：
   - **双指捏合 / 张开**：画布平滑缩放
   - **双指滑动**：自由漫游平移画布
   - **单指绘制 / 拖拽**：手指直接绘制画笔涂鸦、移动便签和形状
   - **自适应移动端布局**：工具栏自动适配为底部轻量触控 Dock，不遮挡作图视口
4. **添加为手机桌面 App（PWA 原生化）**：
   - 在手机浏览器右上角/底部菜单点击 **“添加到主屏幕”** 或 **“安装应用”**；
   - 手机主屏幕会出现独立的 **MiroBoard** 应用图标；
   - 点开即为全屏运行，无浏览器地址栏，操作丝滑如同原生 App！

### 方式 2：Android Studio 打包原生 APK
项目根目录下已初始化好标准 Capacitor Android 原生工程：
```bash
# 在 Android Studio 中打开原生工程进行调试与构建打包：
npx cap open android
```
工程目录位于：[`android/`](file:///C:/Users/基德/.gemini/antigravity/scratch/miro-whiteboard/android)
可以在 Android Studio 中直接点击 **Build > Build Bundle(s) / APK(s) > Build APK(s)** 导出正式 `.apk` 安装包。

---

## 🚀 启动与运行

当前服务已在本地启动：
- **访问地址**: [http://localhost:5173/](http://localhost:5173/)

如需在终端手动运行：
```bash
cd "C:\Users\基德\.gemini\antigravity\scratch\miro-whiteboard"
npm run dev
```

构建生产环境：
```bash
npm run build
```

---

## ⌨️ 常用快捷键

| 快捷键 | 功能 |
| :--- | :--- |
| `V` | 选择工具 (Select) |
| `H` | 抓手工具 (Hand) |
| `N` | 放置便签 (Sticky Note) |
| `S` / `R` | 图形库 (Shapes) |
| `T` | 文本工具 (Text) |
| `A` | 箭头/连线 (Connector) |
| `P` | 画笔 (Pen) |
| `F` | 框架分区 (Frame) |
| `E` | 橡皮擦 (Eraser) |
| `空格 + 拖拽` | 平移画布 |
| `鼠标滚轮` | 画布缩放 |
| `双击元素` | 进入文字编辑模式 |
| `Ctrl + Z` | 撤销 (Undo) |
| `Ctrl + Y` | 重做 (Redo) |
| `Ctrl + D` | 复制选中副本 (Duplicate) |
| `Delete / Backspace` | 删除选中元素 |
| `Ctrl + A` | 全选白板元素 |
| `0` | 重置缩放为 100% |
| `Shift + 1` | 缩放以适应全部内容 |
