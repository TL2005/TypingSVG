# Contributing to Typing SVG

Thank you for your interest in contributing to Typing SVG! We appreciate your help in making this project better.

## Table of Contents

- [Getting Started](#getting-started)
- [Setup Environment](#setup-environment)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Requesting Features](#requesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Code of Conduct](#code-of-conduct)

## Getting Started

To get a local copy of the project up and running, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/whiteSHADOW1234/typing-svg.git
    cd typing-svg
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    This will start the development server at `http://localhost:3000`.

## Setup Environment

To ensure a consistent development environment, please make sure you have the following installed:

-   **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
-   **npm**: Version 9 or higher (comes with Node.js).
-   **Git**: For version control.

It's recommended to use a Node.js version manager like `nvm` (Node Version Manager) to easily switch between Node.js versions.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on our [GitHub Issues page](https://github.com/whiteSHADOW1234/typing-svg/issues). When reporting a bug, please include:

-   A clear and concise description of the bug.
-   Steps to reproduce the behavior.
-   Expected behavior.
-   Screenshots or error messages if applicable.
-   Your operating system and browser.

### Requesting Features

If you have an idea for a new feature or enhancement, please open an issue on our [GitHub Issues page](https://github.com/whiteSHADOW1234/typing-svg/issues). Describe your idea clearly and explain why you think it would be a valuable addition to the project.

### Submitting Pull Requests

1.  **Fork the repository** and clone your forked repository.
2.  **Create a new branch** for your feature or bug fix:

    ```bash
    git checkout -b feat/your-feature-name
    # or
    git checkout -b fix/your-bug-fix-name
    # or
    git checkout -b chore/your-chore-name
    ```

3.  **Make your changes** and ensure they adhere to the project's coding style.

4.  **Run the linter** to catch any formatting or style issues:

    ```bash
    npm run lint
    ```

5.  **Commit your changes** following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps with automated versioning and release notes.

6.  **Push your branch** to your forked repository:

    ```bash
    git push origin feat/your-feature-name
    ```

7.  **Open a Pull Request** to the `main` branch of the original repository. Provide a detailed description of your changes.

### Commit Guidelines

This project adheres to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This means your commit messages should follow a specific format, which helps in:

-   **Automated Versioning:** Automatically determining the next version number (major, minor, or patch).
-   **Generating Changelogs:** Creating clear and consistent release notes.
-   **Better Readability:** Making the commit history easier to understand.

**Commit Message Format:**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

-   `feat`: A new feature
-   `fix`: A bug fix
-   `docs`: Documentation only changes
-   `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc.)
-   `refactor`: A code change that neither fixes a bug nor adds a feature
-   `perf`: A code change that improves performance
-   `test`: Adding missing tests or correcting existing tests
-   `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
-   `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
-   `chore`: Other changes that don't modify src or test files
-   `revert`: Reverts a previous commit

**Example:**

```
feat: add new option for cursor style

This commit introduces a new `cursorStyle` option that allows users to choose
between 'straight', 'underline', 'block', and 'blank' cursor styles.

BREAKING CHANGE: The previous `cursor` parameter has been removed.
```

For more details, please refer to the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).
