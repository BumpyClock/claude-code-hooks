#!/usr/bin/env python3
"""
Cross-Platform Claude Code Hooks Synchronization Script

Syncs hooks from this repository to target project directories using the best
available method: symlinks > hard links > smart copying.

Usage:
    python sync-hooks.py <target_project_path>
    python sync-hooks.py <target_project_path> --method=copy
    python sync-hooks.py <target_project_path> --dry-run
"""

import os
import sys
import shutil
import platform
import argparse
import hashlib
import subprocess
from pathlib import Path
from typing import List, Tuple, Optional

class HookSyncer:
    def __init__(self, source_root: Path, dry_run: bool = False, verbose: bool = False):
        self.source_root = source_root
        self.source_hooks = source_root / ".claude" / "hooks"
        self.dry_run = dry_run
        self.verbose = verbose
        self.is_windows = platform.system() == "Windows"
        self.stats = {
            "symlinked": 0,
            "hard_linked": 0,
            "copied": 0,
            "skipped": 0,
            "errors": 0
        }

    def log(self, message: str, force: bool = False):
        """Log message if verbose or forced."""
        if self.verbose or force:
            print(f"[SYNC] {message}")

    def get_file_hash(self, file_path: Path) -> str:
        """Get MD5 hash of file for change detection."""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""

    def files_are_same(self, source: Path, target: Path) -> bool:
        """Check if files are identical (same content)."""
        if not target.exists():
            return False
        return self.get_file_hash(source) == self.get_file_hash(target)

    def are_hard_linked(self, source: Path, target: Path) -> bool:
        """Check if two files are hard linked (same inode)."""
        try:
            return source.stat().st_ino == target.stat().st_ino
        except Exception:
            return False

    def is_symlinked(self, target: Path) -> bool:
        """Check if target is a symlink."""
        return target.is_symlink()

    def try_symlink(self, source: Path, target: Path) -> bool:
        """Try to create a symlink. Returns True if successful."""
        try:
            if self.dry_run:
                self.log(f"Would create symlink: {target} -> {source}")
                return True
                
            # Create parent directory if needed
            target.parent.mkdir(parents=True, exist_ok=True)
            
            # Remove target if it exists
            if target.exists() or target.is_symlink():
                target.unlink()
                
            # Create symlink
            if self.is_windows:
                # Windows requires different approach
                os.symlink(str(source.resolve()), str(target))
            else:
                target.symlink_to(source.resolve())
                
            self.log(f"Created symlink: {target} -> {source}")
            return True
        except (OSError, NotImplementedError, PermissionError) as e:
            self.log(f"Symlink failed for {target}: {e}")
            return False

    def try_hardlink(self, source: Path, target: Path) -> bool:
        """Try to create a hard link. Returns True if successful."""
        try:
            if self.dry_run:
                self.log(f"Would create hard link: {target} -> {source}")
                return True
                
            # Create parent directory if needed
            target.parent.mkdir(parents=True, exist_ok=True)
            
            # Remove target if it exists
            if target.exists():
                target.unlink()
                
            # Create hard link
            if self.is_windows:
                # Windows uses different command
                result = subprocess.run([
                    "cmd", "/c", "mklink", "/H", str(target), str(source)
                ], capture_output=True, text=True)
                success = result.returncode == 0
            else:
                os.link(str(source), str(target))
                success = True
                
            if success:
                self.log(f"Created hard link: {target} -> {source}")
            return success
        except (OSError, subprocess.SubprocessError) as e:
            self.log(f"Hard link failed for {target}: {e}")
            return False

    def copy_file(self, source: Path, target: Path) -> bool:
        """Copy file as fallback method. Returns True if successful."""
        try:
            if self.dry_run:
                self.log(f"Would copy: {source} -> {target}")
                return True
                
            # Create parent directory if needed
            target.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy file preserving metadata
            shutil.copy2(str(source), str(target))
            self.log(f"Copied: {source} -> {target}")
            return True
        except Exception as e:
            self.log(f"Copy failed for {target}: {e}")
            return False

    def sync_file(self, source: Path, target: Path, preferred_method: str = "auto") -> str:
        """
        Sync a single file using the best available method.
        Returns the method used: 'symlink', 'hardlink', 'copy', 'skip', or 'error'
        """
        # Check if sync is needed
        if target.exists():
            if self.is_symlinked(target):
                # Already symlinked - check if it points to the right place
                try:
                    if target.resolve() == source.resolve():
                        self.log(f"Already symlinked correctly: {target}")
                        return "skip"
                except Exception:
                    pass
            elif self.are_hard_linked(source, target):
                self.log(f"Already hard linked: {target}")
                return "skip"
            elif self.files_are_same(source, target):
                self.log(f"Files identical, no sync needed: {target}")
                return "skip"

        # Try sync methods in order based on preference
        if preferred_method == "symlink":
            if self.try_symlink(source, target):
                return "symlink"
        elif preferred_method == "hardlink":
            if self.try_hardlink(source, target):
                return "hardlink"
        elif preferred_method == "copy":
            if self.copy_file(source, target):
                return "copy"
        else:
            # Auto mode: try symlink -> hardlink -> copy
            if self.try_symlink(source, target):
                return "symlink"
            elif self.try_hardlink(source, target):
                return "hardlink"
            elif self.copy_file(source, target):
                return "copy"
        
        return "error"

    def get_hook_files(self) -> List[Path]:
        """Get list of all hook files to sync."""
        if not self.source_hooks.exists():
            raise FileNotFoundError(f"Source hooks directory not found: {self.source_hooks}")
        
        hook_files = []
        
        # Get all Python files in hooks directory
        for file_path in self.source_hooks.rglob("*.py"):
            if file_path.is_file():
                hook_files.append(file_path)
                
        return hook_files

    def sync_hooks(self, target_project: Path, preferred_method: str = "auto") -> bool:
        """
        Sync all hooks to target project.
        Returns True if sync was successful.
        """
        target_hooks = target_project / ".claude" / "hooks"
        
        self.log(f"Syncing hooks from {self.source_hooks} to {target_hooks}", force=True)
        
        # Create target hooks directory
        if not self.dry_run:
            target_hooks.mkdir(parents=True, exist_ok=True)
        
        # Get all hook files
        try:
            hook_files = self.get_hook_files()
        except FileNotFoundError as e:
            print(f"Error: {e}")
            return False
            
        if not hook_files:
            print("No hook files found to sync")
            return False
            
        self.log(f"Found {len(hook_files)} hook files to sync")
        
        # Sync each file
        success = True
        for source_file in hook_files:
            # Calculate relative path from hooks directory
            rel_path = source_file.relative_to(self.source_hooks)
            target_file = target_hooks / rel_path
            
            # Sync the file
            result = self.sync_file(source_file, target_file, preferred_method)
            self.stats[result.replace("link", "linked")] += 1
            
            if result == "error":
                success = False
                print(f"Failed to sync: {rel_path}")
            elif self.verbose:
                self.log(f"{result.capitalize()}: {rel_path}")
        
        return success

    def print_summary(self):
        """Print sync summary statistics."""
        total = sum(self.stats.values())
        print(f"\nSync Summary:")
        print(f"  Total files processed: {total}")
        print(f"  Symlinked: {self.stats['symlinked']}")
        print(f"  Hard linked: {self.stats['hard_linked']}")
        print(f"  Copied: {self.stats['copied']}")
        print(f"  Skipped (already synced): {self.stats['skipped']}")
        print(f"  Errors: {self.stats['errors']}")
        
        if self.stats['errors'] == 0:
            print(f"  ✅ All files synced successfully!")
        else:
            print(f"  ⚠️  {self.stats['errors']} files failed to sync")


def main():
    parser = argparse.ArgumentParser(description="Sync Claude Code hooks to target project")
    parser.add_argument("target_path", help="Path to target project directory")
    parser.add_argument("--method", choices=["auto", "symlink", "hardlink", "copy"], 
                       default="auto", help="Preferred sync method (default: auto)")
    parser.add_argument("--dry-run", action="store_true", 
                       help="Show what would be done without making changes")
    parser.add_argument("--verbose", "-v", action="store_true", 
                       help="Show detailed output")
    
    args = parser.parse_args()
    
    # Get source directory (where this script is located)
    source_root = Path(__file__).parent.resolve()
    target_path = Path(args.target_path).resolve()
    
    # Validate paths
    if not target_path.exists():
        print(f"Error: Target path does not exist: {target_path}")
        return 1
        
    if not target_path.is_dir():
        print(f"Error: Target path is not a directory: {target_path}")
        return 1
    
    # Create syncer and sync hooks
    syncer = HookSyncer(source_root, dry_run=args.dry_run, verbose=args.verbose)
    
    try:
        success = syncer.sync_hooks(target_path, args.method)
        syncer.print_summary()
        return 0 if success else 1
        
    except Exception as e:
        print(f"Error during sync: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())