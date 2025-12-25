#!/bin/bash

# Move to the project root
cd "$(dirname "$0")/.."

echo "----------------------------------------------------"
echo "🏗️  Drupal 10 DevOps: Smart Local Setup"
echo "----------------------------------------------------"

# 1. Check for DDEV Config
if [ ! -f ".ddev/config.yaml" ]; then
    echo "⚠️  No DDEV config found. Initializing..."
    ddev config --project-type=drupal10 --docroot=web --create-docroot --project-name=marathon
fi

# 2. Try to Start DDEV
if ! ddev start; then
    echo "❌ ERROR: DDEV failed to start. Check Docker version (25.0+ required)."
    exit 1
fi

# 3. Smart Condition Check
if ddev drush status --format=json 2>/dev/null | grep -q '"db-status": "Connected"'; then
    echo "📢 NOTICE: Site already setup. Running maintenance sync..."
    
    ddev composer install
    chmod +x scripts/*.sh
    ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
    
    ddev drush updb -y
    ddev drush cim -y
    ddev drush cr
else
    echo "🆕 NEW SITE DETECTED! Running full installation..."
    
    ddev composer install

    # Link Hooks
    if [ -d ".git" ]; then
        chmod +x scripts/*.sh
        ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
        echo "✅ Git hooks connected."
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
        echo "⚠️  No database dump found. Run 'ddev drush site:install' if needed."
    fi
fi

echo "----------------------------------------------------"
echo "🎉 SETUP COMPLETE!"
echo "🔗 Login Link:"
ddev drush uli
echo "----------------------------------------------------"