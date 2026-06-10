# =====================================================================
# print_image.ps1 — Silent print foto 4R ke printer Windows
# ---------------------------------------------------------------------
# Dipanggil dari backend Go via:
#   powershell -ExecutionPolicy Bypass -File print_image.ps1 \
#     -ImagePath "C:\path\to\file.jpg" \
#     -PrinterName "EPSON SL-D500 Series" \
#     -Copies 3
#
# Fitur:
#   - SILENT print (gak ada dialog pop-up)
#   - Force 4R paper size (4x6 inch = 102x152 mm)
#   - Qty multi-copies lewat PrinterSettings.Copies
#   - Image auto-scale fit + center (no stretch)
# =====================================================================

param(
    [Parameter(Mandatory=$true)][string]$ImagePath,
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [Parameter(Mandatory=$false)][int]$Copies = 1
)

$ErrorActionPreference = "Stop"

try {
    if (!(Test-Path $ImagePath)) {
        Write-Error "File gambar gak ketemu: $ImagePath"
        exit 1
    }

    # Cek printer ada
    $printer = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
    if (!$printer) {
        $available = Get-Printer | Select-Object -ExpandProperty Name
        Write-Error "Printer '$PrinterName' gak ketemu. Tersedia: $($available -join ', ')"
        exit 2
    }

    Add-Type -AssemblyName System.Drawing

    $img = [System.Drawing.Image]::FromFile($ImagePath)

    $pd = New-Object System.Drawing.Printing.PrintDocument
    $pd.PrinterSettings.PrinterName = $PrinterName
    $pd.PrinterSettings.Copies = [int16]$Copies
    $pd.PrintController = New-Object System.Drawing.Printing.StandardPrintController
    $pd.DocumentName = "Glambot Photo 4R"

    # ── FORCE 4R PAPER SIZE (4×6 inch = 400×600 in 1/100 inch unit) ──
    # Coba cari paper size 4x6 yang ke-define di driver Epson, fallback ke custom 4R
    $paperSize = $null
    foreach ($ps in $pd.PrinterSettings.PaperSizes) {
        # Cari paper yang match 4R: bisa nama "4x6", "4R", atau dimensi 400x600
        if ($ps.PaperName -match "4.*6" -or $ps.PaperName -match "4R" -or
            ($ps.Width -eq 400 -and $ps.Height -eq 600) -or
            ($ps.Width -eq 600 -and $ps.Height -eq 400)) {
            $paperSize = $ps
            Write-Output "INFO: Using driver paper size: $($ps.PaperName) ($($ps.Width)x$($ps.Height))"
            break
        }
    }

    # Fallback: bikin custom 4R kalo driver gak ada definisinya
    if (-not $paperSize) {
        $paperSize = New-Object System.Drawing.Printing.PaperSize("4R Custom", 400, 600)
        $paperSize.RawKind = [int][System.Drawing.Printing.PaperKind]::Custom
        Write-Output "INFO: Pake custom 4R paper size (400x600 / 4x6 inch)"
    }

    $pd.DefaultPageSettings.PaperSize = $paperSize
    # Set orientation Portrait (4R foto biasanya portrait)
    $pd.DefaultPageSettings.Landscape = $false
    # Margin 0 (borderless print kalo printer support)
    $margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
    $pd.DefaultPageSettings.Margins = $margins

    # Handler: scale image fit + center
    $pd.add_PrintPage({
        param($s, $e)
        $bounds = $e.PageBounds  # full page bound (since margin = 0)
        $imgRatio = $img.Width / $img.Height
        $boundRatio = $bounds.Width / $bounds.Height

        if ($imgRatio -gt $boundRatio) {
            $w = $bounds.Width
            $h = [int]($w / $imgRatio)
        } else {
            $h = $bounds.Height
            $w = [int]($h * $imgRatio)
        }
        $x = [int]($bounds.Left + ($bounds.Width - $w) / 2)
        $y = [int]($bounds.Top + ($bounds.Height - $h) / 2)
        $e.Graphics.DrawImage($img, $x, $y, $w, $h)
    })

    $pd.Print()
    $img.Dispose()

    Write-Output "OK: $Copies copies printed to $PrinterName (4R)"
    exit 0
}
catch {
    Write-Error "Print gagal: $_"
    exit 99
}