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