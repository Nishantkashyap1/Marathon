#!/bin/bash

# Move to the project root
cd "$(dirname "$0")/.."

echo "----------------------------------------------------"
echo "🏗️  Drupal 10 DevOps: Smart Local Setup"
echo "----------------------------------------------------"

# 1. Start the Environment (Always needed)
ddev start

# 2. CHECK: Is the site already installed?
# This checks if the database is connected and has a 'users' table
if ddev drush status --format=json | grep -q '"db-status": "Connected"'; then
    echo "✨ Site already setup! Skipping database import..."
    
    # Just do a quick maintenance sync
    ddev composer install
    chmod +x scripts/*.sh
    ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
    
    echo "⚙️  Syncing current changes..."
    ddev drush updb -y
    ddev drush cim -y
    ddev drush cr
    
else
    echo "🆕 New setup detected! Running full installation..."

    # 3. Install PHP Dependencies
    ddev composer install

    # 4. Connect Git Hooks
    if [ -d ".git" ]; then
        chmod +x scripts/*.sh
        ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
        echo "✅ Hooks linked."
    fi

    # 5. Database Import (Only runs on new setup)
    DB_FILE=""
    if [ -f "db.sql.gz" ]; then DB_FILE="db.sql.gz"; 
    elif [ -f "data.sql.gz" ]; then DB_FILE="data.sql.gz"; fi

    if [ -n "$DB_FILE" ]; then
        echo "📥 Importing database from $DB_FILE..."
        ddev import-db --file="$DB_FILE"
        
        # 6. Drupal Sync (Only after fresh import)
        ddev drush updb -y
        ddev drush cim -y
        ddev drush cr
    else
        echo "⚠️  No database dump found. You may need to install Drupal manually."
    fi
fi

echo "----------------------------------------------------"
echo "✅ PROCESS COMPLETE!"
echo "🔗 Login Link:"
ddev drush uli
echo "----------------------------------------------------"