<p  align="center">
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
</div>

## Features

There are other typing-SVG projects out there — but Typing SVG focuses on flexibility and precision:

- **Full Google Fonts support**: Use any font available on Google Fonts. Specify the font family name per-line (e.g. `"Roboto"`, `"Bitcount Ink"`); the server will fetch and inline the font files so the SVG renders the same everywhere.
- **Per-line customization**: Set font, color, fontSize, letterSpacing, typingSpeed and deleteSpeed for each line independently.
- **Multi-line input**: Each `lines` item can contain `\n` to render visual line breaks within that item.
- **Accurate spacing & alignment**: Preserves multiple spaces, newlines and supports centering (horizontal/vertical).
- **Flexible deletion behaviors**: `backspace`, `clear`, or `stay` with configurable delete speed.
- **Multiple cursor styles**: `straight`, `underline`, `block`, or `blank`.
- **Fine-grained controls**: Pause duration, repeat toggle, border, background, and more.
- **Server-rendered**: SVG is fully rendered server-side — fonts are inlined so consumers don't need to load fonts on the client.

Short: **more customization, more control, and more shareable animated text** 🎨


## Live Demo & Preview
[![DEMO_GoogleFont](https://github.com/user-attachments/assets/fa2932f0-d724-496d-929d-30c4e541646f)](https://typingsvg.vercel.app/)
link: https://typingsvg.vercel.app/

## How to Use
1. Visit the site: [typingsvg.vercel.app](https://typingsvg.vercel.app/)
2. Enter your text (press Enter to create line breaks — multiple spaces are preserved).
3. Tweak fonts, colors, speeds and cursor; preview updates live.
4. Copy the generated URL or download the SVG and embed it anywhere (README, profile, blog, social, etc.).
5. Star this repo ~ 😄

## Deploy It Yourself
Since this project is hosted on a free Vercel account, resources are limited. To ensure optimal performance and availability, it's recommended to deploy Typing SVG on your own. Here's how:

1. Sign in or create a Vercel account at [vercel](https://vercel.com/).

2. Click the "Deploy to Vercel" button below

    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FwhiteSHADOW1234%2FTypingSVG)

3. Follow the prompts to deploy the application to your Vercel account.

## API Options

The SVG is generated via the `/api/svg` endpoint. Customize it with query parameters:

| Parameter | Description | Default |
|---|---|---|
| `lines` | **Preferred** — JSON array of line objects. Each must include `text` and may include per-line style overrides. Use `\n` in text for internal line breaks.| `lines=[{"text":"Hello, World!"},{"text":"And Emojis! 😀🚀"}]`|
| `text` | **Legacy (deprecated)** —Text to be typed. Use `;` to separate lines. Prefer lines. | `Hello, World!;And Emojis! 😀🚀` |
| `font` | Font family for the text. | `Courier Prime` |
| `color` | Text color in hex format. | `#000000` |
| `backgroundColor` | Background color in hex format. | `#ffffff` |
| `width` | Width of the SVG in px. | `450` |
| `height` | Height of the SVG in px. | `150` |
| `fontSize` | Font size of the text in px. | `28` |
| `typingSpeed` | Typing speed in seconds per character. | `0.5` |
| `deleteSpeed` | Deletion speed in seconds per character. | `0.5` |
| `pause` | Pause after a content block in milliseconds. | `1000` |
| `letterSpacing` | Letter spacing in `em`. | `0.1em` |
| `repeat` | Repeat the animation (`true`/`false`). | `true` |
| `center` | Center text horizontally (`true`/`false`). | `true` |
| `vCenter` | Center text vertically (`true`/`false`). | `true` |
| `border` | Show a border (`true`/`false`). | `true` |
| `cursorStyle` | Cursor style (`straight`, `underline`, `block`, `blank`). | `straight` |
| `deletionBehavior` | How deletion is handled: `stay`, `backspace`, `clear`. | `backspace` |

**Notes**

- Per-line overrides in lines take precedence over global parameters.
- Always URL-encode the lines JSON when you put it into a query string — this is required for `\n`, emojis and other special characters. (The demo UI encodes for you automatically.)
- Emojis are supported; they are treated as single graphemes for layout.

**Basic Example (readable form):**  
```
https://typingsvg.vercel.app/api/svg?lines=[{"text":"Hello,+World!"}]
```

##  Credits & Inspiration

This project stems from a deep admiration for [DenverCoder1’s readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg)
—a clever, widely embraced tool that brought typing animations to README files. While using it, I encountered several limitations: the lack of genuine multi-line support, a fixed delete speed, and handling blank spaces felt awkward—requiring workarounds that disrupted the creative flow. That frustration sparked the idea for **Typing SVG**—a smoother, more flexible evolution designed to bring back control and clarity to formatting.

A heartfelt, huge thank you to [DenverCoder1](https://github.com/DenverCoder1) for sparking the idea. Typing SVG builds upon that original spark. ❤️



## Contributing

We welcome contributions to Typing SVG! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for more details on how to get started, report bugs, request features, and submit pull requests.


## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
