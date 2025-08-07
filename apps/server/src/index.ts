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
import path from 'path';

// Initialize database
initDatabase();

// Store WebSocket clients
const wsClients = new Set<any>();

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
        
        // Source and target directories
        const sourceHooksDir = '/Users/adityasharma/Projects/claude-code-hooks/.claude/hooks';
        const targetClaudeDir = path.join(targetPath, '.claude');
        const targetHooksDir = path.join(targetClaudeDir, 'hooks');
        
        // Create directories using Bun's fs compatibility layer
        const fs = await import('fs').then(m => m.promises);
        await fs.mkdir(targetClaudeDir, { recursive: true });
        await fs.mkdir(targetHooksDir, { recursive: true });
        
        // Track installed files
        const installedFiles: string[] = [];
        
        // Recursive function to copy files using Bun APIs
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
        
        // Copy all hook files
        await copyDirectory(sourceHooksDir, targetHooksDir, '');
        
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
          sourceApp
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
    open(ws) {
      console.log('WebSocket client connected');
      wsClients.add(ws);
      
      // Send recent events on connection
      const events = getRecentEvents(200);
      ws.send(JSON.stringify({ type: 'initial', data: events }));
    },
    
    message(ws, message) {
      // Handle any client messages if needed
      console.log('Received message:', message);
    },
    
    close(ws) {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
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