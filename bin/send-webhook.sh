#!/bin/bash
set -euo pipefail

# send-webhook.sh <webhook_url> [auth_token]
# Reads JSON payload from stdin, sends to webhook with retries

usage() {
    echo "Usage: $0 <webhook_url> [auth_token]" >&2
    echo "Example: $0 'https://example.com/webhook' 'Bearer token123'" >&2
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

WEBHOOK_URL="$1"
AUTH_TOKEN="${2:-}"
MAX_RETRIES=3
RETRY_DELAY=2

echo "Sending webhook to $WEBHOOK_URL" >&2

# Read payload from stdin
payload=$(cat)

if [ -z "$payload" ]; then
    echo "Error: No payload received from stdin" >&2
    exit 1
fi

# Validate JSON
if ! echo "$payload" | jq . >/dev/null 2>&1; then
    echo "Error: Invalid JSON payload" >&2
    exit 1
fi

echo "Payload size: $(echo "$payload" | wc -c) bytes" >&2

# Build curl command
curl_args=(
    -X POST
    -H "Content-Type: application/json"
    -d "$payload"
    --fail
    --show-error
    --silent
)

# Add auth header if provided
if [ -n "$AUTH_TOKEN" ]; then
    curl_args+=(-H "Authorization: $AUTH_TOKEN")
fi

# Retry logic
for attempt in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $attempt/$MAX_RETRIES..." >&2
    
    if response=$(curl "${curl_args[@]}" "$WEBHOOK_URL" 2>&1); then
        echo "Success! Response:" >&2
        echo "$response" >&2
        echo "$response"
        exit 0
    else
        echo "Attempt $attempt failed: $response" >&2
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            echo "Retrying in ${RETRY_DELAY}s..." >&2
            sleep $RETRY_DELAY
            # Exponential backoff
            RETRY_DELAY=$((RETRY_DELAY * 2))
        fi
    fi
done

echo "Error: All $MAX_RETRIES attempts failed" >&2
exit 1 