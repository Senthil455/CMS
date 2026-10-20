# CMS Portal

This project is the user portal interface for **CMS**.

For a detailed overview of the system architecture, please refer to the [CMS Architecture Wiki](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Architecture.md).

## Setup

1.  **Install dependencies** from the repository root:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev:portal
    ```
    This starts the Vite development server for the portal. The production base path is `/portal/`.

## Build

To build the portal for production from the repository root:

```bash
npm run build --workspace=@cms/portal
```

The build output is written to `packages/portal/dist` and is served by the CMS deployment under `/portal/`.
