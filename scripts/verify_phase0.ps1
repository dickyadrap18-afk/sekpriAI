$paths = @(
  'CLAUDE.md',
  'ARCHITECTURE.md',
  'WORKFLOW.md',
  'docs/sekpriAI_Source_of_Truth_Blueprint.md',
  '.claude/agents/code-architect.md',
  '.claude/agents/build-validator.md',
  '.claude/agents/code-simplifier.md',
  '.claude/agents/email-guide.md',
  '.claude/agents/verify-app.md',
  'specs/001-prd.md',
  'specs/002-design-spec.md',
  'specs/003-technical-spec.md',
  'specs/004-erd.md',
  'specs/005-ai-agent-spec.md',
  'specs/006-provider-integration-spec.md',
  'specs/007-telegram-whatsapp-spec.md',
  'specs/008-testing-spec.md',
  'specs/009-implementation-timeline.md'
)

$results = foreach ($p in $paths) {
  if (Test-Path $p) {
    $f = Get-Item $p
    $lines = (Get-Content $f.FullName | Measure-Object -Line).Lines
    [PSCustomObject]@{
      Path  = $p
      KB    = [math]::Round($f.Length / 1024, 1)
      Lines = $lines
      OK    = '+'
    }
  } else {
    [PSCustomObject]@{ Path = $p; KB = 0; Lines = 0; OK = 'MISSING' }
  }
}

$results | Format-Table -AutoSize
$missing = ($results | Where-Object { $_.OK -ne '+' }).Count
"Total files: $($results.Count) | Missing: $missing"
