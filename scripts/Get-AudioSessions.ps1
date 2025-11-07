# Get-AudioSessions.ps1
# Returns all active audio sessions as JSON

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

namespace AudioControl {
    public class AudioSession {
        public string Id { get; set; }
        public string Name { get; set; }
        public int Pid { get; set; }
        public float Volume { get; set; }
        public bool IsMuted { get; set; }
    }
}
"@ -ErrorAction SilentlyContinue -WarningAction SilentlyContinue

function Get-AudioSessions {
    $sessions = @()

    try {
        # Load Windows Audio API
        Add-Type -AssemblyName 'System.Runtime.InteropServices'

        # Use WMI to get process information for audio apps
        $audioProcesses = Get-Process | Where-Object {
            $_.MainWindowTitle -ne "" -or
            $_.ProcessName -match "spotify|chrome|discord|firefox|vlc|musicbee|foobar|winamp|itunes|msedge"
        } | Select-Object ProcessName, Id, MainWindowTitle -Unique

        foreach ($proc in $audioProcesses) {
            # Create a mock session for now (will be replaced with actual WASAPI COM calls)
            $session = [AudioControl.AudioSession]@{
                Id = $proc.Id.ToString()
                Name = if ($proc.MainWindowTitle) { $proc.MainWindowTitle } else { $proc.ProcessName }
                Pid = $proc.Id
                Volume = 100.0
                IsMuted = $false
            }
            $sessions += $session
        }
    } catch {
        Write-Error "Failed to enumerate audio sessions: $_"
    }

    return $sessions | ConvertTo-Json -Depth 10
}

# Execute and output
Get-AudioSessions
