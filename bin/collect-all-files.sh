#!/bin/bash
set -euo pipefail

# collect-all-files.sh
# Outputs newline-separated list of all MDX files (relative to content/)

echo "Collecting all MDX files for full sync" >&2

if [ ! -d "content" ]; then
    echo "Error: content directory not found" >&2
    exit 1
fi

# Find all MDX files
find content -type f -name "*.mdx" | \
    sed 's|^content/||' | \
    sort | \
    while read -r file; do
        if [ -n "$file" ] && [ -f "content/$file" ]; then
            echo "$file"
            echo "  found: $file" >&2
        fi
    done

# Count and report
file_count=$(find content -type f -name "*.mdx" | wc -l)
echo "Total files found: $file_count" >&2 