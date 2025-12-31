# Cms

## Docker Deployment (Integrated with CMS)

To build and run Cms and CMS together in a single container, follow these steps:

```bash
# 1. Go to your repos directory
cd /Users/senthil455/repos

# 2. Build using the Cms Dockerfile
docker build -t cms-integrated -f cms/Dockerfile .

# 3. Run the container
docker run -p 3001:3001 -p 5000:5000 cms-integrated
```

The application will be available at:
- **Frontend/API**: `http://localhost:3001/app`
- **CMS**: `http://localhost:5000`
