# Building with Vite, React, and AI (Antigravity/Cursor)

CMS is designed to be fully headless. This means you can run CMS as your robust backend and build your frontend using your favorite tools like **Vite** and **React**, while leveraging AI coding agents like **Antigravity** or **Cursor** to write the code for you.

This guide walks you through setting up a modern frontend stack connected to a CMS backend.

## 1. Start the CMS Backend

First, ensure your CMS backend is running via Docker. This provides all your APIs, database, and the admin portal without needing to write any backend code.

```bash
docker run -d \
  --name cms \
  -p 5000:5000 \
  -v cms_data:/data \
  -e DATABASE_PROVIDER=0 \
  -e "CONNECTION_STRING=Data Source=/data/cms.db" \
  -e CMS_DATA_PATH=/data \
  -e "DATABASE_URL=file:/data/app.db" \
  senthil455/cms-mono:latest

```

Open **http://localhost:5000/app** to set up your entities (e.g., "Articles", "Products", "Tasks") using the AI schema builder.

## 2. Initialize your Vite + React Project

Open a new terminal and create a new Vite project:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

## 3. Configure the API Connection

Since your React app will run on a different port than CMS during development, you need to set up a proxy to avoid CORS issues. Edit your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

Now, any request to `/api` from your React app will be flawlessly forwarded to CMS.

## 4. Build the UI with Antigravity

With your backend running and frontend initialized, start your React dev server:

```bash
npm run dev
```

Now, use your AI development agent (like Antigravity or Cursor) to build the application. Try giving the agent prompts like these:

- *"Create a beautiful `ProductList` component that fetches data from `/api/products` and displays it in a responsive grid. Make it look modern and sleek."*
- *"Build an `ArticleDetail` page that takes an ID from the URL, fetches `/api/articles/{id}`, and renders the title and content with good typography."*
- *"Generate an API service file `src/services/api.ts` using `fetch` to handle standard CRUD operations against our `/api` endpoints."*

### Tips for Better AI Prompts

- **Be specific about endpoints**: Tell the AI exactly where to fetch data based on the entities you created in CMS (e.g., `/api/{entity-name}`).
- **Share your schemas**: If you created a `Product` entity with `title` and `price`, explicitly tell the AI about these fields in your prompt so it knows the exact data structure.
- **Request specific styling**: Mention if you want vanilla CSS, Tailwind CSS, or a specific component library. By default, agents are great at writing custom, modern CSS if you ask them to "make it look premium".

## 5. Enable CORS (If Running Frontend Separately)

If you are not using the Vite proxy from Step 3 and want your frontend (e.g., `http://localhost:5173`) to talk directly to CMS (e.g., `http://localhost:5000`), you must enable Cross-Origin Resource Sharing (CORS).

1. Open CMS at `http://localhost:5000/app`.
2. Go to the **Settings** page.
3. Find the **CORS Configuration** section.
4. Add your frontend's URL (`http://localhost:5173`) to the allowed origins.

## 6. Deploying your React App

CMS includes a built-in static file server, making deployment incredibly simple. You don't need a separate host (like Vercel or Netlify) for your frontend—CMS can serve your React app directly!

1. Build your Vite project for production:
   ```bash
   npm run build
   ```
2. Compress the contents of the generated `dist` folder into a `.zip` file. (Make sure you zip the *contents* of the folder, so `index.html` is at the root of the zip archive).
3. Open CMS at `http://localhost:5000/app`.
4. Go to **Settings** -> **Frontend Apps**.
5. Upload your `dist.zip` file.

Now, your entire full-stack application (frontend and backend APIs) is served from a single CMS server instance!

## 7. Iterate Rapidly

The true power of this stack is your development velocity:
1. **Need a new feature?** Ask CMS (via the `http://localhost:5000/app` UI) to generate new entities, relationships, or fields.
2. **Need to show it?** Ask Antigravity to create or update the React components to consume the new endpoints.
3. **Ready to ship?** Build, zip, and upload to CMS.

This clean separation—AI handles the backend in CMS, AI handles the frontend in React—gives you the ultimate full-stack development experience with zero boilerplate.
