# Data Migration Guide

This guide explains how to migrate your data from a local Docker environment to a remote server. This process involves backing up your data from local Docker volumes, transferring the backup files to your server, and restoring them.

## Prerequisites

- Local machine with Docker installed and running.
- Remote server with Docker installed and running.
- SSH access to the remote server.
- `rsync` or `scp` for file transfer.

## 1. Migrating PostgreSQL Data

### Step 1: Backup Local Database

Run the following command to dump your local PostgreSQL database. Replace `mono-deploy-db-1` with your actual running container name (check with `docker ps`).

```bash
docker exec -t mono-deploy-db-1 pg_dump -U postgres cms > cms_backup.sql
```

### Step 2: Transfer Backup to Server

Transfer the `cms_backup.sql` file to your remote server.

```bash
scp cms_backup.sql user@remote_server:/path/to/backup/
```

### Step 3: Restore Database on Server

SSH into your remote server and copy the backup file into the running PostgreSQL container.

```bash
docker cp cms_backup.sql mono-deploy-db-1:/cms_backup.sql
```

Then, restore the database:

```bash
docker exec -it mono-deploy-db-1 psql -U postgres -d cms -f /cms_backup.sql
```

**Note**: If the database already exists and has data, you might want to drop and recreate it before restoring, or use `pg_restore` depending on your backup format. The above command appends/overwrites existing data.

## 2. Migrating SQLite Data

If you are using SQLite instead of PostgreSQL, the data is stored in a file within the volume (typically mapped to `/app/packages/service/data`).

### Step 1: Identify Volume Path

Find where the SQLite data is stored.

### Step 2: Copy SQLite File from Container

```bash
docker cp mono-deploy-app-1:/app/packages/service/data/sqlite.db ./sqlite.db
```

### Step 3: Transfer to Server

```bash
scp sqlite.db user@remote_server:/path/to/destination/
```

### Step 4: Stop the Server Container

To avoid corruption, stop the container on the server before replacing the database file.

```bash
docker stop mono-deploy-app-1
```

### Step 5: Restore on Server

Copy the file back into the container on the server.

```bash
docker cp sqlite.db mono-deploy-app-1:/app/packages/service/data/sqlite.db
```

### Step 6: Restart the Container

```bash
docker start mono-deploy-app-1
```

## 3. Migrating Configuration Files

Sometimes you have configuration files in volumes (e.g., `cms_config`).

### Step 1: Copy Config from Container

```bash
docker cp mono-deploy-app-1:/config/cms.settings.json ./cms.settings.json
```

### Step 2: Transfer to Server

```bash
scp cms.settings.json user@remote_server:/path/to/destination/
```

### Step 3: Restore on Server

```bash
docker cp cms.settings.json mono-deploy-app-1:/config/cms.settings.json
```

## Troubleshooting

- **Permission Denied**: Ensure the user running the restore command has write permissions in the target directory inside the container.
- **Version Mismatch**: Ensure the PostgreSQL version on the server matches or is newer than the local version.

## 4. Can I Dump Image and Volume Together?

Docker treats **Images** (application code/libraries) and **Volumes** (persistent data) as separate entities. Images are immutable, while volumes are mutable. There is no single native command to "dump" both at once, but you can create a **Bundled Backup** by scripting the process.

### The "Bundle" Strategy

1.  **Save the Image**: Use `docker save` to export the image to a tar file.
2.  **Archive the Volume**: Use a temporary container to `tar` the volume contents.
3.  **Combine**: Zip them into a single archive for transfer.

### Automated Script

We have provided a helper script in `scripts/full-backup.sh` (if you are on Mac/Linux) to automate this.

```bash
# Usage: ./scripts/full-backup.sh <container_name> <volume_name>
./scripts/full-backup.sh mono-deploy-app-1 sqlite_data
```

### Manual Steps

If you prefer to do it manually:

#### 1. Save Image
```bash
docker save -o my-image.tar cms-mono-deploy:latest
```

#### 2. Backup Volume
```bash
docker run --rm -v sqlite_data:/volume -v $(pwd):/backup alpine tar cvf /backup/my-volume.tar /volume
```

#### 3. Archive Both
```bash
tar cvzf full-backup.tar.gz my-image.tar my-volume.tar
```

#### 4. Restore on Server
Transfer `full-backup.tar.gz` to the server, extract it, and then:

1.  **Load Image**: `docker load -i my-image.tar`
2.  **Restore Volume**:
    ```bash
    docker volume create sqlite_data
    docker run --rm -v sqlite_data:/volume -v $(pwd):/backup alpine tar xvf /backup/my-volume.tar -C /
    ```
