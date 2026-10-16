$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$prefix = 'http://127.0.0.1:8766/'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

$contentTypes = @{
    '.css' = 'text/css; charset=utf-8'
    '.glb' = 'model/gltf-binary'
    '.html' = 'text/html; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.mp4' = 'video/mp4'
    '.svg' = 'image/svg+xml'
}

try {
    $listener.Start()
    Start-Process ($prefix + 'museum-fixed.html')
    Write-Host "Bao tang dang chay tai $($prefix)museum-fixed.html"
    Write-Host 'Dong cua so nay de tat may chu.'

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        try {
            if ($context.Request.HttpMethod -notin @('GET', 'HEAD')) {
                $response.StatusCode = 405
                $response.Close()
                continue
            }

            $relativePath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/')).Replace('/', '\')
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = 'index.html'
            }
            $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
            if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or
                -not [System.IO.File]::Exists($filePath)) {
                $response.StatusCode = 404
                $response.Close()
                continue
            }

            $file = [System.IO.File]::OpenRead($filePath)
            $start = [long]0
            $end = $file.Length - 1
            $rangeHeader = $context.Request.Headers['Range']
            if ($rangeHeader) {
                if ($rangeHeader -notmatch '^bytes=(\d*)-(\d*)$' -or
                    (-not $Matches[1] -and -not $Matches[2])) {
                    $response.StatusCode = 416
                    $response.AddHeader('Content-Range', "bytes */$($file.Length)")
                    $file.Dispose()
                    $response.Close()
                    continue
                }

                if ($Matches[1]) {
                    $start = [long]$Matches[1]
                } else {
                    $suffixLength = [long]$Matches[2]
                    $start = [Math]::Max(0, $file.Length - $suffixLength)
                }
                if ($Matches[2] -and $Matches[1]) {
                    $end = [Math]::Min([long]$Matches[2], $end)
                }
                if ($start -gt $end -or $start -ge $file.Length) {
                    $response.StatusCode = 416
                    $response.AddHeader('Content-Range', "bytes */$($file.Length)")
                    $file.Dispose()
                    $response.Close()
                    continue
                }
                $response.StatusCode = 206
                $response.AddHeader('Content-Range', "bytes $start-$end/$($file.Length)")
            }

            $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
            $response.ContentType = $contentTypes[$extension]
            if (-not $response.ContentType) {
                $response.ContentType = 'application/octet-stream'
            }
            $response.AddHeader('Accept-Ranges', 'bytes')
            $response.ContentLength64 = $end - $start + 1
            if ($context.Request.HttpMethod -eq 'GET') {
                $file.Position = $start
                $buffer = New-Object byte[] 65536
                $remaining = $response.ContentLength64
                while ($remaining -gt 0) {
                    $read = $file.Read($buffer, 0, [int][Math]::Min($buffer.Length, $remaining))
                    if ($read -eq 0) {
                        break
                    }
                    $response.OutputStream.Write($buffer, 0, $read)
                    $remaining -= $read
                }
            }
            $file.Dispose()
            $response.Close()
        } catch [System.IO.IOException] {
            Write-Verbose "Client closed the connection: $($_.Exception.Message)"
            $response.Abort()
        } catch {
            Write-Warning "Request failed: $($_.Exception.Message)"
            $response.Abort()
        }
    }
} catch {
    Write-Error "Could not start the local museum server: $($_.Exception.Message)"
    exit 1
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
