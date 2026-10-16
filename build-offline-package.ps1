$ErrorActionPreference = 'Stop'

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$archivePath = Join-Path $root 'bao-tang-ao-3d-offline.zip'
$packageFiles = @(
    'README.md',
    'museum-fixed.html',
    'museum-fixed.css',
    'museum-fixed.js',
    'NHDD 1.mp4',
    'phao.glb',
    'RGXM 1.mp4',
    'run-local.bat',
    'serve-local.ps1',
    'tuong3d.glb',
    'vendor/three/LICENSE',
    'vendor/three/three.min.js',
    'vendor/three/three.module.js',
    'vendor/three/examples/jsm/loaders/GLTFLoader.js',
    'vendor/three/examples/jsm/utils/BufferGeometryUtils.js'
)

foreach ($relativePath in $packageFiles) {
    $filePath = Join-Path $root ($relativePath.Replace('/', '\'))
    if (-not [System.IO.File]::Exists($filePath)) {
        throw "Required offline package file is missing: $relativePath"
    }
}

$archiveStream = $null
$archive = $null
try {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archiveStream = [System.IO.File]::Open(
        $archivePath,
        [System.IO.FileMode]::Create,
        [System.IO.FileAccess]::ReadWrite,
        [System.IO.FileShare]::None
    )
    $archive = [System.IO.Compression.ZipArchive]::new(
        $archiveStream,
        [System.IO.Compression.ZipArchiveMode]::Create
    )
    foreach ($relativePath in $packageFiles) {
        $sourcePath = Join-Path $root ($relativePath.Replace('/', '\'))
        $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $sourceStream = [System.IO.File]::OpenRead($sourcePath)
        try {
            $sourceStream.CopyTo($entryStream)
        } finally {
            $sourceStream.Dispose()
            $entryStream.Dispose()
        }
    }
} finally {
    if ($archive) {
        $archive.Dispose()
    }
    if ($archiveStream) {
        $archiveStream.Dispose()
    }
}

$archive = Get-Item -LiteralPath $archivePath
Write-Host ("Created {0} ({1:N1} MB)" -f $archive.Name, ($archive.Length / 1MB))
