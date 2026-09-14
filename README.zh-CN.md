# 配天机器人 ARL 语言支持

[English](./README.md) | **简体中文**

面向 **配天（PEITIAN）工业机器人 ARL** 程序的轻量级 Visual Studio Code 语言支持插件。

本插件专注于让 `.arl` 文件在原生 VS Code 中获得良好的编辑体验，不引入 Language Server、AI 运行时、云服务、机器人在线连接层，也没有生产环境 npm 依赖。

## 功能

- `.arl` 文件识别与专属文件图标
- 基于配天 ARL 编辑器 Black / Light 配色的语法高亮
- JetBrains Mono / Cascadia Code 精确字重适配
- 智能缩进与全文格式化
- ARL 代码块折叠
- Outline、大纲、Breadcrumbs 与 `Ctrl+Shift+O` 函数导航
- `F12` / `Ctrl+点击` 跳转用户函数定义
- 支持 `file::func()` 形式的跨文件函数跳转
- ARL 指令、逻辑关键字、数据类型、函数、系统变量 Hover 说明
- ARL 关键字、指令、函数、变量、系统变量 IntelliSense
- 运动指令命名参数的类型感知补全
- 内置 ARL 调用与用户函数 Signature Help 参数提示
- `//` 行注释与 `/* ... */` 块注释高亮

## 类型感知补全

ARL 补全尽量保持简单、可预测。

在自由输入状态下，至少输入一个字符后才开始联想：

```arl
p
```

此时可以匹配不同类别，例如 `ptp`、`pose`、`print` 以及已声明变量。

当上下文已经明确参数类型时，只显示兼容类型的已声明变量：

```arl
pose pHome
pose pPick
joint jHome
speed vFast

ptp p:p
```

因为 `p:` 要求 `pose`，所以候选会包含 `pHome`、`pPick` 等 `pose` 变量，而不会混入无关指令、`joint` 或 `speed` 变量。

当前支持的类型筛选：

| 参数上下文 | 期望类型 |
| --- | --- |
| `p:` | `pose` |
| `j:` | `joint` |
| `v:` | `speed` |
| `s:` | `slip` |
| `t:` | `tool` |
| `w:` | `wobj` |

工作区全局变量使用内存索引缓存，不会在每次按键时重新扫描整个工程。

## 常用快捷键

插件遵循 VS Code 原生快捷键：

| 操作 | Windows / Linux |
| --- | --- |
| 行注释 / 取消注释（`//`） | `Ctrl+/` |
| 全文格式化 | `Shift+Alt+F` |
| 手动触发 IntelliSense | `Ctrl+Space` |
| 手动触发参数提示 | `Ctrl+Shift+Space` |
| 跳转到定义 | `F12` |
| 当前文件函数列表 | `Ctrl+Shift+O` |
| 折叠当前区域 | `Ctrl+Shift+[` |
| 展开当前区域 | `Ctrl+Shift+]` |
| 折叠全部 | `Ctrl+K`，再按 `Ctrl+0` |
| 展开全部 | `Ctrl+K`，再按 `Ctrl+J` |

ARL 行注释使用 `//`，块注释使用 `/* ... */`。

## 格式化

`Shift+Alt+F` 会按照 ARL 的代码块语义格式化整个文件：

```text
OPEN:   func / if / while / for / loop / switch / repeat / interrupt / timer / trigger
CLOSE:  endfunc / endif / endwhile / endfor / endloop / endswitch / until
BRANCH: elseif / else / case / default
```

`if(cond) action` 这类单行紧凑写法不会错误地让下一行继续缩进。

## Hover 与跳转

ARL 指令、函数、逻辑关键字、数据类型和内置系统变量均可提供 Hover 说明。

用户函数：

```arl
func pose calcOffset(pose src, double dx)
    ...
endfunc
```

可以通过 `F12` 或 `Ctrl+点击` 跳转定义；`def::point_offset()` 这类跨文件调用也可以定位到当前工程中的对应 ARL 文件。

## 配色与字体

插件提供可选的：

- **Peitian ARL Black**
- **Peitian ARL Light**

同时会对常见 VS Code 内置深色/浅色主题应用仅针对 ARL 的 token 配色，不影响其他编程语言。

`Peitian Robot ARL: Precise Font Weights` 默认开启。使用 JetBrains Mono 或 Cascadia Code / Cascadia Mono 时，会采用更接近配天 ARL 编辑器的分级数字字重。

JetBrains Mono 示例：

```json
"editor.fontFamily": "'JetBrains Mono', Consolas, monospace",
"editor.fontWeight": "200"
```

## 隐私与网络

本插件：

- 不会通过网络发送 ARL 源代码；
- 不包含遥测；
- 不调用 AI 服务；
- 不需要 Language Server；
- 没有生产环境 npm 依赖。

所有语言处理均在本机 VS Code 中完成。

## 定位

这是一个**轻量级 ARL Language Support 插件**。目前不提供机器人在线控制、程序执行、调试器、完整语义诊断、符号重命名、引用搜索或 AI 代码生成。

## 兼容性

- Visual Studio Code `1.85.0` 或更高版本
- Windows、macOS、Linux
- `.arl` 文件

## 安装

正式上架后，可在 VS Code 扩展市场搜索：

**Peitian Robot ARL Language Support**

本地测试可使用 **扩展 → ... → 从 VSIX 安装...** 选择 `.vsix` 文件。

## 源码与版权

项目源码公开用于透明审查、问题反馈和参考，但作者保留版权。具体条款见 [LICENSE](./LICENSE)。PEITIAN / 配天名称、商标、官方文档以及其他第三方材料的权利仍归各自权利人所有。

## 问题反馈

请通过 [GitHub Issues](https://github.com/YoyoDavidGo/Peitian-Robot-ARL-Language-Support/issues) 提交问题。建议附上 VS Code 版本、插件版本、操作系统、最小可复现 ARL 片段，以及视觉问题截图。请勿在公开 Issue 中上传客户机密程序、账号或凭据。
