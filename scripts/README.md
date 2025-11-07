# PowerShell Audio Control Scripts

These PowerShell scripts provide the bridge between Electron and Windows Audio Session API (WASAPI).

## Scripts

### Get-AudioSessions.ps1
Retrieves all active audio sessions (applications playing audio).

**Output**: JSON array of audio sessions with properties:
- `Id`: Unique identifier (process ID)
- `Name`: Application name or window title
- `Pid`: Process ID
- `Volume`: Volume level (0-100)
- `IsMuted`: Mute state (boolean)

### Set-SessionVolume.ps1
Sets the volume for a specific audio session.

**Parameters**:
- `-Pid`: Process ID of the target application
- `-Volume`: Volume level (0-100)

**Output**: JSON object with success status

### Set-SessionMute.ps1
Mutes or unmutes a specific audio session.

**Parameters**:
- `-Pid`: Process ID of the target application
- `-Mute`: Boolean mute state ($true or $false)

**Output**: JSON object with success status

### Get-MasterVolume.ps1
Gets the system master volume level.

**Output**: JSON object with volume property (0-100)

### Set-MasterVolume.ps1
Sets the system master volume level.

**Parameters**:
- `-Volume`: Volume level (0-100)

**Output**: JSON object with success status

## Development Notes

**Current Implementation**: The scripts currently use process enumeration and basic audio cmdlets. They provide a working proof-of-concept but have limitations:

- Volume control is simulated (returns success but doesn't actually change volume yet)
- Requires full WASAPI COM implementation for real audio control
- May require AudioDeviceCmdlets module for master volume control

**Future Enhancement**: Full WASAPI implementation using C# type definitions and COM interop for:
- Real-time volume control per application
- Accurate volume level reading
- Audio level monitoring for visualizer
- Lower latency

## Requirements

- Windows 10/11
- PowerShell 5.1 or later
- ExecutionPolicy set to allow script execution (handled automatically via -ExecutionPolicy Bypass flag)

## Optional Dependencies

For enhanced master volume control, install AudioDeviceCmdlets:
```powershell
Install-Module -Name AudioDeviceCmdlets
```

## Testing Scripts Manually

```powershell
# Get all audio sessions
.\Get-AudioSessions.ps1

# Set volume for PID 1234 to 50%
.\Set-SessionVolume.ps1 -Pid 1234 -Volume 50

# Mute PID 1234
.\Set-SessionMute.ps1 -Pid 1234 -Mute $true

# Get master volume
.\Get-MasterVolume.ps1

# Set master volume to 75%
.\Set-MasterVolume.ps1 -Volume 75
```
