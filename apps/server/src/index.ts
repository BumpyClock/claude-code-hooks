import { initDatabase, insertEvent, getFilterOptions, getRecentEvents, getHistoricalEvents } from './db';
import type { HookEvent } from './types';
import { 
  createTheme, 
  updateThemeById, 
  getThemeById, 
  searchThemes, 
  deleteThemeById, 
  exportThemeById, 
  importTheme,
  getThemeStats 
} from './theme';
import {
  getDailyUsage,
  getMonthlyUsage,
  getSessionUsage,
  getBlocksUsage,
  getLiveBlockData,
  cleanup as cleanupUsage
} from './usage';
import path from 'path';

// Initialize database
initDatabase();

// Store WebSocket clients
const wsClients = new Set<any>();

// Live token usage update interval (30 seconds)
const TOKEN_UPDATE_INTERVAL = 30000;
let tokenUpdateTimer: Timer | null = null;

// Start periodic token usage updates
async function startTokenUpdates() {
  if (tokenUpdateTimer) return;
  
  tokenUpdateTimer = setInterval(async () => {
    if (wsClients.size === 0) return;
    
    try {
      const liveBlockData = await getLiveBlockData();
      if (liveBlockData.success && liveBlockData.data) {
        const message = JSON.stringify({ type: 'tokenUsage', data: liveBlockData.data });
        wsClients.forEach(client => {
          try {
            client.send(message);
          } catch (err) {
            // Client disconnected, remove from set
            wsClients.delete(client);
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting token usage:', error);
    }
  }, TOKEN_UPDATE_INTERVAL);
}

// Stop periodic updates
function stopTokenUpdates() {
  if (tokenUpdateTimer) {
    clearInterval(tokenUpdateTimer);
    tokenUpdateTimer = null;
  }
}

// Create Bun server with HTTP and WebSocket support
const server = Bun.serve({
  port: 4000,
  
  async fetch(req: Request) {
    const url = new URL(req.url);
    
    // Handle CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // POST /events - Receive new events
    if (url.pathname === '/events' && req.method === 'POST') {
      try {
        const event: HookEvent = await req.json();
        
        // Validate required fields
        if (!event.source_app || !event.session_id || !event.hook_event_type || !event.payload) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
        
        // Insert event into database
        const savedEvent = insertEvent(event);
        
        // Broadcast to all WebSocket clients
        const message = JSON.stringify({ type: 'event', data: savedEvent });
        wsClients.forEach(client => {
          try {
            client.send(message);
          } catch (err) {
            // Client disconnected, remove from set
            wsClients.delete(client);
          }
        });
        
        return new Response(JSON.stringify(savedEvent), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error processing event:', error);
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // GET /events/filter-options - Get available filter options
    if (url.pathname === '/events/filter-options' && req.method === 'GET') {
      const options = getFilterOptions();
      return new Response(JSON.stringify(options), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /events/recent - Get recent events
    if (url.pathname === '/events/recent' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const events = getRecentEvents(limit);
      return new Response(JSON.stringify(events), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /events/historical - Get historical events with timestamp pagination
    if (url.pathname === '/events/historical' && req.method === 'GET') {
      const beforeParam = url.searchParams.get('before');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      
      if (!beforeParam) {
        return new Response(JSON.stringify({ error: 'Missing required parameter: before (ISO timestamp)' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      
      try {
        const beforeTimestamp = new Date(beforeParam).getTime();
        if (isNaN(beforeTimestamp)) {
          return new Response(JSON.stringify({ error: 'Invalid timestamp format. Use ISO 8601 format.' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
        
        const result = getHistoricalEvents(beforeTimestamp, limit);
        return new Response(JSON.stringify(result), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error retrieving historical events:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve historical events' }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Theme API endpoints
    
    // POST /api/themes - Create a new theme
    if (url.pathname === '/api/themes' && req.method === 'POST') {
      try {
        const themeData = await req.json();
        const result = await createTheme(themeData);
        
        const status = result.success ? 201 : 400;
        return new Response(JSON.stringify(result), {
          status,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating theme:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid request body' 
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // GET /api/themes - Search themes
    if (url.pathname === '/api/themes' && req.method === 'GET') {
      const query = {
        query: url.searchParams.get('query') || undefined,
        isPublic: url.searchParams.get('isPublic') ? url.searchParams.get('isPublic') === 'true' : undefined,
        authorId: url.searchParams.get('authorId') || undefined,
        sortBy: url.searchParams.get('sortBy') as any || undefined,
        sortOrder: url.searchParams.get('sortOrder') as any || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      };
      
      const result = await searchThemes(query);
      return new Response(JSON.stringify(result), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/themes/:id - Get a specific theme
    if (url.pathname.startsWith('/api/themes/') && req.method === 'GET') {
      const id = url.pathname.split('/')[3];
      if (!id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Theme ID is required' 
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      
      const result = await getThemeById(id);
      const status = result.success ? 200 : 404;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/themes/:id - Update a theme
    if (url.pathname.startsWith('/api/themes/') && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      if (!id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Theme ID is required' 
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      
      try {
        const updates = await req.json();
        const result = await updateThemeById(id, updates);
        
        const status = result.success ? 200 : 400;
        return new Response(JSON.stringify(result), {
          status,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error updating theme:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid request body' 
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // DELETE /api/themes/:id - Delete a theme
    if (url.pathname.startsWith('/api/themes/') && req.method === 'DELETE') {
      const id = url.pathname.split('/')[3];
      if (!id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Theme ID is required' 
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      
      const authorId = url.searchParams.get('authorId');
      const result = await deleteThemeById(id, authorId || undefined);
      
      const status = result.success ? 200 : (result.error?.includes('not found') ? 404 : 403);
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/themes/:id/export - Export a theme
    if (url.pathname.match(/^\/api\/themes\/[^\/]+\/export$/) && req.method === 'GET') {
      const id = url.pathname.split('/')[3];
      
      const result = await exportThemeById(id);
      if (!result.success) {
        const status = result.error?.includes('not found') ? 404 : 400;
        return new Response(JSON.stringify(result), {
          status,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(result.data), {
        headers: { 
          ...headers, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${result.data.theme.name}.json"`
        }
      });
    }
    
    // POST /api/themes/import - Import a theme
    if (url.pathname === '/api/themes/import' && req.method === 'POST') {
      try {
        const importData = await req.json();
        const authorId = url.searchParams.get('authorId');
        
        const result = await importTheme(importData, authorId || undefined);
        
        const status = result.success ? 201 : 400;
        return new Response(JSON.stringify(result), {
          status,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error importing theme:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid import data' 
        }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // GET /api/themes/stats - Get theme statistics
    if (url.pathname === '/api/themes/stats' && req.method === 'GET') {
      const result = await getThemeStats();
      return new Response(JSON.stringify(result), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/install-hooks - Install hooks into a project
    if (url.pathname === '/api/install-hooks' && req.method === 'POST') {
      try {
        const body = await req.json() as { targetPath?: string; displayName?: string; serverUrl?: string };
        const { targetPath, displayName, serverUrl } = body;
        
        // Validate required fields
        if (!targetPath || !displayName || !serverUrl) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: targetPath, displayName, and serverUrl are required' 
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
        
        // Generate sourceApp slug from displayName
        const sourceApp = `project-${displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        
        // Validate targetPath exists and is writable
        // Since Bun.file is for files, we need to check directory existence differently
        try {
          const testFile = Bun.file(path.join(targetPath, '.test'));
          // Try to write a test file to check if directory exists and is writable
          await Bun.write(testFile, '');
          // Clean up test file
          try {
            const fs = await import('fs').then(m => m.promises);
            await fs.unlink(path.join(targetPath, '.test'));
          } catch {
            // Ignore cleanup errors
          }
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Target path does not exist or is not accessible: ${targetPath}` 
          }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
        
        // Use sync-hooks.py script for cross-platform hook installation
        const projectRoot = path.dirname(path.dirname(path.dirname(__dirname)));
        const syncScriptPath = path.join(projectRoot, 'sync-hooks.py');
        const targetClaudeDir = path.join(targetPath, '.claude');
        
        // Ensure .claude directory exists
        const fs = await import('fs').then(m => m.promises);
        await fs.mkdir(targetClaudeDir, { recursive: true });
        
        // Track installed files - we'll get these from the script output
        let installedFiles: string[] = [];
        let syncMethod = 'unknown';
        
        try {
          // Run the sync-hooks.py script using Bun's subprocess (cross-platform Python)
          const pythonCmd = process.platform === 'darwin' ? 'python3' : 'python';
          const syncProcess = Bun.spawn([
            pythonCmd, syncScriptPath, targetPath, '--verbose'
          ], {
            stdout: 'pipe',
            stderr: 'pipe',
            cwd: projectRoot
          });
          
          const [stdout, stderr] = await Promise.all([
            new Response(syncProcess.stdout).text(),
            new Response(syncProcess.stderr).text()
          ]);
          
          await syncProcess.exited;
          
          if (syncProcess.exitCode !== 0) {
            console.error('sync-hooks.py failed:', stderr);
            throw new Error(`Hook synchronization failed: ${stderr}`);
          }
          
          // Parse the output to get sync statistics
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line.includes('files processed:')) {
              const match = line.match(/Total files processed: (\d+)/);
              if (match) {
                installedFiles = Array.from({ length: parseInt(match[1]) }, (_, i) => `hook-file-${i + 1}.py`);
              }
            }
            if (line.includes('Symlinked:') || line.includes('Hard linked:') || line.includes('Copied:')) {
              // Determine primary sync method from output
              if (line.includes('Symlinked:') && !line.includes(': 0')) syncMethod = 'symlinked';
              else if (line.includes('Hard linked:') && !line.includes(': 0')) syncMethod = 'hard-linked';  
              else if (line.includes('Copied:') && !line.includes(': 0')) syncMethod = 'copied';
            }
          }
          
          console.log(`Hook sync completed using method: ${syncMethod}`);
          
        } catch (error) {
          console.error('Error running sync-hooks.py:', error);
          // Fallback to original copy method if sync script fails
          console.log('Falling back to file copying method');
          
          const sourceHooksDir = path.join(projectRoot, '.claude/hooks');
          const targetHooksDir = path.join(targetClaudeDir, 'hooks');
          await fs.mkdir(targetHooksDir, { recursive: true });
          
          // Recursive function to copy files using Bun APIs (fallback)
          async function copyDirectory(source: string, target: string, basePath: string = '') {
            const entries = await fs.readdir(source, { withFileTypes: true });
            
            for (const entry of entries) {
              const sourcePath = path.join(source, entry.name);
              const targetPath = path.join(target, entry.name);
              const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;
              
              if (entry.isDirectory()) {
                await fs.mkdir(targetPath, { recursive: true });
                await copyDirectory(sourcePath, targetPath, relativePath);
              } else if (entry.isFile()) {
                // Read the source file using Bun.file
                const sourceFile = Bun.file(sourcePath);
                const content = await sourceFile.text();
                
                // Write to target using Bun.write
                await Bun.write(targetPath, content);
                installedFiles.push(relativePath);
              }
            }
          }
          
          await copyDirectory(sourceHooksDir, targetHooksDir, '');
          syncMethod = 'copied (fallback)';
        }
        
        // Ensure serverUrl has the /events endpoint
        const eventsUrl = serverUrl.endsWith('/events') ? serverUrl : 
                         serverUrl.endsWith('/') ? `${serverUrl}events` : `${serverUrl}/events`;
        
        // Generate settings.json content with the generated sourceApp slug and serverUrl
        const settingsContent = {
          hooks: {
            PreToolUse: [{
              matcher: "",
              hooks: [
                { type: "command", command: "uv run .claude/hooks/pre_tool_use.py" },
                { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type PreToolUse --summarize --server-url ${eventsUrl}` }
              ]
            }],
            PostToolUse: [{
              matcher: "",
              hooks: [
                { type: "command", command: "uv run .claude/hooks/post_tool_use.py" },
                { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type PostToolUse --summarize --server-url ${eventsUrl}` }
              ]
            }],
            Stop: [{
              matcher: "",
              hooks: [
                { type: "command", command: "uv run .claude/hooks/stop.py --chat" },
                { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type Stop --add-chat --server-url ${eventsUrl}` }
              ]
            }],
            UserPromptSubmit: [{
              hooks: [
                { type: "command", command: "uv run .claude/hooks/user_prompt_submit.py --log-only" },
                { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type UserPromptSubmit --summarize --server-url ${eventsUrl}` }
              ]
            }],
            SubagentStop: [{
              matcher: "",
              hooks: [
                { type: "command", command: "uv run .claude/hooks/subagent_stop.py" },
                { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type SubagentStop --server-url ${eventsUrl}` }
              ]
            }]
          }
        };
        
        // Write settings.json using Bun.write
        const settingsPath = path.join(targetClaudeDir, 'settings.json');
        await Bun.write(settingsPath, JSON.stringify(settingsContent, null, 2));
        installedFiles.push('settings.json');
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Hooks installed successfully',
          installedFiles,
          sourceApp,
          syncMethod
        }), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Error installing hooks:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to install hooks: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Usage API endpoints
    
    // GET /api/usage/daily - Get daily token usage
    if (url.pathname === '/api/usage/daily' && req.method === 'GET') {
      const options = {
        since: url.searchParams.get('since') || undefined,
        until: url.searchParams.get('until') || undefined,
        project: url.searchParams.get('project') || undefined,
        breakdown: url.searchParams.get('breakdown') === 'true',
        mode: url.searchParams.get('mode') as any || undefined
      };
      
      const result = await getDailyUsage(options);
      const status = result.success ? 200 : 500;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/usage/monthly - Get monthly token usage
    if (url.pathname === '/api/usage/monthly' && req.method === 'GET') {
      const options = {
        since: url.searchParams.get('since') || undefined,
        until: url.searchParams.get('until') || undefined,
        project: url.searchParams.get('project') || undefined,
        breakdown: url.searchParams.get('breakdown') === 'true',
        mode: url.searchParams.get('mode') as any || undefined
      };
      
      const result = await getMonthlyUsage(options);
      const status = result.success ? 200 : 500;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/usage/session - Get session-based token usage
    if (url.pathname === '/api/usage/session' && req.method === 'GET') {
      const options = {
        since: url.searchParams.get('since') || undefined,
        until: url.searchParams.get('until') || undefined,
        project: url.searchParams.get('project') || undefined,
        mode: url.searchParams.get('mode') as any || undefined,
        order: url.searchParams.get('order') as any || undefined
      };
      
      const result = await getSessionUsage(options);
      const status = result.success ? 200 : 500;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/usage/blocks - Get billing blocks usage
    if (url.pathname === '/api/usage/blocks' && req.method === 'GET') {
      const options = {
        active: url.searchParams.get('active') === 'true',
        recent: url.searchParams.get('recent') === 'true',
        mode: url.searchParams.get('mode') as any || undefined,
        order: url.searchParams.get('order') as any || undefined,
        tokenLimit: url.searchParams.get('tokenLimit') ? 
          (url.searchParams.get('tokenLimit') === 'max' ? 'max' : parseInt(url.searchParams.get('tokenLimit')!)) : 
          undefined
      };
      
      const result = await getBlocksUsage(options);
      const status = result.success ? 200 : 500;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/usage/blocks/live - Get live monitoring data
    if (url.pathname === '/api/usage/blocks/live' && req.method === 'GET') {
      const result = await getLiveBlockData();
      const status = result.success ? 200 : 500;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // WebSocket upgrade
    if (url.pathname === '/stream') {
      const success = server.upgrade(req);
      if (success) {
        return undefined;
      }
    }
    
    // Default response
    return new Response('Multi-Agent Observability Server', {
      headers: { ...headers, 'Content-Type': 'text/plain' }
    });
  },
  
  websocket: {
    async open(ws) {
      console.log('WebSocket client connected');
      wsClients.add(ws);
      
      // Start token updates if this is the first client
      if (wsClients.size === 1) {
        startTokenUpdates();
      }
      
      // Send recent events on connection
      const events = getRecentEvents(200);
      ws.send(JSON.stringify({ type: 'initial', data: events }));
      
      // Send initial token usage data
      try {
        const liveBlockData = await getLiveBlockData();
        if (liveBlockData.success && liveBlockData.data) {
          ws.send(JSON.stringify({ type: 'tokenUsage', data: liveBlockData.data }));
        }
      } catch (error) {
        console.error('Error sending initial token data:', error);
      }
    },
    
    message(ws, message) {
      // Handle any client messages if needed
      console.log('Received message:', message);
    },
    
    close(ws) {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
      
      // Stop token updates if no clients remain
      if (wsClients.size === 0) {
        stopTokenUpdates();
      }
    },
    
    error(ws, error) {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    }
  }
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(`📊 WebSocket endpoint: ws://localhost:${server.port}/stream`);
console.log(`📮 POST events to: http://localhost:${server.port}/events`);
console.log(`📈 Token usage API: http://localhost:${server.port}/api/usage/*`);

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  stopTokenUpdates();
  cleanupUsage();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  stopTokenUpdates();
  cleanupUsage();
  process.exit(0);
});