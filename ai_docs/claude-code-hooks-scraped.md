# Claude Code Hooks Documentation

Claude Code Hooks are configuration-based event triggers that allow developers to execute custom commands at specific points during Claude Code's operation. Key aspects include:

## Configuration Locations:
- `~/.claude/settings.json` (User settings)
- `.claude/settings.json` (Project settings)  
- `.claude/settings.local.json` (Local project settings)

## Hook Events:
1. **PreToolUse**: Runs before tool execution
2. **PostToolUse**: Runs after successful tool completion
3. **Notification**: Triggered during specific system notifications
4. **UserPromptSubmit**: Runs when a user submits a prompt
5. **Stop**: Runs when the main agent finishes responding
6. **SubagentStop**: Runs when a subagent completes
7. **PreCompact**: Runs before context compaction
8. **SessionStart**: Runs when starting or resuming a session

## Hook Structure Example:
```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

## Key Features:
- Supports regex matching for tools
- Configurable timeout for commands
- Provides environment variable `CLAUDE_PROJECT_DIR`
- Allows blocking or modifying tool executions
- Supports adding context dynamically

## Security Warning: 
Hooks execute shell commands, so careful configuration is crucial for maintaining system security.