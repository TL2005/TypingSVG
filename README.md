# TypingSVG

<p align="center">
  <h1 align="center">TypingSVG</h1>
</p>
  
<p align="center">
  <img src="typing-svg.svg" alt="TypingSVG-quote" style="display: block; margin: 0 auto;">
</p>

<p align="center">
    <a href="https://nextjs.org/">
        <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
    </a>
    <a href="https://reactjs.org/">
        <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    </a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    </a>
    <a href="https://tailwindcss.com/">
        <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    </a>
</p>

## 功能特色

市面上有许多类似的 Typing-SVG 项目，但 **TypingSVG** 更注重灵活性与精确度：

- **全面支持 Google Fonts**：可使用任何 Google Fonts 字体。为每一行独立指定字体名称（如 `"Roboto"`、`"Bitcount Ink"`）；服务器会自动获取并内嵌字体文件，保证 SVG 在任何设备上渲染一致。
- **逐行定制**：每行可单独设置字体、颜色、字号、字间距、打字速度、删除速度等。
- **多行输入**：每个 `lines` 项都可包含 `\n`，以在该项中渲染视觉换行。
- **精确排版与对齐**：支持多空格与换行，支持水平与垂直居中。
- **多种删除模式**：`backspace`、`clear` 或 `stay`，可自定义删除速度。
- **多样光标样式**：`straight`（竖线）、`underline`（下划线）、`block`（方块）或 `blank`（无光标）。
- **直观速度控制**：速度单位为每秒字符数 `(char/s)`，更易理解。
- **精细控制选项**：暂停时长、循环开关、边框、背景等可自定义。
- **字体粗细**：可调节字体的加粗程度。
- **服务器端渲染**：SVG 在服务器端完全渲染，字体已内嵌，客户端无需加载字体。

简而言之：**更多定制、更多控制、更易分享的文字动画！** 🎨

## 在线演示与预览

[![DEMO_GIF](https://github.com/user-attachments/assets/e37cb962-57d3-430b-a4ed-717f57495243)](https://typingsvg.vercel.app/)
在线演示地址： https://typingsvg.vercel.app/

## 使用方法

1. 打开网站：[typingsvg.vercel.app](https://typingsvg.vercel.app/)
2. 输入文字（按 Enter 可换行，多空格会被保留）。
3. 调整字体、颜色、速度和光标样式，实时预览效果。
4. 复制生成的 URL 或下载 SVG，可嵌入在 README、个人资料、博客或社交平台。
5. 欢迎给项目点个 Star 😄

## 自行部署

由于本项目托管在免费的 Vercel 账户上，资源有限。建议自行部署以获得更好的性能与稳定性。

1. 在 [vercel](https://vercel.com/) 登录或注册账户。
2. 点击下方按钮一键部署：

    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FwhiteSHADOW1234%2FTypingSVG)
3. 按提示完成部署。

## 本地运行

前提条件：Node v18+ 与 npm。  
1. 克隆仓库：
    ```bash
    git clone https://github.com/whiteSHADOW1234/TypingSVG.git
    cd TypingSVG
    ```
2. 安装依赖：
    ```bash
    npm install
    ```
3. 启动开发服务器：
    ```bash
    npm run dev
    ```
    运行后访问 `http://localhost:3000`。

## API 参数说明

SVG 通过 `/api/svg` 接口生成，可使用查询参数进行定制：

| 参数 | 说明 | 默认值 |
|---|---|---|
| `lines` | **推荐使用** — JSON 数组形式的行对象。每个对象包含 `text`，可设置样式覆盖。支持 `\n` 换行。| `lines=[{"text":"Hello, World!"},{"text":"And Emojis! 😀🚀"}]`|
| `text` | **旧版（不推荐）** — 文本内容，用 `;` 分隔多行。建议改用 `lines`。 | `Hello, World!;And Emojis! 😀🚀` |
| `font` | 字体名称。 | `Courier Prime` |
| `color` | 文本颜色（十六进制）。 | `#000000` |
| `backgroundColor` | 背景颜色（十六进制）。 | `#ffffff` |
| `width` | SVG 宽度（px）。 | `450` |
| `height` | SVG 高度（px）。 | `150` |
| `fontSize` | 字体大小（px）。 | `28` |
| `typingSpeed` | 打字速度（秒/字符）。 | `0.5` |
| `deleteSpeed` | 删除速度（秒/字符）。 | `0.5` |
| `pause` | 每段内容后的暂停时长（毫秒）。 | `1000` |
| `letterSpacing` | 字间距（em）。 | `0.1em` |
| `repeat` | 是否循环播放（`true`/`false`）。 | `true` |
| `center` | 是否水平居中（`true`/`false`）。 | `true` |
| `vCenter` | 是否垂直居中（`true`/`false`）。 | `true` |
| `border` | 是否显示边框（`true`/`false`）。 | `true` |
| `cursorStyle` | 光标样式：`straight`、`underline`、`block`、`blank`。 | `straight` |
| `deletionBehavior` | 删除模式：`stay`、`backspace`、`clear`。 | `backspace` |
| `fontWeight` | 字体粗细。 | `400` |
| `backgroundOpacity` | 背景透明度。 | `1` |

**说明**

- `lines` 中的每行设置会覆盖全局参数。
- 将 `lines` JSON 放入 URL 时必须进行 URL 编码，尤其包含 `\n`、表情符号或特殊字符时（网站会自动处理编码）。
- 支持表情符号，布局时会将其视为单个字符。

**示例（易读格式）：**  
```
https://typingsvg.vercel.app/api/svg?lines=[{"text":"Hello,+World!"}]
```

## 致谢与灵感来源

本项目灵感源自 [DenverCoder1 的 readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg)，  
它让 README 文件拥有了动态打字效果，令人眼前一亮。  
但在使用中，我发现它缺乏真正的多行支持、删除速度固定、空格处理不直观等问题。  
这些不足促成了 **TypingSVG** 的诞生——一个更流畅、更灵活的改进版本，  
让创作者重新掌握格式与表现的自由。

衷心感谢 [DenverCoder1](https://github.com/DenverCoder1) 的创意启发。TypingSVG 正是那份灵感的延续 ❤️

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=whiteSHADOW1234/TypingSVG&type=Date)](https://www.star-history.com/#whiteSHADOW1234/TypingSVG&Date)

## 参与贡献

欢迎为 TypingSVG 做出贡献！  
请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 获取参与指南、报告问题、提交功能请求或 PR 的流程。

## 许可协议

本项目采用 **MIT 许可证**。详情见 [LICENSE](LICENSE)。
