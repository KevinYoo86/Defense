$root = (Resolve-Path $PSScriptRoot).Path
$port = 5501
$prefix = "http://127.0.0.1:$port/"

# Stop previous listener on same port if we own a leftover process is manual.
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix"

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.md'   = 'text/markdown; charset=utf-8'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $root $path))
    if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }
    if (Test-Path $full -PathType Container) { $full = Join-Path $full 'index.html' }
    if (-not (Test-Path $full -PathType Leaf)) {
      $msg = [Text.Encoding]::UTF8.GetBytes('Not Found')
      $ctx.Response.StatusCode = 404
      $ctx.Response.ContentType = 'text/plain; charset=utf-8'
      $ctx.Response.ContentLength64 = $msg.LongLength
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      $ctx.Response.Close()
      continue
    }

    $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
    $bytes = [IO.File]::ReadAllBytes($full)
    $ctx.Response.StatusCode = 200
    $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
    $ctx.Response.ContentLength64 = [int64]$bytes.LongLength
    $ctx.Response.SendChunked = $false
    $ctx.Response.KeepAlive = $false
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.OutputStream.Flush()
  } catch {
    try { $ctx.Response.StatusCode = 500 } catch {}
  } finally {
    try { $ctx.Response.Close() } catch {}
  }
}
