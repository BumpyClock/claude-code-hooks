#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "openai",
#     "python-dotenv",
# ]
# ///

"""Debug script to test hook components"""

import os
import json
import sys
from pathlib import Path

# Add hooks directory to path
sys.path.insert(0, str(Path(__file__).parent / ".claude/hooks"))

def test_env_loading():
    """Test environment variable loading"""
    from dotenv import load_dotenv
    
    print("=== Environment Loading Test ===")
    
    # Test loading from current directory
    result = load_dotenv()
    print(f"load_dotenv() result: {result}")
    
    # Check if key is loaded
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"OPENAI_API_KEY present: {bool(api_key)}")
    print(f"OPENAI_API_KEY length: {len(api_key) if api_key else 0}")
    
    return api_key is not None

def test_openai_connection():
    """Test OpenAI API connection"""
    from openai import OpenAI
    
    print("\n=== OpenAI Connection Test ===")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("No API key found")
        return False
        
    try:
        client = OpenAI(api_key=api_key)
        
        # Try to list models to test connection
        models = client.models.list()
        print(f"Successfully connected, found {len(models.data)} models")
        
        # Check for the model we're using
        model_ids = [m.id for m in models.data]
        target_model = "gpt-4o-mini"  # This is likely the correct model name
        
        if "gpt-4.1-nano" in model_ids:
            print("✓ gpt-4.1-nano model is available")
        elif target_model in model_ids:
            print(f"✗ gpt-4.1-nano not found, but {target_model} is available")
        else:
            gpt_models = [m for m in model_ids if 'gpt' in m.lower()]
            print(f"✗ Neither model found. Available GPT models: {gpt_models[:5]}")
        
        return True
        
    except Exception as e:
        print(f"OpenAI connection failed: {e}")
        return False

def test_summarizer():
    """Test the summarizer function"""
    print("\n=== Summarizer Test ===")
    
    try:
        from utils.summarizer import generate_event_summary
        
        test_data = {
            'hook_event_type': 'PostToolUse',
            'payload': {
                'tool_name': 'Read',
                'tool_input': {'file_path': '/test/file.txt'},
                'tool_response': {'success': True}
            }
        }
        
        print("Calling generate_event_summary...")
        summary = generate_event_summary(test_data)
        print(f"Summary result: {summary}")
        
        return summary is not None
        
    except Exception as e:
        print(f"Summarizer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("=== Hook Debug Tests ===\n")
    
    # Test environment loading
    env_ok = test_env_loading()
    
    # Test OpenAI connection (only if env is ok)
    if env_ok:
        openai_ok = test_openai_connection()
    else:
        print("\n=== OpenAI Connection Test ===")
        print("Skipped due to missing API key")
        openai_ok = False
    
    # Test summarizer (only if previous tests pass)
    if env_ok and openai_ok:
        summarizer_ok = test_summarizer()
    else:
        print("\n=== Summarizer Test ===")
        print("Skipped due to previous failures")
        summarizer_ok = False
    
    print(f"\n=== Results ===")
    print(f"Environment loading: {'✓' if env_ok else '✗'}")
    print(f"OpenAI connection: {'✓' if openai_ok else '✗'}")
    print(f"Summarizer: {'✓' if summarizer_ok else '✗'}")

if __name__ == "__main__":
    main()