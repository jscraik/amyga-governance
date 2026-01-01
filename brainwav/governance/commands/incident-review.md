---
name: incident-review
description: Prepare a structured post-incident review referencing logs, metrics, and remediation tasks.
argument-hint: incident identifier (e.g. INC-742)
model: inherit
allowed-tools:
  - Bash(journalctl <service>*)
  - Fs.read(runbooks/**)
  - Fs.read(logs/**)
---
# Incident Review: $ARGUMENTS

## Summary
- Impacted services
- Timeline with UTC timestamps

## Evidence
- Metrics snapshot: !`if systemctl list-units --type=service --all | grep -q "<service>-$ARGUMENTS.service"; then journalctl -u <service>-$ARGUMENTS --since "24 hours ago" --no-pager | tail -n 20; else echo "No logs found: service <service>-$ARGUMENTS does not exist."; fi`
- Related runbooks: !`rg --files -g"*$ARGUMENTS*.md" runbooks`

## Remediation
- Completed actions
- Follow-up tasks
- Preventative measures
