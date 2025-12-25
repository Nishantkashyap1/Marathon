#!/bin/bash

# Move to the project root
cd "$(dirname "$0")/.."

echo "----------------------------------------------------"
echo "🏗️  Drupal 10 DevOps: Smart Local Setup"
echo "----------------------------------------------------"

# 1. Check for DDEV Config - If missing, create it!
if [ ! -f ".ddev/config.yaml" ]; then
    echo "⚠️  No DDEV config found. Initializing Drupal 10 config..."
    ddev config --project-type=drupal10 --docroot=web --create-docroot --project-name=marathon
fi

# 2. Try to Start DDEV
echo "🚀 Starting DDEV containers..."
if ! ddev start; then
    echo "❌ ERROR: DDEV failed to start."
    echo "💡 Please update your Docker to version 25.0+ or ensure Docker is running."
    exit 1
fi

# 3. CHECK: Is the site already installed?
if ddev drush status --format=json 2>/dev/null | grep -q '"db-status": "Connected"'; then
    echo "📢 NOTICE: Your site is already setup."
    echo "🔄 Syncing dependencies and hooks only..."
    echo "----------------------------------------------------"
    
    ddev composer install
    chmod +x scripts/*.sh
    ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
    
    ddev drush updb -y
    ddev drush cim -y
    ddev drush cr
    
else
    echo "🆕 NEW SITE DETECTED! Running full installation..."
    echo "----------------------------------------------------"

    ddev composer install

    if [ -d ".git" ]; then
        chmod +x scripts/*.sh
        ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
    fi

    # Database Import
    DB_FILE=""
    if [ -f "db.sql.gz" ]; then DB_FILE="db.sql.gz"; 
    elif [ -f "data.sql.gz" ]; then DB_FILE="data.sql.gz"; fi

    if [ -n "$DB_FILE" ]; then
        echo "📥 Importing database from $DB_FILE..."
        ddev import-db --file="$DB_FILE"
        ddev drush updb -y
        ddev drush cim -y
        ddev drush cr
    else
        echo "⚠️  No database dump found (db.sql.gz)."
    fi
fi

echo "----------------------------------------------------"
echo "🎉 PROCESS COMPLETE!"
echo "🔗 Login Link:"
ddev drush uli
echo "----------------------------------------------------"