param(
  [string]$Type = "uncommitted",
  [string]$Dir = "web"
)

if ($Type -notmatch '^[A-Za-z0-9_-]+$') {
  throw "Invalid review type. Use letters, numbers, underscores, or hyphens only."
}

if ($Dir -notmatch '^[A-Za-z0-9_./-]+$') {
  throw "Invalid review directory. Use a simple relative path."
}

$command = @"
export TERM=xterm-256color
export COLUMNS=120
export LINES=40
stty cols 120 rows 40 2>/dev/null || true
~/.local/bin/coderabbit review --agent --type $Type --dir $Dir
"@

wsl.exe -e sh -lc $command
