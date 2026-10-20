# CMS Admin

CMS Admin is the admin portal for [CMS](https://github.com/Senthil455/CMS). It provides a user-friendly interface for managing content, schemas, and settings within the CMS ecosystem.

## Architecture

For a detailed overview of the system architecture, please refer to the [CMS Architecture Wiki](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md).

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS recommended)
- npm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Senthil455/CMS.git
    cd CMS
    ```

2.  **Install dependencies from the repository root:**

    ```bash
    npm install
    ```

3.  **Start the admin development server:**

    ```bash
    npm run dev:admin
    ```

    This starts the Vite development server for the admin app. The production base path is `/admin/`.

## Features

-   **Customizable Branding:** The app allows users to change the logo and other branding elements to match their organization's identity.
-   **Schema Management:** Create and modify content schemas visually.
-   **Content Management:** Efficient tools for creating and editing content.

## Build

To build the admin app for production from the repository root:

```bash
npm run build --workspace=@cms/admin
```
