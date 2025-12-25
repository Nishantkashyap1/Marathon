#!/bin/bash

# This script runs after a 'git pull' to sync the local DDEV environment.
echo "----------------------------------------------------"
echo "🚀 Git Pull Detected: Updating DDEV Environment..."
echo "----------------------------------------------------"

# Run updates inside DDEV
ddev composer install
ddev drush cim -y
ddev drush cr

echo "----------------------------------------------------"
echo "✅ DDEV is now synced with the latest code."
echo "----------------------------------------------------"


# Check if the database is missing after the pull
if ! ddev drush status --format=json 2>/dev/null | grep -q '"db-status": "Connected"'; then
    echo ""
    echo "----------------------------------------------------"
    echo "🚨 NEW SITE DETECTED (No Database Found) 🚨"
    echo "To fully set up your local environment, please run:"
    echo "👉 sh scripts/setup.sh"
    echo "----------------------------------------------------"
    echo ""
fi