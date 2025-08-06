# Claude Code Hooks Documentation (Latest)

## Overview

Claude Code hooks are configurable scripts that can interact with Claude Code's workflow at various stages of operation. They provide a powerful way to customize Claude Code's behavior by executing commands before, during, or after different events.

## Configuration

Claude Code hooks are configured in your settings files:
- `~/.claude/settings.json` - User settings
- `.claude/settings.json` - Project settings  
- `.claude/settings.local.json` - Local project settings (not committed)
- Enterprise managed policy settings

### Hook Configuration Structure

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

- **matcher**: Pattern to match tool names, case-sensitive (only applicable for `PreToolUse` and `PostToolUse`)
  - Simple strings match exactly: `Write` matches only the Write tool
  - Supports regex: `Edit|Write` or `Notebook.*`
  - If omitted or empty string, hooks run for all matching events
- **hooks**: Array of commands to execute when the pattern matches
  - `type`: Currently only `"command"` is supported
  - `command`: The bash command to execute
  - `timeout`: (Optional) How long a command should run, in seconds, before canceling that specific command

For events like `UserPromptSubmit`, `Notification`, `Stop`, and `SubagentStop` that don't use matchers, you can omit the matcher field.

## Hook Events

### PreToolUse
Runs after Claude creates tool parameters and before processing the tool call.

**Common matchers:**
- `Task` - Agent tasks
- `Bash` - Shell commands
- `Glob` - File pattern matching
- `Grep` - Content search
- `Read` - File reading
- `Edit`, `MultiEdit` - File editing
- `Write` - File writing
- `WebFetch`, `WebSearch` - Web operations

### PostToolUse
Runs immediately after a tool completes successfully.
Recognizes the same matcher values as PreToolUse.

### Notification
Runs when Claude Code sends notifications. Notifications are sent when:
1. Claude needs your permission to use a tool
2. The prompt input has been idle for at least 60 seconds

### UserPromptSubmit
Runs when the user submits a prompt, before Claude processes it. This allows you to add additional context based on the prompt/conversation, validate prompts, or block certain types of prompts.

### Stop
Runs when the main Claude Code agent has finished responding. Does not run if the stoppage occurred due to a user interrupt.

### SubagentStop
Runs when a Claude Code subagent (Task tool call) has finished responding.

### PreCompact
Runs before Claude Code is about to run a compact operation.

**Matchers:**
- `manual` - Invoked from `/compact`
- `auto` - Invoked from auto-compact (due to full context window)

### SessionStart
Runs when Claude Code initializes a new session.

## Hook Input

Hooks receive JSON data via stdin containing session information and event-specific data:

```typescript
{
  // Common fields
  session_id: string
  transcript_path: string  // Path to conversation JSON
  cwd: string              // The current working directory when the hook is invoked

  // Event-specific fields
  hook_event_name: string
  ...
}
```

## Hook Output

There are two ways for hooks to return output back to Claude Code:

### Simple: Exit Code
- **Exit code 0**: Success. `stdout` is shown to the user in transcript mode (CTRL-R)
- **Exit code 2**: Blocking error. `stderr` is fed back to Claude to process automatically
- **Other exit codes**: Non-blocking error. `stderr` is shown to the user and execution continues

### Advanced: JSON Output
Hooks can return structured JSON in `stdout` for more sophisticated control:

#### Common JSON Fields
```json
{
  "continue": true, // Whether Claude should continue after hook execution (default: true)
  "stopReason": "string", // Message shown when continue is false
  "suppressOutput": true // Hide stdout from transcript mode (default: false)
}
```

#### Decision Control
Different hook events support specific decision controls:

**PreToolUse Decision Control:**
```json
{
  "decision": "approve" | "block" | undefined,
  "reason": "Explanation for decision"
}
```

**PostToolUse Decision Control:**
```json
{
  "decision": "block" | undefined,
  "reason": "Explanation for decision"
}
```

**UserPromptSubmit Decision Control:**
```json
{
  "decision": "block" | undefined,
  "reason": "Explanation for decision"
}
```

**Stop/SubagentStop Decision Control:**
```json
{
  "decision": "block" | undefined,
  "reason": "Must be provided when Claude is blocked from stopping"
}
```

## Working with MCP Tools

Claude Code hooks work seamlessly with Model Context Protocol (MCP) tools. MCP tools follow the pattern `mcp__<server>__<tool>`, for example:

- `mcp__memory__create_entities` - Memory server's create entities tool
- `mcp__filesystem__read_file` - Filesystem server's read file tool
- `mcp__github__search_repositories` - GitHub server's search tool

You can target specific MCP tools or entire MCP servers using regex patterns in your matchers.

## Security Considerations

### Disclaimer
**USE AT YOUR OWN RISK**: Claude Code hooks execute arbitrary shell commands on your system automatically. By using hooks, you acknowledge that:

- You are solely responsible for the commands you configure
- Hooks can modify, delete, or access any files your user account can access
- Malicious or poorly written hooks can cause data loss or system damage
- Anthropic provides no warranty and assumes no liability for any damages resulting from hook usage
- You should thoroughly test hooks in a safe environment before production use

### Security Best Practices
1. **Validate and sanitize inputs** - Never trust input data blindly
2. **Always quote shell variables** - Use `"$VAR"` not `$VAR`
3. **Block path traversal** - Check for `..` in file paths
4. **Use absolute paths** - Specify full paths for scripts
5. **Skip sensitive files** - Avoid `.env`, `.git/`, keys, etc.

### Configuration Safety
Direct edits to hooks in settings files don't take effect immediately. Claude Code:
1. Captures a snapshot of hooks at startup
2. Uses this snapshot throughout the session
3. Warns if hooks are modified externally
4. Requires review in `/hooks` menu for changes to apply

## Hook Execution Details

- **Timeout**: 60-second execution limit by default, configurable per command
- **Parallelization**: All matching hooks run in parallel
- **Environment**: Runs in current directory with Claude Code's environment
- **Input**: JSON via stdin
- **Output**: Progress shown in transcript (Ctrl-R) for PreToolUse/PostToolUse/Stop

## Environment Variables

Hooks have access to special environment variables:
- `$CLAUDE_PROJECT_DIR` - The project directory path
- All standard environment variables from Claude Code's context

## Debugging

### Basic Troubleshooting
If your hooks aren't working:
1. **Check configuration** - Run `/hooks` to see if your hook is registered
2. **Verify syntax** - Ensure your JSON settings are valid
3. **Test commands** - Run hook commands manually first
4. **Check permissions** - Make sure scripts are executable
5. **Review logs** - Use `claude --debug` to see hook execution details

### Advanced Debugging
For complex hook issues:
1. **Inspect hook execution** - Use `claude --debug` to see detailed hook execution
2. **Validate JSON schemas** - Test hook input/output with external tools
3. **Check environment variables** - Verify Claude Code's environment is correct
4. **Test edge cases** - Try hooks with unusual file paths or inputs
5. **Monitor system resources** - Check for resource exhaustion during hook execution
6. **Use structured logging** - Implement logging in your hook scripts

Use `claude --debug` to see hook execution details with detailed progress messages in transcript mode (Ctrl-R).