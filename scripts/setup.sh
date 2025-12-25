#!/bin/bash

# Move to the project root
cd "$(dirname "$0")/.."

echo "----------------------------------------------------"
echo "🏗️  Drupal 10 DevOps: Smart Local Setup"
echo "----------------------------------------------------"

# 1. Start the Environment (Always needed)
ddev start

# 2. CHECK: Is the site already installed?
# We check if Drush can successfully connect to a database
if ddev drush status --format=json 2>/dev/null | grep -q '"db-status": "Connected"'; then
    echo "📢 NOTICE: Your site is already setup."
    echo "💡 We are NOT going to re-install or import the database to protect your local data."
    echo "🔄 We will only update dependencies (Composer), sync hooks, and import new config."
    echo "----------------------------------------------------"
    
    # 3. Maintenance Sync for Existing Sites
    echo "📥 Installing/Updating Composer dependencies..."
    ddev composer install
    
    echo "🔗 Refreshing Git Hooks..."
    chmod +x scripts/*.sh
    ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
    
    echo "⚙️  Syncing current changes (Database updates & Config)..."
    ddev drush updb -y
    ddev drush cim -y
    ddev drush cr
    
    echo "✅ Site updated successfully!"

else
    echo "🆕 NEW SITE DETECTED!"
    echo "🚀 Performing full installation and database import..."
    echo "----------------------------------------------------"

    # 4. Full Installation for New Sites
    ddev composer install

    # Connect Hooks
    if [ -d ".git" ]; then
        chmod +x scripts/*.sh
        ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
        echo "✅ Hooks linked."
    fi

    # 5. Database Import
    DB_FILE=""
    if [ -f "db.sql.gz" ]; then DB_FILE="db.sql.gz"; 
    elif [ -f "data.sql.gz" ]; then DB_FILE="data.sql.gz"; fi

    if [ -n "$DB_FILE" ]; then
        echo "📥 Importing database from $DB_FILE..."
        ddev import-db --file="$DB_FILE"
        
        # 6. Final Sync
        ddev drush updb -y
        ddev drush cim -y
        ddev drush cr
        echo "✅ Full setup complete!"
    else
        echo "⚠️  ERROR: No database dump found (db.sql.gz). Skipping import."
        echo "💡 You may need to install Drupal manually using 'ddev drush site:install'."
    fi
fi

echo "----------------------------------------------------"
echo "🎉 PROCESS COMPLETE!"
echo "🔗 Login Link:"
ddev drush uli
echo "----------------------------------------------------"