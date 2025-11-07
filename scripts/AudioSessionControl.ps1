# AudioSessionControl.ps1
# Comprehensive WASAPI audio session management

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "list",

    [Parameter(Mandatory=$false)]
    [int]$ProcessId,

    [Parameter(Mandatory=$false)]
    [ValidateRange(0, 100)]
    [int]$Volume,

    [Parameter(Mandatory=$false)]
    [bool]$Mute
)

Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

namespace WASAPIControl
{
    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    class MMDeviceEnumeratorClass { }

    [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDeviceEnumerator
    {
        int NotImpl1();
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
    }

    [ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDevice
    {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    }

    [ComImport, Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionManager2
    {
        int NotImpl1();
        int NotImpl2();
        int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
    }

    [ComImport, Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionEnumerator
    {
        int GetCount(out int SessionCount);
        int GetSession(int SessionCount, out IAudioSessionControl Session);
    }

    [ComImport, Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionControl
    {
        int GetState(out int pRetVal);
        int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
        int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
        int GetGroupingParam(out Guid pRetVal);
        int SetGroupingParam([MarshalAs(UnmanagedType.LPStruct)] Guid Override, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
        int RegisterAudioSessionNotification(IntPtr NewNotifications);
        int UnregisterAudioSessionNotification(IntPtr NewNotifications);
    }

    [ComImport, Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioSessionControl2
    {
        // IAudioSessionControl methods
        int GetState(out int pRetVal);
        int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
        int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
        int GetGroupingParam(out Guid pRetVal);
        int SetGroupingParam([MarshalAs(UnmanagedType.LPStruct)] Guid Override, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
        int RegisterAudioSessionNotification(IntPtr NewNotifications);
        int UnregisterAudioSessionNotification(IntPtr NewNotifications);
        // IAudioSessionControl2 methods
        int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int GetProcessId(out uint pRetVal);
        int IsSystemSoundsSession();
        int SetDuckingPreference(bool optOut);
    }

    [ComImport, Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface ISimpleAudioVolume
    {
        int SetMasterVolume(float fLevel, ref Guid EventContext);
        int GetMasterVolume(out float pfLevel);
        int SetMute(bool bMute, ref Guid EventContext);
        int GetMute(out bool pbMute);
    }

    public class AudioSession
    {
        public int ProcessId { get; set; }
        public string ProcessName { get; set; }
        public string DisplayName { get; set; }
        public float Volume { get; set; }
        public bool IsMuted { get; set; }
        public int State { get; set; }
    }

    public class AudioSessionManager
    {
        public static AudioSession[] GetSessions()
        {
            var sessions = new System.Collections.Generic.List<AudioSession>();
            IMMDeviceEnumerator deviceEnumerator = null;
            IMMDevice speakers = null;
            IAudioSessionManager2 sessionManager = null;
            IAudioSessionEnumerator sessionEnumerator = null;

            try
            {
                deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorClass());
                deviceEnumerator.GetDefaultAudioEndpoint(0, 0, out speakers);

                Guid IID_IAudioSessionManager2 = typeof(IAudioSessionManager2).GUID;
                object obj;
                speakers.Activate(ref IID_IAudioSessionManager2, 0, IntPtr.Zero, out obj);
                sessionManager = (IAudioSessionManager2)obj;

                sessionManager.GetSessionEnumerator(out sessionEnumerator);

                int count;
                sessionEnumerator.GetCount(out count);

                for (int i = 0; i < count; i++)
                {
                    IAudioSessionControl sessionControl;
                    sessionEnumerator.GetSession(i, out sessionControl);

                    IAudioSessionControl2 sessionControl2 = sessionControl as IAudioSessionControl2;
                    ISimpleAudioVolume volumeControl = sessionControl as ISimpleAudioVolume;

                    if (sessionControl2 != null && volumeControl != null)
                    {
                        try
                        {
                            uint pid;
                            sessionControl2.GetProcessId(out pid);

                            if (pid == 0) continue; // System sounds

                            int state;
                            sessionControl2.GetState(out state);

                            string displayName;
                            sessionControl2.GetDisplayName(out displayName);

                            float volume;
                            volumeControl.GetMasterVolume(out volume);

                            bool isMuted;
                            volumeControl.GetMute(out isMuted);

                            string processName = "Unknown";
                            try
                            {
                                var process = System.Diagnostics.Process.GetProcessById((int)pid);
                                processName = process.ProcessName;
                            }
                            catch { }

                            sessions.Add(new AudioSession
                            {
                                ProcessId = (int)pid,
                                ProcessName = processName,
                                DisplayName = string.IsNullOrEmpty(displayName) ? processName : displayName,
                                Volume = volume * 100f,
                                IsMuted = isMuted,
                                State = state
                            });

                            Marshal.ReleaseComObject(volumeControl);
                            Marshal.ReleaseComObject(sessionControl2);
                        }
                        catch { }
                    }

                    if (sessionControl != null) Marshal.ReleaseComObject(sessionControl);
                }

                return sessions.ToArray();
            }
            finally
            {
                if (sessionEnumerator != null) Marshal.ReleaseComObject(sessionEnumerator);
                if (sessionManager != null) Marshal.ReleaseComObject(sessionManager);
                if (speakers != null) Marshal.ReleaseComObject(speakers);
                if (deviceEnumerator != null) Marshal.ReleaseComObject(deviceEnumerator);
            }
        }

        public static bool SetSessionVolume(int processId, float volume)
        {
            IMMDeviceEnumerator deviceEnumerator = null;
            IMMDevice speakers = null;
            IAudioSessionManager2 sessionManager = null;
            IAudioSessionEnumerator sessionEnumerator = null;

            try
            {
                deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorClass());
                deviceEnumerator.GetDefaultAudioEndpoint(0, 0, out speakers);

                Guid IID_IAudioSessionManager2 = typeof(IAudioSessionManager2).GUID;
                object obj;
                speakers.Activate(ref IID_IAudioSessionManager2, 0, IntPtr.Zero, out obj);
                sessionManager = (IAudioSessionManager2)obj;

                sessionManager.GetSessionEnumerator(out sessionEnumerator);

                int count;
                sessionEnumerator.GetCount(out count);

                for (int i = 0; i < count; i++)
                {
                    IAudioSessionControl sessionControl;
                    sessionEnumerator.GetSession(i, out sessionControl);

                    IAudioSessionControl2 sessionControl2 = sessionControl as IAudioSessionControl2;
                    ISimpleAudioVolume volumeControl = sessionControl as ISimpleAudioVolume;

                    if (sessionControl2 != null && volumeControl != null)
                    {
                        try
                        {
                            uint pid;
                            sessionControl2.GetProcessId(out pid);

                            if (pid == processId)
                            {
                                Guid guid = Guid.Empty;
                                volumeControl.SetMasterVolume(volume / 100f, ref guid);
                                Marshal.ReleaseComObject(volumeControl);
                                Marshal.ReleaseComObject(sessionControl2);
                                Marshal.ReleaseComObject(sessionControl);
                                return true;
                            }

                            Marshal.ReleaseComObject(volumeControl);
                            Marshal.ReleaseComObject(sessionControl2);
                        }
                        catch { }
                    }

                    if (sessionControl != null) Marshal.ReleaseComObject(sessionControl);
                }

                return false;
            }
            finally
            {
                if (sessionEnumerator != null) Marshal.ReleaseComObject(sessionEnumerator);
                if (sessionManager != null) Marshal.ReleaseComObject(sessionManager);
                if (speakers != null) Marshal.ReleaseComObject(speakers);
                if (deviceEnumerator != null) Marshal.ReleaseComObject(deviceEnumerator);
            }
        }

        public static bool SetSessionMute(int processId, bool mute)
        {
            IMMDeviceEnumerator deviceEnumerator = null;
            IMMDevice speakers = null;
            IAudioSessionManager2 sessionManager = null;
            IAudioSessionEnumerator sessionEnumerator = null;

            try
            {
                deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorClass());
                deviceEnumerator.GetDefaultAudioEndpoint(0, 0, out speakers);

                Guid IID_IAudioSessionManager2 = typeof(IAudioSessionManager2).GUID;
                object obj;
                speakers.Activate(ref IID_IAudioSessionManager2, 0, IntPtr.Zero, out obj);
                sessionManager = (IAudioSessionManager2)obj;

                sessionManager.GetSessionEnumerator(out sessionEnumerator);

                int count;
                sessionEnumerator.GetCount(out count);

                for (int i = 0; i < count; i++)
                {
                    IAudioSessionControl sessionControl;
                    sessionEnumerator.GetSession(i, out sessionControl);

                    IAudioSessionControl2 sessionControl2 = sessionControl as IAudioSessionControl2;
                    ISimpleAudioVolume volumeControl = sessionControl as ISimpleAudioVolume;

                    if (sessionControl2 != null && volumeControl != null)
                    {
                        try
                        {
                            uint pid;
                            sessionControl2.GetProcessId(out pid);

                            if (pid == processId)
                            {
                                Guid guid = Guid.Empty;
                                volumeControl.SetMute(mute, ref guid);
                                Marshal.ReleaseComObject(volumeControl);
                                Marshal.ReleaseComObject(sessionControl2);
                                Marshal.ReleaseComObject(sessionControl);
                                return true;
                            }

                            Marshal.ReleaseComObject(volumeControl);
                            Marshal.ReleaseComObject(sessionControl2);
                        }
                        catch { }
                    }

                    if (sessionControl != null) Marshal.ReleaseComObject(sessionControl);
                }

                return false;
            }
            finally
            {
                if (sessionEnumerator != null) Marshal.ReleaseComObject(sessionEnumerator);
                if (sessionManager != null) Marshal.ReleaseComObject(sessionManager);
                if (speakers != null) Marshal.ReleaseComObject(speakers);
                if (deviceEnumerator != null) Marshal.ReleaseComObject(deviceEnumerator);
            }
        }
    }
}
"@ -ErrorAction SilentlyContinue -WarningAction SilentlyContinue

try {
    switch ($Action) {
        "list" {
            $sessions = [WASAPIControl.AudioSessionManager]::GetSessions()
            $result = @()
            foreach ($session in $sessions) {
                $result += @{
                    Id = $session.ProcessId.ToString()
                    Name = $session.DisplayName
                    Pid = $session.ProcessId
                    Volume = [Math]::Round($session.Volume)
                    IsMuted = $session.IsMuted
                }
            }
            $result | ConvertTo-Json -Depth 10
        }
        "setvolume" {
            if (-not $ProcessId) {
                throw "ProcessId is required for setvolume action"
            }
            $success = [WASAPIControl.AudioSessionManager]::SetSessionVolume($ProcessId, $Volume)
            @{
                success = $success
                pid = $ProcessId
                volume = $Volume
            } | ConvertTo-Json
        }
        "setmute" {
            if (-not $ProcessId) {
                throw "ProcessId is required for setmute action"
            }
            $success = [WASAPIControl.AudioSessionManager]::SetSessionMute($ProcessId, $Mute)
            @{
                success = $success
                pid = $ProcessId
                muted = $Mute
            } | ConvertTo-Json
        }
    }
} catch {
    @{
        success = $false
        error = $_.Exception.Message
    } | ConvertTo-Json
    exit 1
}
