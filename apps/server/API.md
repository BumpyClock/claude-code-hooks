# Claude Code Hooks Server API Documentation

## Base URL
`http://localhost:4000`

## Endpoints

### Install Hooks
**POST** `/api/install-hooks`

Installs Claude Code hook files and configuration into a target project.

#### Request Body
```json
{
  "targetPath": "/path/to/project",
  "displayName": "My Awesome Project",
  "serverUrl": "http://localhost:4000"
}
```

**Parameters:**
- `targetPath` (string, required): Absolute path to the target project directory
- `displayName` (string, required): Human-readable name for the project (used to generate sourceApp ID)
- `serverUrl` (string, required): Base URL of the monitoring server (e.g., `http://localhost:4000`)

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Hooks installed successfully",
  "installedFiles": ["pre_tool_use.py", "stop.py", "settings.json", ...],
  "sourceApp": "project-my-awesome-project"
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing required fields: targetPath, displayName, and serverUrl are required"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to install hooks: <error message>"
}
```

#### What it does:
1. Generates a unique `sourceApp` identifier from the display name (e.g., "My Project" → "project-my-project")
2. Copies all hook files from `.claude/hooks/` to `${targetPath}/.claude/hooks/`
3. Generates a `settings.json` file at `${targetPath}/.claude/settings.json` with:
   - All hook configurations (PreToolUse, PostToolUse, Stop, UserPromptSubmit, SubagentStop)
   - Proper server URL with `/events` endpoint
   - Generated sourceApp identifier for tracking

#### Example Usage:
```bash
curl -X POST http://localhost:4000/api/install-hooks \
  -H "Content-Type: application/json" \
  -d '{
    "targetPath": "/Users/username/my-project",
    "displayName": "My Awesome Project",
    "serverUrl": "http://localhost:4000"
  }'
```

---

### Event Submission
**POST** `/events`

Receives hook events from Claude Code projects.

#### Request Body
```json
{
  "source_app": "project-name",
  "session_id": "session-123",
  "hook_event_type": "PreToolUse",
  "payload": {},
  "timestamp": 1234567890
}
```

---

### Get Filter Options
**GET** `/events/filter-options`

Returns available filter options for events.

---

### Get Recent Events
**GET** `/events/recent?limit=100`

Returns recent events from all monitored projects.

---

### WebSocket Stream
**WS** `/stream`

Real-time event stream for monitoring dashboard.

---

## Theme Management Endpoints

### Create Theme
**POST** `/api/themes`

### Search Themes
**GET** `/api/themes?query=<query>`

### Get Theme
**GET** `/api/themes/:id`

### Update Theme
**PUT** `/api/themes/:id`

### Delete Theme
**DELETE** `/api/themes/:id?authorId=<authorId>`

### Export Theme
**GET** `/api/themes/:id/export`

### Import Theme
**POST** `/api/themes/import?authorId=<authorId>`

### Theme Statistics
**GET** `/api/themes/stats`