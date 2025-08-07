#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "anthropic",
#     "openai",
#     "python-dotenv",
# ]
# ///

import json
import os
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv


def _log_to_file(message: str, log_file: str = ".claude/logs/summarizer.log") -> None:
    """Log message to file with timestamp."""
    try:
        # Ensure log directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        timestamp = datetime.now().isoformat()
        with open(log_file, "a") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass  # Fail silently to not break hooks


def _load_environment() -> None:
    """Load environment variables from various possible .env locations."""
    # Try multiple locations for .env file
    current_dir = os.getcwd()
    possible_env_paths = [
        ".env",  # Current directory
        os.path.join(current_dir, ".env"),  # Explicit current directory
        os.path.expanduser("~/.claude/.env"),  # User claude directory
    ]
    
    # Walk up the directory tree to find .env
    check_dir = current_dir
    for _ in range(5):  # Don't go too far up
        env_path = os.path.join(check_dir, ".env")
        possible_env_paths.append(env_path)
        check_dir = os.path.dirname(check_dir)
        if check_dir == "/" or check_dir == check_dir:  # Reached root or no change
            break
    
    # Try loading from each possible location
    for env_path in possible_env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path, override=True)
            _log_to_file(f"Loaded .env from: {env_path}")
            break


def _get_llm_provider() -> str:
    """
    Determine which LLM provider to use based on environment variables and availability.
    
    Returns:
        str: 'anthropic', 'openai', or 'fallback'
    """
    _load_environment()
    
    # Check explicit provider preference
    preferred_provider = os.getenv("SUMMARY_LLM_PROVIDER", "").lower()
    _log_to_file(f"SUMMARY_LLM_PROVIDER preference: {preferred_provider}")
    
    # Check API key availability
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    
    _log_to_file(f"API key availability - Anthropic: {has_anthropic}, OpenAI: {has_openai}")
    
    # Honor explicit preference if API key is available
    if preferred_provider == "anthropic" and has_anthropic:
        return "anthropic"
    elif preferred_provider == "openai" and has_openai:
        return "openai"
    elif preferred_provider in ["claude", "anth"] and has_anthropic:
        return "anthropic"
    elif preferred_provider in ["gpt", "oai"] and has_openai:
        return "openai"
    
    # Auto-select based on availability (prefer Anthropic for speed/cost)
    if has_anthropic:
        return "anthropic"
    elif has_openai:
        return "openai"
    else:
        return "fallback"


def _prompt_llm(prompt_text: str) -> Optional[str]:
    """
    Smart LLM prompting that automatically selects the best available provider.
    
    Args:
        prompt_text: The prompt to send to the LLM
        
    Returns:
        str: The model's response, or None if all providers fail
    """
    provider = _get_llm_provider()
    _log_to_file(f"Using LLM provider: {provider}")
    
    if provider == "anthropic":
        try:
            from .llm.anth import prompt_llm
            result = prompt_llm(prompt_text)
            if result:
                _log_to_file(f"Anthropic call successful, response length: {len(result)}")
                return result
            else:
                _log_to_file("Anthropic call failed, trying OpenAI fallback")
        except Exception as e:
            _log_to_file(f"Anthropic import/call error: {str(e)}, trying OpenAI fallback")
    
    if provider == "openai" or provider == "anthropic":  # Try OpenAI as fallback
        try:
            from .llm.oai import prompt_llm
            result = prompt_llm(prompt_text)
            if result:
                _log_to_file(f"OpenAI call successful, response length: {len(result)}")
                return result
            else:
                _log_to_file("OpenAI call failed")
        except Exception as e:
            _log_to_file(f"OpenAI import/call error: {str(e)}")
    
    # Fallback: Return a simple template-based summary
    _log_to_file("Using fallback summary generation")
    return _generate_fallback_summary(prompt_text)


def generate_event_summary(event_data: Dict[str, Any]) -> Optional[str]:
    """
    Generate a concise one-sentence summary of a hook event for engineers.

    Args:
        event_data: The hook event data containing event_type, payload, etc.

    Returns:
        str: A one-sentence summary, or None if generation fails
    """
    _log_to_file("=== SUMMARIZER CALLED ===")
    
    event_type = event_data.get("hook_event_type", "Unknown")
    payload = event_data.get("payload", {})
    
    _log_to_file(f"Event type: {event_type}")
    _log_to_file(f"Payload keys: {list(payload.keys())}")

    # Convert payload to string representation
    payload_str = json.dumps(payload, indent=2)
    if len(payload_str) > 1000:
        payload_str = payload_str[:1000] + "..."

    prompt = f"""Generate a one-sentence summary of this Claude Code hook event payload for an engineer monitoring the system.

Event Type: {event_type}
Payload:
{payload_str}

Requirements:
- ONE sentence only (no period at the end)
- Focus on the key action or information in the payload
- Be specific and technical
- Keep under 15 words
- Use present tense
- No quotes or formatting
- Return ONLY the summary text

Examples:
- Reads configuration file from project root
- Executes npm install to update dependencies
- Searches web for React documentation
- Edits database schema to add user table
- Agent responds with implementation plan

Generate the summary based on the payload:"""

    _log_to_file(f"Calling LLM with prompt length: {len(prompt)}")
    summary = _prompt_llm(prompt)
    _log_to_file(f"LLM response: {summary}")

    # Clean up the response
    if summary:
        summary = summary.strip().strip('"').strip("'").strip(".")
        # Take only the first line if multiple
        summary = summary.split("\n")[0].strip()
        # Ensure it's not too long
        if len(summary) > 100:
            summary = summary[:97] + "..."
        
        _log_to_file(f"Final summary: {summary}")
    else:
        _log_to_file("No summary generated (LLM returned None/empty)")

    _log_to_file("=== SUMMARIZER COMPLETE ===")
    return summary


def _generate_fallback_summary(prompt_text: str) -> str:
    """
    Generate a basic template-based summary when no LLM is available.
    
    Args:
        prompt_text: The original prompt (to extract event info)
        
    Returns:
        str: A simple template-based summary
    """
    # Extract event type from prompt
    lines = prompt_text.split('\n')
    event_type = "Unknown"
    for line in lines:
        if line.startswith("Event Type:"):
            event_type = line.replace("Event Type:", "").strip()
            break
    
    # Simple template-based responses
    templates = {
        "PreToolUse": "Preparing to execute tool",
        "PostToolUse": "Tool execution completed", 
        "UserPromptSubmit": "User submitted prompt",
        "Stop": "Agent response finished",
        "SubagentStop": "Subagent task completed",
        "Notification": "System notification",
        "PreCompact": "Context compaction starting",
        "Unknown": "Hook event processed"
    }
    
    return templates.get(event_type, templates["Unknown"])
