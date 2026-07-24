# Generates the PWA icon set with GDI+ so the repo has no image-toolchain
# dependency. Run `npm run icons` (or this script directly) after changing the
# emblem; the PNGs are committed, so a normal build never needs it.
#
# Emblem: an eight-tooth Beyblade gear in ember/gold on the deep indigo ground,
# which reads clearly at 48px on a home screen.

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$outDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'public'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function New-Icon {
    param(
        [int]$Size,
        [string]$Path,
        [double]$Scale = 1.0,   # emblem size relative to canvas
        [switch]$Maskable
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # --- background: deep indigo with a violet bloom toward the top ---
    $g.Clear([System.Drawing.Color]::FromArgb(255, 26, 11, 46))

    $bloom = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bloom.AddEllipse(-$Size * 0.25, -$Size * 0.55, $Size * 1.5, $Size * 1.5)
    $bloomBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($bloom)
    $bloomBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 61, 22, 112)
    $bloomBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 26, 11, 46))
    $g.FillPath($bloomBrush, $bloom)
    $bloomBrush.Dispose(); $bloom.Dispose()

    $cx = $Size / 2.0
    $cy = $Size / 2.0
    $r = $Size * 0.42 * $Scale

    # --- outer gold ring ---
    $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 201, 74)), ($Size * 0.05 * $Scale)
    $g.DrawEllipse($ringPen, [float]($cx - $r), [float]($cy - $r), [float]($r * 2), [float]($r * 2))
    $ringPen.Dispose()

    # --- eight-tooth gear ---
    $teeth = 8
    $outer = $r * 0.80
    $inner = $r * 0.52
    $pts = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt $teeth * 2; $i++) {
        $rad = if ($i % 2 -eq 0) { $outer } else { $inner }
        $a = ($i / ($teeth * 2.0)) * [Math]::PI * 2 - [Math]::PI / 2
        [void]$pts.Add((New-Object System.Drawing.PointF([float]($cx + [Math]::Cos($a) * $rad), [float]($cy + [Math]::Sin($a) * $rad))))
    }
    $gearPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gearPath.AddPolygon([System.Drawing.PointF[]]$pts.ToArray())

    $gearBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($gearPath)
    $gearBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 255, 241, 201)
    $gearBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(255, 214, 31, 31))
    $g.FillPath($gearBrush, $gearPath)

    $gearPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 107, 53)), ($Size * 0.022 * $Scale)
    $g.DrawPath($gearPen, $gearPath)
    $gearBrush.Dispose(); $gearPen.Dispose(); $gearPath.Dispose()

    # --- hub ---
    $hub = $r * 0.24
    $hubBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillEllipse($hubBrush, [float]($cx - $hub), [float]($cy - $hub), [float]($hub * 2), [float]($hub * 2))
    $hubBrush.Dispose()

    $hubPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 46, 99)), ($Size * 0.02 * $Scale)
    $g.DrawEllipse($hubPen, [float]($cx - $hub), [float]($cy - $hub), [float]($hub * 2), [float]($hub * 2))
    $hubPen.Dispose()

    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "wrote $Path"
}

New-Icon -Size 192 -Path (Join-Path $outDir 'icon-192.png')
New-Icon -Size 512 -Path (Join-Path $outDir 'icon-512.png')
New-Icon -Size 180 -Path (Join-Path $outDir 'apple-touch-icon.png')
# Maskable icons get cropped to a circle on many launchers: keep the emblem
# inside the central safe zone.
New-Icon -Size 512 -Path (Join-Path $outDir 'icon-maskable-512.png') -Scale 0.68 -Maskable
