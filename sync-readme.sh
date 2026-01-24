#!/bin/bash

# Source README
SRC="readme.md"

# Destinations
# Note: Case sensitivity matches the directory names found in parent dir
DEST_CMS="../cms/readme.md"
DEST_ADMIN="../cms-admin/README.md"
DEST_PORTAL="../cms-portal/README.md"

echo "Syncing README.md from cms to other repositories..."

# Copy to cms
if [ -d "../cms" ]; then
    cp "$SRC" "$DEST_CMS"
    echo "✅ Updated $DEST_CMS"
else
    echo "⚠️  Skipped $DEST_CMS (Directory not found)"
fi

# Copy to CMS Admin
if [ -d "../CMS Admin" ]; then
    cp "$SRC" "$DEST_ADMIN"
    echo "✅ Updated $DEST_ADMIN"
else
    echo "⚠️  Skipped $DEST_ADMIN (Directory not found)"
fi

# Copy to CMS Portal
if [ -d "../CMS Portal" ]; then
    cp "$SRC" "$DEST_PORTAL"
    echo "✅ Updated $DEST_PORTAL"
else
    echo "⚠️  Skipped $DEST_PORTAL (Directory not found)"
fi

echo "Sync complete."
