#!/bin/bash

# Test script for the /api/install-hooks endpoint

echo "Testing hook installer endpoint..."

# Test 1: Valid installation
echo -e "\n1. Testing valid installation..."
curl -s -X POST http://localhost:4000/api/install-hooks \
  -H "Content-Type: application/json" \
  -d '{
    "targetPath": "/tmp/test-hooks-valid",
    "displayName": "Test Valid Project",
    "serverUrl": "http://localhost:4000"
  }' | jq '.success'

# Test 2: Missing required fields
echo -e "\n2. Testing missing fields..."
curl -s -X POST http://localhost:4000/api/install-hooks \
  -H "Content-Type: application/json" \
  -d '{"targetPath": "/tmp/test"}' | jq '.error'

# Test 3: Non-existent directory
echo -e "\n3. Testing non-existent directory..."
curl -s -X POST http://localhost:4000/api/install-hooks \
  -H "Content-Type: application/json" \
  -d '{
    "targetPath": "/non/existent/path",
    "displayName": "Test",
    "serverUrl": "http://localhost:4000"
  }' | jq '.error'

echo -e "\nAll tests completed!"