#!/usr/bin/env node

// Test script for the install-hooks API endpoint
const fs = require('fs');
const path = require('path');

async function testInstallHooks() {
  // Create a temporary test directory
  const testDir = path.join(__dirname, 'test-project-' + Date.now());
  fs.mkdirSync(testDir, { recursive: true });
  
  console.log('Created test directory:', testDir);
  
  try {
    // Make the API request
    const response = await fetch('http://localhost:4000/api/install-hooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetPath: testDir,
        displayName: 'Test Project 123',
        serverUrl: 'http://localhost:4000'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result);
      
      // Verify files were created
      const settingsPath = path.join(testDir, '.claude', 'settings.json');
      const hooksDir = path.join(testDir, '.claude', 'hooks');
      
      if (fs.existsSync(settingsPath)) {
        console.log('✅ Settings file created');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        console.log('Settings preview:', JSON.stringify(settings.hooks.PreToolUse, null, 2));
      } else {
        console.log('❌ Settings file not found');
      }
      
      if (fs.existsSync(hooksDir)) {
        const files = fs.readdirSync(hooksDir);
        console.log('✅ Hooks directory created with files:', files);
      } else {
        console.log('❌ Hooks directory not found');
      }
      
      // Check that sourceApp was generated correctly
      if (result.sourceApp === 'project-test-project-123') {
        console.log('✅ Source app slug generated correctly:', result.sourceApp);
      } else {
        console.log('❌ Source app slug incorrect:', result.sourceApp);
      }
    } else {
      console.log('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  } finally {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('Cleaned up test directory');
  }
}

// Run the test
testInstallHooks().catch(console.error);