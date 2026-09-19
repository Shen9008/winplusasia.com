$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$seoNav = @'
<nav class="seo-nav" aria-label="Site map">
    <a href="/">Home</a>
    <a href="/products">Games</a>
    <a href="/promotions">Bonuses</a>
    <a href="/blog/">Blog</a>
    <a href="/help-center">Help</a>
    <a href="/about-us">About</a>
    <a href="/editorial-policy">Editorial standards</a>
    <a href="/privacy-policy">Privacy</a>
    <a href="/contact">Contact</a>
    <a href="/terms-conditions">Terms</a>
    <a href="/responsible-gaming">Responsible play</a>
</nav>
'@

$pages = @{
  'products.html' = @{ slug='products'; ogTitle='WinPlus Games: 2,800+ Slots & Live Casino | Play Now'; ogDesc='Browse the full WinPlus game library: 2,100+ slots, 320+ live dealer tables, 180+ jackpots & a 40-sport book. One wallet, instant play. 18+.' }
  'promotions.html' = @{ slug='promotions'; ogTitle='WinPlus Bonuses: Welcome Pack, Reloads & VIP | Claim Now'; ogDesc='Claim the WinPlus welcome pack, weekend reloads, live cashback & daily slot races. Real bonus terms, no hidden fees. Join WinPlus today. 18+.' }
  'about-us.html' = @{ slug='about-us'; ogTitle='About WinPlus Asia — Licensing, Team & Player Trust'; ogDesc='Meet the WinPlus Asia team behind winplusasia.com — our licensing, editorial standards, and how we keep WinPlus casino safe, fair and fast for Asia.' }
  'help-center.html' = @{ slug='help-center'; ogTitle='WinPlus Help Center — Login, KYC & Withdrawal FAQs'; ogDesc='Get instant answers on WinPlus login, KYC, deposits, withdrawals, bonus wagering & 2FA — 20+ FAQs answered by the WinPlus Asia support team, 24/7.' }
  'responsible-gaming.html' = @{ slug='responsible-gaming'; ogTitle='WinPlus Responsible Gambling: Limits & Safer-Play Tools'; ogDesc='See every WinPlus safer-play tool: deposit & loss limits, cool-off, self-exclusion, warning signs and free 24/7 help via BeGambleAware & GamCare.' }
  'contact.html' = @{ slug='contact'; ogTitle='Contact WinPlus Asia — Support, Press & Partnerships'; ogDesc='Reach the WinPlus Asia team for corrections, partnerships & press. Need account help? Open WinPlus live chat in the lobby for 24/7 support.' }
  'editorial-policy.html' = @{ slug='editorial-policy'; ogTitle='WinPlus Editorial Standards — How We Verify Every Fact'; ogDesc='See how the WinPlus Asia team verifies game RTP, bonus terms & licensing before publishing. Real methodology, named editors, full transparency.' }
  'privacy-policy.html' = @{ slug='privacy-policy'; ogTitle='WinPlus Asia Privacy Policy — Data & Cookies Explained'; ogDesc='How WinPlus Asia collects, uses and protects your data on winplusasia.com — cookies, hosting, third-party services and your privacy choices.' }
  'terms-conditions.html' = @{ slug='terms-conditions'; ogTitle='WinPlus Asia Website Terms — Rules for Using Our Site'; ogDesc='Terms for using winplusasia.com: content disclaimers, third-party operator links, eligibility, intellectual property and liability limits explained.' }
}

function Add-OgBlock {
  param($content, $title, $desc, $slug)
  if ($content -match 'property="og:title"') { return $content }
  $block = @"
    <meta property="og:title" content="$title">
    <meta property="og:description" content="$desc">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://winplusasia.com/$slug">
    <meta property="og:site_name" content="WinPlus Asia">
    <meta property="og:locale" content="en_US">
    <meta property="og:image" content="https://winplusasia.com/images/webp/hero-home.webp">
    <meta property="og:image:width" content="960">
    <meta property="og:image:height" content="540">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="$title">
    <meta name="twitter:description" content="$desc">
    <meta name="twitter:image" content="https://winplusasia.com/images/webp/hero-home.webp">
"@
  return ($content -replace '(<link rel="stylesheet" href="css/pro-max\.css\?v=20260831b">)', "`$1`n$block")
}

foreach ($file in $pages.Keys) {
  $path = Join-Path (Get-Location) $file
  if (-not (Test-Path $path)) { Write-Host "Missing $file"; continue }
  $content = Get-Content $path -Raw -Encoding UTF8
  $info = $pages[$file]
  $canonical = "https://winplusasia.com/$($info.slug)"
  $content = $content -replace '<link rel="canonical" href="https://winplusasia\.com/[^"]+">', "<link rel=`"canonical`" href=`"$canonical`">"
  $content = Add-OgBlock $content $info.ogTitle $info.ogDesc $info.slug
  if ($content -notmatch 'class="seo-nav"') {
    $content = $content -replace '(<div id="partial-header"></div>)', "$seoNav`n    `$1"
  }
  if ($content -notmatch 'rel="preload" as="image" href="images/webp/hero-home\.webp"') {
    $content = $content -replace '(<link rel="canonical" href="[^"]+">)', "`$1`n    <link rel=`"preload`" as=`"image`" href=`"images/webp/hero-home.webp`">"
  }
  $content = $content -replace '(<div class="page-hero__media">\s*\r?\n\s*<img src="images/webp/hero-home\.webp"[^>]*?)loading="lazy" ', '$1fetchpriority="high" '
  $content = $content -replace 'winplusasia\.com/([a-z-]+)\.html', 'winplusasia.com/$1'
  [System.IO.File]::WriteAllText($path, $content)
  Write-Host "Updated $file"
}

$index = Get-Content 'index.html' -Raw -Encoding UTF8
$index = $index -replace '<meta property="og:site_name" content="Fazal Abbas">', '<meta property="og:site_name" content="WinPlus Asia">'
if ($index -notmatch 'name="twitter:image"') {
  $index = $index -replace '(<meta name="twitter:description"[\s\S]*?18\+\.">)', "`$1`n    <meta name=`"twitter:image`" content=`"https://winplusasia.com/images/webp/hero-home.webp`">"
}
if ($index -notmatch 'class="seo-nav"') {
  $index = $index -replace '(<div id="partial-header"></div>)', "$seoNav`n    `$1"
}
$index = $index -replace '"name": "Fazal Abbas","jobTitle": "Online Casino Reviewer & Digital Content Writer"', '"@id": "https://winplusasia.com/#author-fazal", "name": "Fazal Abbas", "jobTitle": "Online Casino Reviewer & Digital Content Writer", "url": "https://winplusasia.com/about-us", "sameAs": ["https://winplusasia.com/about-us", "https://winplusasia.com/editorial-policy"]'
$index = $index -replace 'https://winplusasia\.com/about-us\.html', 'https://winplusasia.com/about-us'
$index = $index -replace 'https://winplusasia\.com/promotions\.html', 'https://winplusasia.com/promotions'
$index = $index -replace 'https://winplusasia\.com/contact\.html', 'https://winplusasia.com/contact'
[System.IO.File]::WriteAllText('index.html', $index)
Write-Host 'Updated index.html'

$blogIndex = 'blog/index.html'
if (Test-Path $blogIndex) {
  $b = Get-Content $blogIndex -Raw -Encoding UTF8
  if ($b -notmatch 'class="seo-nav"') { $b = $b -replace '(<div id="partial-header"></div>)', "$seoNav`n    `$1" }
  [System.IO.File]::WriteAllText($blogIndex, $b)
  Write-Host 'Updated blog/index.html'
}

Get-ChildItem -Path 'blog' -Recurse -Filter 'index.html' | ForEach-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  $orig = $c
  $c = $c -replace '"url": "https://winplusasia\.com/about-us\.html"', '"url": "https://winplusasia.com/about-us", "sameAs": ["https://winplusasia.com/about-us", "https://winplusasia.com/editorial-policy"]'
  if ($c -ne $orig) { [System.IO.File]::WriteAllText($_.FullName, $c); Write-Host "Updated $($_.Name)" }
}

$sitemap = Get-Content 'sitemap.xml' -Raw -Encoding UTF8
$sitemap = $sitemap -replace '\.html</loc>', '</loc>'
$sitemap = $sitemap -replace '<lastmod>2026-05-29</lastmod>', '<lastmod>2026-08-31</lastmod>'
$coreSlugs = @('products','promotions','about-us','editorial-policy','privacy-policy','contact','help-center','terms-conditions','responsible-gaming','blog')
foreach ($slug in $coreSlugs) {
  $needle = "<url><loc>https://winplusasia.com/$slug</loc><changefreq>"
  if ($sitemap.Contains($needle)) {
    $sitemap = $sitemap -replace "<url><loc>https://winplusasia.com/$slug</loc><changefreq>", "<url><loc>https://winplusasia.com/$slug</loc><lastmod>2026-08-31</lastmod><changefreq>"
  }
}
if ($sitemap -match '<url><loc>https://winplusasia.com/</loc><changefreq>') {
  $sitemap = $sitemap -replace '<url><loc>https://winplusasia.com/</loc><changefreq>', '<url><loc>https://winplusasia.com/</loc><lastmod>2026-08-31</lastmod><changefreq>'
}
[System.IO.File]::WriteAllText('sitemap.xml', $sitemap)
Write-Host 'Updated sitemap.xml'
