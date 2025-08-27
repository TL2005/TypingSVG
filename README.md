<div style="text-align: center;">
  <p>
    <h1>Typing SVG</h1>
  </p>

  <img src="typing-svg.svg" alt="TypingSVG-quote" style="display: block; margin: 0 auto;">
  &nbsp;&nbsp;

  <p>
    <a href="https://nextjs.org/">
        <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
    </a>
    &nbsp;&nbsp;&nbsp;
    <a href="https://reactjs.org/">
        <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    </a>
    &nbsp;&nbsp;&nbsp;
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    </a>
    &nbsp;&nbsp;&nbsp;
    <a href="https://tailwindcss.com/">
        <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    </a>
  </p>
</div>

## ✨ Why This Project?

There are other typing SVG projects out there — but this one takes it further:

- ✅ **Multi-line input**: Write multiple lines, not just one.  
- ✅ **True text formatting**: Supports multiple spaces, line breaks, and precise alignment.  
- ✅ **Flexible deletion**: Customize `deleteSpeed` and decide whether text should erase or not. 
- ✅ **More cursor styles**: Straight, underline, block, or even blank.  
- ✅ **Fine-grained control**: Letter spacing, pause duration, repeat toggle, borders, and more.  

In short: **more customization, more control, and more creativity** 🎨.


## 🚀 Features

- **Multiple Text Lines**: Add multiple lines of text to be typed out.  
- **Custom Fonts**: Use any font family you like.  
- **Color Customization**: Change the text and background color.  
- **Size Control**: Set the width and height of the SVG.  
- **Animation Speed**: Control typing speed, deletion speed, and pause duration.  
- **Looping**: Choose whether the animation should repeat.  
- **Alignment**: Center the text horizontally and vertically.  
- **Cursor Style**: Customize the look of the typing cursor.  
- **And more**: Options for letter spacing, borders, and delete-after-typing effects.  


## 🛠 How to Use
1. Open the the site and customize your typing SVG file.
2. Tap on the URL to copy it or press the download button to get the SVG image.
3. Star this repo ~ 😄


## 🔧 API Usage

The SVG is generated via the `/api/svg` endpoint.  
Customize it with query parameters:

| Parameter | Description | Default |
|---|---|---|
| `text` | Text to be typed. Use `;` to separate lines. | `Hello, World!;And Emojis! 😀🚀` |
| `font` | Font family for the text. | `Monaco` |
| `color` | Text color in hex format (without `#`). | `000000` |
| `backgroundColor` | Background color in hex format (without `#`). | `ffffff` |
| `width` | Width of the SVG. | `450` |
| `height` | Height of the SVG. | `150` |
| `fontSize` | Font size of the text. | `28` |
| `typingSpeed` | Typing speed in seconds per character. | `0.5` |
| `deleteSpeed` | Deletion speed in seconds per character. | `0.5` |
| `pause` | Pause at the end of animation (ms). | `1000` |
| `letterSpacing` | Letter spacing in `em`. | `0.1` |
| `repeat` | Repeat the animation (`true`/`false`). | `true` |
| `center` | Center text horizontally (`true`/`false`). | `true` |
| `vCenter` | Center text vertically (`true`/`false`). | `true` |
| `border` | Show a border (`true`/`false`). | `true` |
| `cursorStyle` | Cursor style (`straight`, `underline`, `block`, `blank`). | `straight` |
| `deleteAfter` | Delete text after typing (`true`/`false`). | `false` |


## ⚡ Technologies

- [Next.js](https://nextjs.org/) – React framework for production  
- [React](https://reactjs.org/) – UI library  
- [TypeScript](https://www.typescriptlang.org/) – Typed superset of JS  
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework  
- [Lucide React](https://lucide.dev/) – Consistent icons  


## 🙏 Credits

This project was **inspired by** [readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg) by [DenverCoder1](https://github.com/DenverCoder1).  
A huge thank you for the original idea and foundation that made this possible ❤️.


## 🤝 Contributing

Contributions are welcome! Feel free to open issues or PRs.


## 📜 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
