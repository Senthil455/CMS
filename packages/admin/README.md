# CMS Admin

CMS Admin is the admin portal for [CMS](https://github.com/Senthil455/CMS). It provides a user-friendly interface for managing content, schemas, and settings within the CMS ecosystem.

## Architecture

For a detailed overview of the system architecture, please refer to the [CMS Architecture Wiki](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md).

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [pnpm](https://pnpm.io/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Senthil455/CMS/CMS Admin.git
    cd CMS Admin
    ```

2.  **Initialize Submodules:**

    The core logic of the application resides in the `libs` submodule. You must initialize it before proceeding.

    ```bash
    git submodule update --init --recursive
    ```

    > **Note:** The `libs/cms-admin-sdk` submodule contains the main business logic and reusable components.

3.  **Install Dependencies:**

    ```bash
    pnpm install
    ```

## Features

-   **Customizable Branding:** The app allows users to change the logo and other branding elements to match their organization's identity.
-   **Schema Management:** Create and modify content schemas visually.
-   **Content Management:** efficient tools for creating and editing content.

## Build and Publish

Scripts for building and publishing are defined in `package.json`.

### Build

To build the application for production:

```bash
npm run build
```

This will compile the TypeScript code and bundle the application using Vite.

### Publish to Library

To publish the package to the library:

```bash
npm run publish-to-lib
```
