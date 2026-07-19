; Spotify Discord Fixer — Inno Setup script
; ISCC defines:
;   /DArch=x64|x86|arm64
;   /DSourceDir=...   (published UI folder)
;   /DOutName=...     (Setup.exe base name without extension)
;   /DMyAppVersion=2.0.1

#ifndef Arch
  #define Arch "x64"
#endif

#ifndef SourceDir
  #define SourceDir "..\dist\SpotifyDiscordFixer-win-x64"
#endif

#ifndef OutName
  #define OutName "Spotify-Discord-Fixer-Setup-2.0.1-win-x64"
#endif

#ifndef MyAppVersion
  #define MyAppVersion "2.0.1"
#endif

#define MyAppName "Spotify Discord Fixer"
#define MyAppPublisher "swd3k"
#define MyAppAuthorURL "https://github.com/swd3k"
#define MyAppURL "https://github.com/swd3k/spotify-discord-fixer"
#define MyAppExeName "SpotifyDiscordFixer.exe"
#define MyAppCopyright "Copyright (c) 2026 swd3k"

#if Arch == "x86"
  #define MyArchLabel "32-bit (x86)"
  #define MyArchitecturesAllowed "x86compatible"
  #define MyArchitecturesInstallIn64BitMode ""
  #define MyAppId "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567801}"
#elif Arch == "arm64"
  #define MyArchLabel "ARM64"
  #define MyArchitecturesAllowed "arm64"
  #define MyArchitecturesInstallIn64BitMode "arm64"
  #define MyAppId "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567802}"
#else
  #define MyArchLabel "64-bit (x64)"
  #define MyArchitecturesAllowed "x64compatible"
  #define MyArchitecturesInstallIn64BitMode "x64compatible"
  #define MyAppId "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567800}"
#endif

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion} ({#MyArchLabel})
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppAuthorURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}/releases
AppCopyright={#MyAppCopyright}
DefaultDirName={autopf}\SpotifyDiscordFixer
DefaultGroupName={#MyAppName}
UsePreviousAppDir=yes
UsePreviousGroup=yes
UsePreviousTasks=yes
DisableDirPage=auto
DisableProgramGroupPage=yes
DirExistsWarning=no
LicenseFile=..\LICENSE
OutputDir=..\dist\installers
OutputBaseFilename={#OutName}
SetupIconFile=..\src\SpotifyDiscordFixer.Ui\Assets\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
MinVersion=10.0
#if MyArchitecturesInstallIn64BitMode != ""
ArchitecturesAllowed={#MyArchitecturesAllowed}
ArchitecturesInstallIn64BitMode={#MyArchitecturesInstallIn64BitMode}
#else
ArchitecturesAllowed={#MyArchitecturesAllowed}
#endif
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} ({#MyArchLabel})
VersionInfoVersion={#MyAppVersion}.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoCopyright={#MyAppCopyright}
VersionInfoDescription={#MyAppName} Setup ({#MyArchLabel}) by {#MyAppPublisher}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}.0
VersionInfoTextVersion={#MyAppVersion}
CloseApplications=yes
CloseApplicationsFilter=SpotifyDiscordFixer.exe
RestartApplications=no
AllowNoIcons=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startupicon"; Description: "Start with Windows (tray, --hidden)"; GroupDescription: "Autostart:"; Flags: unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{group}\GitHub repository"; Filename: "{#MyAppURL}"
Name: "{group}\Author swd3k"; Filename: "{#MyAppAuthorURL}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "SpotifyDiscordFixer"; ValueData: """{app}\{#MyAppExeName}"" --hidden"; Flags: uninsdeletevalue; Tasks: startupicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent runascurrentuser

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
