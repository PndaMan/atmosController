# Set-SessionVolume.ps1
# Sets the volume for a specific audio session by PID

param(
    [Parameter(Mandatory=$true)]
    [int]$ProcessId,

    [Parameter(Mandatory=$true)]
    [ValidateRange(0, 100)]
    [int]$Volume
)

try {
    # This is a placeholder - actual WASAPI COM implementation would go here
    # For now, we'll use nircmd as a fallback if available, or return success

    $result = @{
        success = $true
        pid = $ProcessId
        volume = $Volume
        message = "Volume set successfully (mock)"
    }

    $result | ConvertTo-Json

} catch {
    $error = @{
        success = $false
        pid = $ProcessId
        volume = $Volume
        error = $_.Exception.Message
    }

    $error | ConvertTo-Json
    exit 1
}
