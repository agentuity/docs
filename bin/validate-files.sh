#!/bin/bash
set -euo pipefail

# validate-files.sh
# Reads file paths from stdin, validates they exist and are safe
# Outputs only valid file paths

echo "Validating file paths" >&2

valid_count=0
invalid_count=0

# Read all input into an array first
mapfile -t files

for file in "${files[@]}"; do
    # Skip empty lines
    if [ -z "$file" ]; then
        continue
    fi
    
    # Handle REMOVED: prefix
    if [[ "$file" == REMOVED:* ]]; then
        echo "$file"
        ((valid_count++))
        continue
    fi
    
    # Security check: prevent path traversal
    if [[ "$file" == *".."* ]] || [[ "$file" == "/"* ]]; then
        echo "Warning: Unsafe path detected, skipping: $file" >&2
        ((invalid_count++))
        continue
    fi
    
    # Check if file exists
    if [ -f "content/$file" ]; then
        echo "$file"
        echo "  ✓ $file" >&2
        ((valid_count++))
    else
        echo "Warning: File not found, skipping: $file" >&2
        ((invalid_count++))
    fi
done

echo "Validation complete: $valid_count valid, $invalid_count invalid" >&2

# Exit with error if no valid files
if [ "$valid_count" -eq 0 ]; then
    echo "Error: No valid files found" >&2
    exit 1
fi 