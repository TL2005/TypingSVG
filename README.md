<p  align="center">
  <h3 align="center">Typing SVG</h3>
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

There are other typing SVG projects out there — but this one takes it further:

- **Multi-line Customization**: Customize every line individually.
- **Multi-line input**: Write multiple lines, not just one.  
- **True text formatting**: Supports multiple spaces, line breaks, and precise alignment.  
- **Flexible deletion**: Customize `deleteSpeed` and decide whether text should erase or not. 
- **More cursor styles**: Straight, underline, block, or even blank.  
- **Fine-grained control**: Letter spacing, pause duration, repeat toggle, borders, and more.  

In short: **more customization, more control, and more creativity** 🎨.


## Live Demo & Preview
[![Demo](https://github.com/user-attachments/assets/c7633619-3422-4066-9953-4e594ddd7b75)](https://typingsvg.vercel.app/)
link: https://typingsvg.vercel.app/

## How to Use
1. Visit the site: [typingsvg.vercel.app](https://typingsvg.vercel.app/)
2. Customize your SVG with text, speed, colors, and styles.
3. Copy the URL or download the file, then use it anywhere (README, profile, blog, etc.).
4. Star this repo ~ 😄

## Deploy It Yourself
Since this project is hosted on a free Vercel account, resources are limited. To ensure optimal performance and availability, it's recommended to deploy Typing SVG on your own. Here's how:

1. Sign in or create a Vercel account at [vercel](https://vercel.com/).

2. Click the "Deploy to Vercel" button below

    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FwhiteSHADOW1234%2FTypingSVG)

3. Follow the prompts to deploy the application to your Vercel account.



## Example Usage
Here are some examples of how to use this project:

[![whiteSHADOW1234](https://github.com/whiteSHADOW1234.png?size=60)](https://github.com/whiteSHADOW1234 "whiteSHADOW1234")

- Feel free to open a pull request and add your own examples!


## Options

The SVG is generated via the `/api/svg` endpoint.  
Customize it with query parameters:

| Parameter | Description | Default |
|---|---|---|
| `text` | Text to be typed. Use `;` to separate lines. | `Hello, World!;And Emojis! 😀🚀` |
| `font` | Font family for the text. | `Courier Prime` |
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
| `deleteAfter` | Delete text after typing (`true`/`false`). | `true` |

**Example:**  
```
https://typingsvg.vercel.app/api/svg?text=Hello%2C+World%21&font=Courier%20Prime&color=%23000000&width=450&height=150&typingSpeed=0.07&pause=1000&letterSpacing=0.1&repeat=true&backgroundColor=%23ffffff&fontSize=28&center=true&vCenter=true&border=true&cursorStyle=straight&deleteAfter=false&deleteSpeed=0.07
```

##  Credits & Inspiration

This project stems from a deep admiration for [DenverCoder1’s readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg)
—a clever, widely embraced tool that brought typing animations to README files. While using it, I encountered several limitations: the lack of genuine multi-line support, a fixed delete speed, and handling blank spaces felt awkward—requiring workarounds that disrupted the creative flow. That frustration sparked the idea for **Typing SVG**—a smoother, more flexible evolution designed to bring back control and clarity to formatting.

A heartfelt, huge thank you to [DenverCoder1](https://github.com/DenverCoder1) for sparking the idea. Typing SVG builds upon that original spark. ❤️



## Contributing

We welcome contributions to Typing SVG! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for more details on how to get started, report bugs, request features, and submit pull requests.


## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
