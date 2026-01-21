#!/bin/bash

# Source README
SRC="readme.md"

# Destinations
# Note: Case sensitivity matches the directory names found in parent dir
DEST_CMS="../cms/readme.md"
DEST_ADMIN="../cms-admin/README.md"
DEST_PORTAL="../cms-portal/README.md"

# Function to sync to destination
sync_to_dest() {
    local DEST=$1
    local DIR=$(dirname "$DEST")
    
    if [ -d "$DIR" ]; then
        cp "$SRC" "$DEST"
        echo "✅ Updated $DEST"
    else
        echo "⚠️  Skipped $DEST (Directory not found)"
    fi
}

echo "Syncing README.md from cms to other repositories..."

sync_to_dest "$DEST_CMS"
sync_to_dest "$DEST_ADMIN"
sync_to_dest "$DEST_PORTAL"

echo "Sync complete."
