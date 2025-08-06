#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "anthropic",
#     "python-dotenv",
# ]
# ///

import json
import os
from datetime import datetime
from typing import Optional, Dict, Any
from .llm.oai import prompt_llm


def _log_to_file(message: str, log_file: str = ".claude/logs/summarizer.log") -> None:
    """Log message to file with timestamp."""
    try:
        timestamp = datetime.now().isoformat()
        with open(log_file, "a") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass  # Fail silently to not break hooks


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

    _log_to_file(f"Calling prompt_llm with prompt length: {len(prompt)}")
    summary = prompt_llm(prompt)
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
