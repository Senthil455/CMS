# CMS Portal

This project is the portal interface for **CMS**.

For a detailed overview of the system architecture, please refer to the [CMS Architecture Wiki](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md).

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run development server**:
    ```bash
    npm run dev
    ```
    This will start the Vite development server, usually at `http://127.0.0.1:5173` (or as configured).

## Publish

To build and publish the portal to the backend static files directory:

```bash
npm run publish-to-lib
```

**What this does:**
1.  Builds the project using `vite build`.
2.  Cleans the target directory: `../cms/server/CMS/wwwroot/portal`.
3.  Copies the new build artifacts to the target directory.
4.  Stages the changes in git for the backend repository.
