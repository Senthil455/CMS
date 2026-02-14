#!/bin/bash
# Scripts to bundle Docker image and volume backup.
# Usage: ./scripts/full-backup.sh <image_name> <volume_name> [output_file]

set -e

IMAGE_NAME=$1
VOLUME_NAME=$2
OUTPUT_FILE=${3:-"full_backup_$(date +%Y%m%d).tar.gz"}

if [ -z "$IMAGE_NAME" ] || [ -z "$VOLUME_NAME" ]; then
    echo "Usage: $0 <image_name> <volume_name> [output_file]"
    exit 1
fi

echo "Creating bundled backup for image '$IMAGE_NAME' and volume '$VOLUME_NAME'..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)

# 1. Save Image
echo "Saving image $IMAGE_NAME..."
docker save -o "$TEMP_DIR/image.tar" "$IMAGE_NAME"

# 2. Backup Volume
echo "Backing up volume $VOLUME_NAME..."
docker run --rm -v "$VOLUME_NAME":/volume -v "$TEMP_DIR":/backup alpine tar cvf /backup/volume.tar /volume

# 3. Create Archive
echo "Creating archive $OUTPUT_FILE..."
tar -czf "$OUTPUT_FILE" -C "$TEMP_DIR" image.tar volume.tar

# Cleanup
rm -rf "$TEMP_DIR"

echo "Backup complete: $OUTPUT_FILE"
