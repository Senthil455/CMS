# Build Your App with Zero Cost 🚀

Building a modern, AI-powered application doesn't have to be expensive. By leveraging free-tier cloud services and powerful all-in-one Docker solutions, you can launch your project for **$0**.

---

## 1. The All-in-One Solution (Docker)

Most modern stacks require a separate backend, API layer, and database, each potentially incurring costs. However, there are many Docker-based solutions available that bundle these components together to help you stay within the "Free Tier" limits of most cloud providers.

One such example is **CMS** (`cms-mono`), which provides:

-   **Backend Admin Panel:** A clear, ready-to-use interface to manage your content and data out-of-the-box.
-   **Database:** Built-in SQLite database support, removing the need for an external database service.
-   **API:** Automatically generated RESTful APIs to connect to any frontend.
-   **Custom Frontends:** You aren't locked in! You can easily build your own app using modern tools like React, Vite, and Antigravity. [See the Vite + React + Antigravity Example here](https://github.com/Senthil455/CMS/blob/main/docs/wiki/Vite-React-Antigravity-Example).


---

## 2. Free AI Power (Gemini)

Adding AI capabilities to your application can also be free. Many tools and platforms now integrate directly with AI providers offering generous free tiers.

-   **Zero Cost AI:** Google Gemini offers a free tier that is excellent for indie projects. 
-   **Free API Key:** You can acquire a Gemini API key for free from [Google AI Studio](https://aistudio.google.com/).
-   **Integration:** Solutions like CMS allow you to simply input your Gemini key to start generating content and managing data intelligently.

---

## 3. Fast Deployment (Free Docker Hosting)

Many cloud providers offer a free tier for running Docker containers. Providers like **Koyeb**, **Render**, or **Fly.io** often have free plans that are perfect for all-in-one images:

1.  **Register:** Create a free account on your chosen provider.
2.  **Source:** Point the deployment to your chosen public Docker Hub image (e.g., `senthil455/cms-mono:latest`).
3.  **Config:** Map the appropriate exposed port (e.g., `5000` to the public port).
4.  **Go:** Your application is now live at the provider's URL.

---

## 4. Advanced: Oracle Cloud Free Tier (VPS)

For those who want more control and a robust Virtual Private Server (VPS), Oracle Cloud provides one of the most generous free tiers available.

### 4.1 Networking Setup
- Create a **Virtual Cloud Network (VCN)**.
- Configure an **Ingress Rule** to allow traffic on ports `80` (HTTP) and `443` (HTTPS).

### 4.2 Create Compute Instance
- Select a **Compute Instance**.
- **Specs:** Use the "Always Free" ARM-based Ampere A1 shapes (up to 4 OCPUs and 24 GB of RAM).
- **OS:** Choose **Rocky Linux** or Ubuntu.

### 4.3 Environment Setup

Here is the cleaned version (removed sections 6 and 7), formatted so you can copy directly:

---

# Install & Setup Nginx on Rocky Linux

## 1. Update System (Recommended)

```bash
sudo dnf update -y
```

---

## 2. Install Nginx

```bash
sudo dnf install nginx -y
```

Verify installation:

```bash
nginx -v
```

---

## 3. Start and Enable Nginx

Start service:

```bash
sudo systemctl start nginx
```

Enable on boot:

```bash
sudo systemctl enable nginx
```

Check status:

```bash
sudo systemctl status nginx
```

---

## 4. Disable SELinux (If Blocking Access)

### Temporarily disable (until reboot):

```bash
sudo setenforce 0
```

Check status:

```bash
getenforce
```

---

### Permanently disable:

Edit configuration file:

```bash
sudo vi /etc/selinux/config
```

Change:

```
SELINUX=enforcing
```

To:

```
SELINUX=disabled
```

Reboot:

```bash
sudo reboot
```

---

## 5. Verify Installation

Open browser:

```
http://your_server_ip
```

You should see the Nginx welcome page.

### 4.4 Deploy with Docker
Create a `docker-compose.yml` file on your server to run your chosen solution (using CMS `cms-mono` as an example):

```yaml
version: '3.8'
services:
  app:
    image: senthil455/cms-mono:latest
    ports:
      - "5000:5000"
    volumes:
      - ./data:/data
    restart: always
```

Run it with `docker compose up -d`. Your powerful, production-ready application is now running on a professional cloud infrastructure for free!
