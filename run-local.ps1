param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $root.TrimEnd('\') + '\'
$port = 8000
$url = "http://127.0.0.1:$port/"
$compressedModelCache = @{}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.mjs' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg' = 'image/svg+xml'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.gif' = 'image/gif'
  '.mp4' = 'video/mp4'
  '.webm' = 'video/webm'
  '.glb' = 'model/gltf-binary'
  '.gltf' = 'model/gltf+json'
  '.docx' = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  '.pdf' = 'application/pdf'
}

try {
  $listener.Start()
} catch {
  Write-Error "Could not start the local server at $url. Close any other app using port $port, then try again. $($_.Exception.Message)"
  exit 1
}

Write-Host "Museum running at $url"
Write-Host 'Press Ctrl+C in this window to stop the server.'
if (-not $NoBrowser) {
  Start-Process $url
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    $stream = $null

    try {
      $relativePath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/')).Replace('/', '\')
      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = 'index.html'
      }

      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
      if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and $filePath -ne (Join-Path $root 'index.html')) {
        $response.StatusCode = 403
      } elseif (-not [System.IO.File]::Exists($filePath)) {
        $response.StatusCode = 404
      } else {
        $file = New-Object System.IO.FileInfo($filePath)
        $response.ContentType = $contentTypes[[System.IO.Path]::GetExtension($filePath).ToLowerInvariant()]
        if (-not $response.ContentType) {
          $response.ContentType = 'application/octet-stream'
        }
        $response.Headers['Cache-Control'] = 'no-store'
        $response.Headers['Accept-Ranges'] = 'bytes'

        $start = 0L
        $end = $file.Length - 1
        $rangeHeader = $context.Request.Headers['Range']
        $acceptsGzip = $context.Request.Headers['Accept-Encoding'] -match '(^|,)\s*gzip(?:\s*;|\s*,|$)'
        if ($file.Extension -eq '.glb' -and $acceptsGzip -and -not $rangeHeader) {
          $cacheKey = $file.FullName
          $cachedModel = $compressedModelCache[$cacheKey]
          if (-not $cachedModel -or $cachedModel.Length -ne $file.Length -or $cachedModel.LastWriteTimeUtc -ne $file.LastWriteTimeUtc) {
            $sourceStream = [System.IO.File]::OpenRead($filePath)
            $compressedStream = New-Object System.IO.MemoryStream
            $gzipStream = New-Object System.IO.Compression.GzipStream($compressedStream, [System.IO.Compression.CompressionLevel]::Fastest)
            try {
              $sourceStream.CopyTo($gzipStream)
            } finally {
              $gzipStream.Dispose()
              $sourceStream.Dispose()
            }
            $compressedModelCache[$cacheKey] = @{
              Length = $file.Length
              LastWriteTimeUtc = $file.LastWriteTimeUtc
              Bytes = $compressedStream.ToArray()
            }
            $compressedStream.Dispose()
            $cachedModel = $compressedModelCache[$cacheKey]
          }

          $response.Headers['Content-Encoding'] = 'gzip'
          $response.Headers['Vary'] = 'Accept-Encoding'
          $response.ContentLength64 = $cachedModel.Bytes.Length
          if ($context.Request.HttpMethod -ne 'HEAD') {
            $response.OutputStream.Write($cachedModel.Bytes, 0, $cachedModel.Bytes.Length)
          }
        } else {
          if ($rangeHeader -and $rangeHeader -match '^bytes=(\d*)-(\d*)$') {
            $rangeStart = $Matches[1]
            $rangeEnd = $Matches[2]
            if (-not $rangeStart -and $rangeEnd) {
              $start = [Math]::Max(0, $file.Length - [long]$rangeEnd)
            } elseif ($rangeStart) {
              $start = [long]$rangeStart
              if ($rangeEnd) {
                $end = [long]$rangeEnd
              }
            }

            if ($start -gt $end -or $start -ge $file.Length) {
              $response.StatusCode = 416
              $response.Headers['Content-Range'] = "bytes */$($file.Length)"
            } else {
              $end = [Math]::Min($end, $file.Length - 1)
              $response.StatusCode = 206
              $response.Headers['Content-Range'] = "bytes $start-$end/$($file.Length)"
              $response.ContentLength64 = $end - $start + 1
            }
          } else {
            $response.ContentLength64 = $file.Length
          }

          if ($response.StatusCode -ne 416 -and $context.Request.HttpMethod -ne 'HEAD') {
            $stream = [System.IO.File]::OpenRead($filePath)
            [void]$stream.Seek($start, [System.IO.SeekOrigin]::Begin)
            $buffer = New-Object byte[] 65536
            $remaining = $response.ContentLength64
            while ($remaining -gt 0) {
              $count = [Math]::Min($buffer.Length, $remaining)
              $read = $stream.Read($buffer, 0, [int]$count)
              if ($read -le 0) {
                break
              }
              $response.OutputStream.Write($buffer, 0, $read)
              $remaining -= $read
            }
          }
        }
      }
    } catch {
      Write-Warning "Request failed for $($context.Request.Url.AbsolutePath): $($_.Exception.Message)"
      $response.StatusCode = 500
    } finally {
      if ($stream) {
        $stream.Dispose()
      }
      $response.Close()
    }
  }
} finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
