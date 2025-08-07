# Claude Code Hooks Documentation

## Overview

Hooks are configurable scripts that can intercept and modify Claude Code's behavior at various stages of interaction. They are configured in settings files like `~/.claude/settings.json` and provide powerful customization capabilities for developers using Claude Code.

## Key Features

- **Case-sensitive tool name matching**: Precise control over which tools trigger hooks
- **Regex pattern support**: Flexible matching patterns for tool names
- **Environment variable support**: Can use `$CLAUDE_PROJECT_DIR` for dynamic paths
- **JSON input via stdin**: Hooks receive structured data about the current context
- **Control tool execution**: Can add context, modify behavior, or block actions entirely
- **Multiple event types**: Support for various interaction points in the Claude Code workflow

## Hook Structure

Hooks are configured using the following JSON structure in your settings file:

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

## Supported Event Types

- **PreToolUse**: Executes before tool usage, can modify or block tool execution
- **PostToolUse**: Executes after tool completion, can process results
- **Notification**: Triggered on user interactions and notifications
- **UserPromptSubmit**: Executes when user submits a prompt
- **Stop**: Triggered when Claude completes a response
- **SubagentStop**: Executes when a subagent finishes its task
- **PreCompact**: Triggered before context compaction
- **SessionStart**: Executes at the beginning of a session

## Configuration Locations

- `~/.claude/settings.json` (User settings)
- `.claude/settings.json` (Project settings)  
- `.claude/settings.local.json` (Local project settings)

## Execution Details

- **Default timeout**: 60 seconds for hook execution
- **Parallel execution**: Multiple hooks can run simultaneously
- **Debugging**: Detailed debugging available with `claude --debug` command
- **JSON communication**: Hooks receive context data via stdin as JSON

## Security Considerations

**Important Security Notes:**
- Hooks execute shell commands automatically when triggered
- Users are solely responsible for all configured commands and their effects
- Potential for system modification, data loss, or security vulnerabilities
- Thoroughly test all hooks before deploying to production environments
- Review hook commands regularly for security implications

## Configuration Example

Here's a practical example of hook configuration:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python $CLAUDE_PROJECT_DIR/.claude/hooks/pre_tool_use.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "python $CLAUDE_PROJECT_DIR/.claude/hooks/post_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

1. **Test thoroughly**: Always test hooks in a safe environment first
2. **Use absolute paths**: Avoid relative paths that might break in different contexts  
3. **Handle errors gracefully**: Ensure hooks can handle unexpected input
4. **Monitor performance**: Be aware that hooks add latency to tool execution
5. **Regular security review**: Periodically audit hook commands for security issues
6. **Documentation**: Document your hooks' purpose and expected behavior

## Advanced Usage

Hooks provide fine-grained control over Claude Code's interaction workflow, allowing developers to:
- Implement custom validation logic
- Add logging and observability
- Integrate with external systems
- Modify tool behavior based on context
- Create custom security controls
- Build workflow automation

The hook system enables powerful customization while requiring careful consideration of security and performance implications.