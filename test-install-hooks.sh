#!/bin/bash

# Test the install-hooks API endpoint

# Create a test directory
TEST_DIR="/tmp/test-claude-hooks-$(date +%s)"
mkdir -p "$TEST_DIR"

echo "Testing hook installation to: $TEST_DIR"

# Make the API request
curl -X POST http://localhost:4000/api/install-hooks \
  -H "Content-Type: application/json" \
  -d '{
    "targetPath": "'"$TEST_DIR"'",
    "displayName": "My Test Project",
    "serverUrl": "http://localhost:4000"
  }' | jq .

# Check if files were created
echo ""
echo "Checking created files..."

if [ -f "$TEST_DIR/.claude/settings.json" ]; then
  echo "✅ Settings file created"
  echo "Settings preview:"
  jq '.hooks.PreToolUse' "$TEST_DIR/.claude/settings.json"
else
  echo "❌ Settings file not found"
fi

if [ -d "$TEST_DIR/.claude/hooks" ]; then
  echo "✅ Hooks directory created"
  echo "Hook files:"
  ls -la "$TEST_DIR/.claude/hooks/"
else
  echo "❌ Hooks directory not found"
fi

# Clean up
echo ""
echo "Cleaning up test directory..."
rm -rf "$TEST_DIR"
echo "Done!"