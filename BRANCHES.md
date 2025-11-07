# Development Branches

This file documents the different audio implementation approaches being explored in separate branches.

## master
**Current Status**: Phase 2 Complete
- Mock audio implementation for UI testing
- Full volume mixer interface with sliders and controls
- Glass morphism design with animated glow effects
- Global hotkey: Alt+Shift+D

## Branch: powershell-bridge
**Approach**: PowerShell-based audio control via child process
**Status**: In Development

### Overview
Use PowerShell scripts to interact with Windows Audio Session API (WASAPI) through .NET classes. The Electron main process spawns PowerShell child processes to execute audio control commands.

### Pros
- No native module compilation required
- Leverages existing Windows PowerShell capabilities
- Can use AudioDeviceCmdlets module or custom scripts
- Easy to debug and test PowerShell scripts independently
- Cross-version compatibility with Electron

### Cons
- Higher latency than native bindings (process spawn overhead)
- Requires PowerShell to be available on system
- More complex error handling across process boundaries
- JSON serialization overhead for data exchange

### Implementation Plan
1. Create PowerShell scripts for audio operations:
   - Get all audio sessions
   - Set volume for session by PID
   - Mute/unmute session
   - Get/set master volume
2. Create Node.js service to spawn PowerShell processes
3. Implement IPC handlers to bridge renderer and PowerShell service
4. Test performance and latency
5. Add error handling and fallbacks

### Target Latency
- Volume change: <100ms
- Session list update: <200ms

---

## Branch: wasapi-native (Future)
**Approach**: Custom C++ native Node.js addon using WASAPI directly
**Status**: Not Started

### Overview
Build a custom native Node.js addon that directly interfaces with Windows WASAPI (Windows Audio Session API) using C++. This would be compiled specifically for the Electron version being used.

### Pros
- Lowest latency possible
- Full control over audio API
- Can implement real-time audio visualizer data
- No external dependencies

### Cons
- Complex C++ development
- Requires node-gyp toolchain setup
- Must be rebuilt for each Electron version
- Windows-specific (no cross-platform)
- Maintenance overhead

### Implementation Plan
1. Set up node-gyp with Windows SDK
2. Create C++ addon skeleton with N-API
3. Implement WASAPI session enumeration
4. Implement volume control methods
5. Add audio level meter support for visualizer
6. Package precompiled binaries for distribution

### Requirements
- Visual Studio Build Tools
- Windows SDK 10
- Node.js headers for Electron version
- Knowledge of COM programming and WASAPI

---

## Decision Matrix

| Approach | Latency | Complexity | Maintainability | Electron Compat | Visualizer Ready |
|----------|---------|------------|-----------------|-----------------|------------------|
| Mock (master) | N/A | Low | High | ✓ | ✗ |
| PowerShell Bridge | Medium | Medium | Medium | ✓ | ✗ |
| WASAPI Native | Low | High | Low | ⚠ | ✓ |

---

## Current Focus
Starting with **powershell-bridge** as it provides the best balance of functionality, compatibility, and development speed. This will allow us to:
1. Test real audio control with actual system applications
2. Validate the UI/UX with real data
3. Measure performance requirements
4. Determine if native bindings are necessary

If PowerShell bridge meets performance targets (<100ms volume changes), we may not need the complexity of native bindings. If performance is insufficient or we need real-time audio level data for the visualizer, we'll proceed with WASAPI native approach.
