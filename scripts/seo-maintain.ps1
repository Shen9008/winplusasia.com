#!/usr/bin/env pwsh
<#
.SYNOPSIS
  WinPlus Asia — SEO maintenance: internal link, local asset, and sitemap parity checks (static site).

.DESCRIPTION
  Scans *.html (excluding node_modules) for href/src pointing at this site or root-relative paths,
  resolves them to filesystem paths (cache-busting ?query stripped), and reports missing targets.
  Optionally validates each sitemap.xml <loc> against files on disk.

.PARAMETER SiteRoot
  Repository root (folder containing index.html, sitemap.xml). Default: parent of /scripts.

.PARAMETER CheckSitemap
  If set, also verify each sitemap <loc> resolves to an existing index route or file.

.EXAMPLE
  pwsh -File scripts/seo-maintain.ps1
  pwsh -File scripts/seo-maintain.ps1 -CheckSitemap

.NOTES
  Run monthly (see seo-task.md Step 7.2). Exit code 1 when any check fails.
#>
param(
    [string] $SiteRoot = "",
    [switch] $CheckSitemap
)

$ErrorActionPreference = "Stop"

if (-not $SiteRoot) {
    $SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
    $SiteRoot = (Resolve-Path $SiteRoot).Path
}

$failed = New-Object System.Collections.Generic.List[string]

function Strip-QueryFragment {
    param([string] $Href)
    if (-not $Href) { return "" }
    $h = $Href -replace '#.*$', ''
    $h = $h -replace '\?.*$', ''
    return $h
}

function Resolve-SiteUrlToPath {
    param(
        [string] $UrlPath,
        [string] $Root
    )
    # Strip absolute origins used by this repo (SEO maintenance parity).
    $p = Strip-QueryFragment ([string]$UrlPath -replace '^https://(?:winplusasia\.com|pgasiagames\.com)', '')
    if ($null -eq $p -or $p -eq "" -or $p -eq "/") {
        return (Join-Path $Root "index.html")
    }
    $rel = $p.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $full = Join-Path $Root $rel
    if (Test-Path -LiteralPath $full -PathType Leaf) {
        return $full
    }
    $indexInDir = Join-Path $full "index.html"
    if (Test-Path -LiteralPath $indexInDir -PathType Leaf) {
        return $indexInDir
    }
    return $null
}

function Test-ResolvedFile {
    param([string] $Path)
    if (-not $Path) { return $false }
    return (Test-Path -LiteralPath $Path -PathType Leaf)
}

function Resolve-HrefFromFile {
    param(
        [string] $HtmlPath,
        [string] $Href
    )
    # Skip unrelated external origins (but validate winplusasia + legacy pgasiagames below).
    if ($Href -match '^(https?:)?//' -and $Href -notmatch '(winplusasia\.com|pgasiagames\.com)') {
        return @{ Ok = $true; Skip = $true }
    }
    if ($Href -match '^(mailto:|tel:|javascript:|data:)') {
        return @{ Ok = $true; Skip = $true }
    }

    if ($Href -match '^https://(?:winplusasia\.com|pgasiagames\.com)') {
        $pathOnly = $Href -replace '^https://(?:winplusasia\.com|pgasiagames\.com)', ''
        if ([string]::IsNullOrWhiteSpace($pathOnly)) { $pathOnly = "/" }
        $clean = Strip-QueryFragment $pathOnly
        $target = Resolve-SiteUrlToPath -UrlPath $clean -Root $SiteRoot
        $ok = Test-ResolvedFile -Path $target
        return @{ Ok = $ok; Skip = $false; Target = $target; Display = $Href }
    }

    if ($Href.StartsWith('/')) {
        $clean = Strip-QueryFragment $Href
        $target = Resolve-SiteUrlToPath -UrlPath $clean -Root $SiteRoot
        $ok = Test-ResolvedFile -Path $target
        return @{ Ok = $ok; Skip = $false; Target = $target; Display = $Href }
    }
    if ($Href.StartsWith('.')) {
        $clean = Strip-QueryFragment $Href
        $dir = Split-Path -Parent $HtmlPath
        try {
            $resolved = [System.IO.Path]::GetFullPath((Join-Path $dir $clean))
        } catch {
            return @{ Ok = $false; Skip = $false; Target = $null; Display = $Href }
        }
        $ok = Test-Path -LiteralPath $resolved -PathType Leaf
        return @{ Ok = $ok; Skip = $false; Target = $resolved; Display = $Href }
    }
    return @{ Ok = $true; Skip = $true }
}

$htmlFiles = Get-ChildItem -Path $SiteRoot -Recurse -Filter "*.html" -File |
    Where-Object { $_.FullName -notmatch '[\\/]\.git(\\|$)' -and $_.FullName -notmatch '[\\/]node_modules(\\|$)' }

$attrPattern = '(?:href|src)=["'']([^"'']+)["'']'

foreach ($file in $htmlFiles) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    foreach ($m in [regex]::Matches($text, $attrPattern)) {
        $val = $m.Groups[1].Value
        if ($val -eq "" -or $val.StartsWith("#")) { continue }

        if ($val.StartsWith("http://") -or $val.StartsWith("https://")) {
            $r = Resolve-HrefFromFile -HtmlPath $file.FullName -Href $val
            if ($r.Skip) { continue }
            if (-not $r.Ok) {
                $failed.Add("$( $file.FullName ): $($r.Display) -> MISSING (resolved $($r.Target)))")
            }
            continue
        }

        $r = Resolve-HrefFromFile -HtmlPath $file.FullName -Href $val
        if ($r.Skip) { continue }
        if (-not $r.Ok) {
            $failed.Add("$( $file.FullName ): $($r.Display) -> MISSING (resolved $($r.Target)))")
        }
    }
}

if ($CheckSitemap) {
    $mapPath = Join-Path $SiteRoot "sitemap.xml"
    if (-not (Test-Path -LiteralPath $mapPath)) {
        $failed.Add("sitemap.xml not found at $mapPath")
    } else {
        $xml = [xml](Get-Content -LiteralPath $mapPath -Raw -Encoding UTF8)
        foreach ($url in $xml.urlset.url) {
            $loc = $url.loc
            if (-not $loc) { continue }
            $target = Resolve-SiteUrlToPath -UrlPath $loc -Root $SiteRoot
            if (-not (Test-ResolvedFile -Path $target)) {
                $failed.Add("sitemap.xml loc: $loc -> MISSING (expected $target)")
            }
        }
    }
}

Write-Host "Site root: $SiteRoot"
Write-Host "HTML files scanned: $( $htmlFiles.Count )"
Write-Host "Sitemap check: $( $CheckSitemap )"
Write-Host "---"

if ($failed.Count -eq 0) {
    Write-Host "OK: no broken internal links or missing sitemap targets."
    exit 0
}

Write-Host "FAIL: $( $failed.Count ) issue(s))"
$failed | ForEach-Object { Write-Host "  $_" }
exit 1
