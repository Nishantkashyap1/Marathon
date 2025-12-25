#!/bin/bash

# Move to the project root (one level up from scripts/)
cd "$(dirname "$0")/.."

echo "----------------------------------------------------"
echo "🏗️  Drupal 10 DevOps: Full Automatic Local Setup"
echo "----------------------------------------------------"

# 1. Ensure DDEV is configured
if [ ! -f ".ddev/config.yaml" ]; then
    echo "⚠️  No DDEV config found. Running initial config..."
    ddev config --project-type=drupal10 --docroot=web --create-docroot
else
    echo "✅ DDEV configuration found."
fi

# 2. Start the Environment
echo "🚀 Starting DDEV containers..."
ddev start

# 3. Install PHP Dependencies
echo "📥 Installing Composer dependencies..."
ddev composer install

# 4. Connect Git Hooks
echo "🔗 Connecting Git Automation Hooks..."
if [ -d ".git" ]; then
    chmod +x scripts/*.sh
    ln -sf ../../scripts/post-merge.sh .git/hooks/post-merge
    echo "   ✅ Hooks linked successfully."
else
    echo "   ⚠️  Not a Git repository. Skipping hook linking."
fi

# 5. Database Import
DB_FILE=""
if [ -f "db.sql.gz" ]; then DB_FILE="db.sql.gz"; 
elif [ -f "data.sql.gz" ]; then DB_FILE="data.sql.gz"; fi

if [ -n "$DB_FILE" ]; then
    echo "📥 Importing database from $DB_FILE..."
    ddev import-db --file="$DB_FILE"
else
    echo "⚠️  No database dump found. Skipping import."
fi

# 6. Final Drupal Sync (The "DevOps Trifecta")
echo "⚙️  Syncing Drupal (Updates -> Config -> Cache)..."

# Step A: Run database updates (schema changes)
ddev drush updb -y

# Step B: Import Configuration (Apply YAML files to DB)
echo "📥 Importing configuration (drush cim)..."
ddev drush cim -y

# Step C: Rebuild Cache
ddev drush cr

echo "----------------------------------------------------"
echo "✅ SETUP COMPLETE!"
echo "🔗 Login Link:"
ddev drush uli
echo "----------------------------------------------------"
echo "💻 Run 'ddev launch' to open the site in your browser."