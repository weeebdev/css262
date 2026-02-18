# Lecture 5: Bash Scripting & Automation

## Overview

This lecture introduces Bash shell scripting as the primary tool for automating system administration tasks on Linux. Students move from running individual commands to writing structured, reusable scripts that handle variables, control flow, text processing, and scheduled automation. By the end of this lecture, students will be able to write production-quality scripts for system maintenance, log analysis, and backup operations.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain the purpose and benefits of shell scripting
2. Write scripts with proper structure (shebang, permissions, strict mode)
3. Use variables, special variables, and positional parameters
4. Implement control flow with `if`/`elif`/`else`, `case`, and loops
5. Define and use functions with local scope
6. Process text using `grep`, `sed`, `awk`, `cut`, `sort`, and `uniq`
7. Build pipelines connecting multiple commands
8. Schedule automated tasks with cron and systemd timers
9. Apply error handling, debugging, and security best practices
10. Write real-world scripts for health monitoring, backups, and log analysis

## Topics Covered

### Part 1: Scripting Fundamentals

#### 1.1 What is a Shell Script?
- A text file containing shell commands executed sequentially
- Benefits: repeatability, automation, documentation, error reduction
- Bash (Bourne Again Shell) as the default Linux shell
- Check current shell: `echo $SHELL`

#### 1.2 Script Structure
- **Shebang** (`#!/bin/bash`): tells the kernel which interpreter to use
- Comments for documentation
- `set -euo pipefail`: strict mode for safer scripts
  - `-e`: exit immediately on error
  - `-u`: treat unset variables as errors
  - `-o pipefail`: catch errors in pipelines

#### 1.3 Running Scripts

```bash
# Method 1: Make executable
chmod +x script.sh
./script.sh

# Method 2: Invoke interpreter
bash script.sh

# Method 3: Source (runs in current shell)
source script.sh
. script.sh
```

**Key difference:** `./script.sh` runs in a subshell (isolated), while `source` runs in the current shell and can modify the environment.

#### 1.4 Variables

**Assignment (no spaces around `=`):**
```bash
NAME="Linux"
COUNT=42
FILES=$(ls /tmp)          # Command substitution
TODAY=$(date +%F)
```

**Usage:**
```bash
echo "Welcome to $NAME"
echo "Config: ${NAME}_config"     # Braces to delimit variable name
```

**Scope:**
```bash
MY_VAR="local only"               # Local to current shell
export MY_VAR="shared"            # Available to child processes
```

#### 1.5 Special Variables

| Variable | Description |
|----------|-------------|
| `$0` | Script name |
| `$1` - `$9` | Positional arguments |
| `$#` | Number of arguments |
| `$@` | All arguments (preserves quoting) |
| `$*` | All arguments (single string) |
| `$?` | Exit status of last command (0 = success) |
| `$$` | Current process PID |
| `$!` | PID of last background process |

#### 1.6 Input & Output

```bash
read -p "Enter name: " USERNAME       # Prompt for input
read -sp "Password: " PASS            # Silent input
read -t 10 -p "Quick! " ANSWER        # Timeout after 10s

echo "Simple output"
printf "%-20s %5d\n" "Label:" 42      # Formatted output
```

#### 1.7 Arithmetic

```bash
echo $((10 + 3))            # 13
echo $((10 / 3))            # 3 (integer only!)
((COUNT++))                  # Increment
RESULT=$(echo "scale=2; 10 / 3" | bc)  # Floating point via bc
```

### Part 2: Control Structures & Functions

#### 2.1 Conditionals

**if / elif / else:**
```bash
if [[ "$USAGE" -gt 90 ]]; then
    echo "CRITICAL"
elif [[ "$USAGE" -gt 75 ]]; then
    echo "WARNING"
else
    echo "OK"
fi
```

**Test operators:**

| Category | Operators |
|----------|-----------|
| Numeric | `-eq`, `-ne`, `-gt`, `-ge`, `-lt`, `-le` |
| String | `==`, `!=`, `-z` (empty), `-n` (non-empty) |
| File | `-e` (exists), `-f` (file), `-d` (dir), `-r` (readable), `-w` (writable), `-x` (executable) |
| Logical | `&&` (AND), `||` (OR), `!` (NOT) |

**case statement:**
```bash
case "$1" in
    start)   systemctl start myapp ;;
    stop)    systemctl stop myapp ;;
    *)       echo "Usage: $0 {start|stop}" ;;
esac
```

#### 2.2 Loops

**for loop:**
```bash
for USER in alice bob charlie; do
    useradd "$USER"
done

for FILE in /var/log/*.log; do
    echo "$FILE: $(du -sh "$FILE" | cut -f1)"
done

for ((i = 1; i <= 10; i++)); do
    echo "Iteration $i"
done
```

**while loop:**
```bash
while [[ $COUNT -lt 5 ]]; do
    echo "Count: $COUNT"
    ((COUNT++))
done

# Safe file reading
while IFS= read -r LINE; do
    echo "Processing: $LINE"
done < /etc/passwd
```

**until loop:**
```bash
until ping -c1 -W2 google.com &>/dev/null; do
    echo "Waiting for network..."
    sleep 5
done
```

#### 2.3 Functions

```bash
greet() {
    local NAME="$1"       # 'local' prevents global scope pollution
    echo "Hello, $NAME!"
}

greet "World"

# Return data via stdout capture
get_ip() {
    hostname -I | awk '{print $1}'
}
MY_IP=$(get_ip)
```

#### 2.4 Arrays

```bash
# Indexed array
SERVERS=("web01" "web02" "db01")
echo "${SERVERS[0]}"          # First element
echo "${#SERVERS[@]}"         # Length

# Associative array (Bash 4+)
declare -A PORTS
PORTS[http]=80
PORTS[ssh]=22

for SERVICE in "${!PORTS[@]}"; do
    echo "$SERVICE -> ${PORTS[$SERVICE]}"
done
```

### Part 3: Text Processing & Pipelines

#### 3.1 grep — Search Text

```bash
grep "error" /var/log/syslog             # Basic search
grep -i "error" /var/log/syslog          # Case-insensitive
grep -n "error" /var/log/syslog          # Line numbers
grep -c "error" /var/log/syslog          # Count matches
grep -r "TODO" project/                  # Recursive
grep -v "^#" config                      # Exclude comments
grep -E "failed|error" auth.log          # Extended regex (OR)
```

#### 3.2 cut, sort, uniq

```bash
cut -d: -f1 /etc/passwd                 # Extract field 1 (username)
sort -t: -k3 -n /etc/passwd             # Sort by UID numerically
sort data | uniq -c | sort -rn          # Count and rank occurrences
```

#### 3.3 sed — Stream Editor

```bash
sed 's/old/new/g' file.txt              # Replace all occurrences
sed -i 's/old/new/g' file.txt           # Edit in-place
sed -n '5,10p' file.txt                 # Print lines 5-10
sed '/^#/d; /^$/d' config               # Remove comments and blanks
```

#### 3.4 awk — Pattern Processing

```bash
awk '{print $1}' access.log                     # Print first field
awk -F: '{print $1, $3}' /etc/passwd            # Custom delimiter
awk '$3 > 1000' /etc/passwd                     # Filter by condition
awk '{sum += $10} END {print sum}' access.log   # Sum a column
```

#### 3.5 Pipelines & Redirection

```bash
command > file          # stdout to file (overwrite)
command >> file         # stdout to file (append)
command 2> file         # stderr to file
command &> file         # Both stdout and stderr
command1 | command2     # Pipe stdout of cmd1 to stdin of cmd2

# Process substitution
diff <(ls dir1) <(ls dir2)
```

### Part 4: Automation & Best Practices

#### 4.1 Cron — Task Scheduling

**Crontab format:**
```
minute hour day_of_month month day_of_week command
```

**Examples:**
```bash
crontab -e                                      # Edit crontab
30 2 * * * /opt/scripts/backup.sh               # Daily at 2:30 AM
*/15 * * * * /opt/scripts/health_check.sh       # Every 15 minutes
0 9 * * 1-5 /opt/scripts/daily_report.sh        # Weekdays at 9 AM
0 0 1 * * /opt/scripts/monthly_cleanup.sh       # Monthly at midnight
```

#### 4.2 Systemd Timers (Modern Alternative)

Timer unit + service unit provides logging, dependencies, and error handling:

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now backup.timer
systemctl list-timers --all
```

#### 4.3 Error Handling

```bash
set -euo pipefail                        # Strict mode

trap 'rm -rf "$TMPDIR"' EXIT            # Cleanup on exit

die() {                                  # Custom error function
    echo "ERROR: $1" >&2
    exit "${2:-1}"
}
```

#### 4.4 Debugging

```bash
bash -x script.sh         # Trace every command
bash -n script.sh         # Syntax check only
shellcheck script.sh      # Static analysis (catches common bugs)
```

#### 4.5 Security Best Practices

- **Quote all variables** to prevent word splitting and globbing
- **Validate inputs** — check format, reject unexpected values
- **Never use `eval` with user data** — use arrays for dynamic commands
- **Use `${VAR:?}` expansion** — fails if variable is empty (prevents `rm -rf /`)
- **Set restrictive permissions** — `chmod 700` for admin scripts
- **Use `mktemp` for temporary files** — secure random filenames
- **Log actions** — use `logger` for syslog integration
- **Never store passwords in scripts** — use secret files or environment variables

## Practical Exercises

### Exercise 1: User Management Script

Write a script that:
1. Accepts a username as an argument
2. Checks if the user already exists
3. Creates the user with a home directory
4. Sets a random password
5. Forces password change on first login
6. Logs the action

### Exercise 2: Log Analyzer

Write a script that:
1. Reads an access log file (passed as argument or default path)
2. Reports total number of requests
3. Lists top 10 IP addresses by request count
4. Summarizes HTTP status codes
5. Identifies the busiest hour
6. Outputs results in a formatted report

### Exercise 3: Backup Script with Rotation

Write a script that:
1. Compresses a target directory into a timestamped archive
2. Stores backups in a configurable location
3. Deletes backups older than N days (configurable)
4. Logs all operations
5. Sends an alert if backup fails

### Exercise 4: System Health Monitor

Write a script that:
1. Checks CPU load, memory usage, and disk space
2. Compares against configurable thresholds
3. Outputs a formatted status report
4. Returns non-zero exit code if any check fails
5. Can be scheduled via cron

## Troubleshooting Guide

### Common Issues and Solutions

**Problem:** Script won't execute — "Permission denied"
```bash
chmod +x script.sh
# Or run with: bash script.sh
```

**Problem:** "Bad interpreter: No such file or directory"
```bash
# Usually caused by Windows line endings (CRLF)
dos2unix script.sh
# Or: sed -i 's/\r$//' script.sh
```

**Problem:** "Unary operator expected" or "too many arguments"
```bash
# Caused by unquoted variables. Use:
if [[ "$VAR" == "value" ]]; then   # Double brackets + quotes
```

**Problem:** Script works manually but fails in cron
```bash
# Cron has a minimal PATH. Set it explicitly:
PATH=/usr/local/bin:/usr/bin:/bin
# Use full paths for all commands
# Redirect output for debugging:
* * * * * /opt/scripts/job.sh >> /var/log/job.log 2>&1
```

**Problem:** "Syntax error: unexpected end of file"
```bash
# Missing closing keywords. Check for:
# - Missing 'fi', 'done', 'esac'
# - Mismatched quotes
# Use: bash -n script.sh  to syntax-check
```

**Problem:** Variables empty or wrong values
```bash
# Debug with:
set -x                           # Trace mode
echo "DEBUG: VAR=$VAR" >&2       # Print state
```

## Key Commands Reference

### Script Execution
```bash
chmod +x script.sh           # Make executable
./script.sh                  # Run in subshell
bash script.sh               # Run with bash
source script.sh             # Run in current shell
bash -x script.sh            # Debug mode
bash -n script.sh            # Syntax check
shellcheck script.sh         # Static analysis
```

### Variables & Arithmetic
```bash
VAR="value"                  # Assign
export VAR                   # Export to children
echo "$VAR"                  # Use (always quote!)
echo $((2 + 3))             # Arithmetic
$(command)                   # Command substitution
${VAR:-default}              # Default if unset
${VAR:?error}                # Error if unset
```

### Control Flow
```bash
if [[ condition ]]; then ... elif ... else ... fi
case "$var" in pattern) ... ;; esac
for item in list; do ... done
for ((i=0; i<10; i++)); do ... done
while [[ condition ]]; do ... done
until [[ condition ]]; do ... done
```

### Text Processing
```bash
grep -E "pattern" file       # Search with regex
sed 's/old/new/g' file       # Search & replace
awk '{print $1}' file        # Column extraction
cut -d: -f1 file             # Field extraction
sort file                    # Sort lines
uniq -c                      # Count duplicates
wc -l file                   # Count lines
```

### Scheduling
```bash
crontab -e                   # Edit cron jobs
crontab -l                   # List cron jobs
systemctl list-timers        # List systemd timers
```

## Additional Resources

### Official Documentation
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/) - Complete reference
- [Bash Hackers Wiki](https://wiki.bash-hackers.org/) - Community-maintained guide
- [ShellCheck Wiki](https://github.com/koalaman/shellcheck/wiki) - Error explanations

### Style Guides & Best Practices
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html) - Industry standard
- [Bash Pitfalls](https://mywiki.wooledge.org/BashPitfalls) - Common mistakes to avoid
- [Bash FAQ](https://mywiki.wooledge.org/BashFAQ) - Frequently asked questions

### Books
- *"The Linux Command Line"* by William Shotts - Chapters on scripting
- *"Learning the Bash Shell"* by Cameron Newham - Comprehensive guide
- *"Wicked Cool Shell Scripts"* by Dave Taylor & Brandon Perry - Practical examples

### Online Practice
- [Exercism Bash Track](https://exercism.org/tracks/bash) - Coding exercises
- [HackerRank Shell Challenges](https://www.hackerrank.com/domains/shell) - Practice problems
- [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) - CTF-style shell challenges

## Questions for Review

1. What does the shebang (`#!/bin/bash`) do, and why is it important?
2. Explain `set -euo pipefail` — what does each flag do?
3. What is the difference between `$@` and `$*`?
4. When would you use `[[ ]]` instead of `[ ]`?
5. How do you safely read a file line by line in Bash?
6. What is the difference between `>` and `>>` redirection?
7. Write a `grep` + `awk` pipeline to find the top 5 IPs in an access log.
8. How do cron jobs differ from systemd timers?
9. Why should you always quote your variables?
10. How would you debug a script that works manually but fails in cron?

## Lab Assignment Ideas

1. **User Provisioning**: Script that reads a CSV file and creates user accounts with appropriate groups and permissions
2. **Log Analyzer**: Parse Apache/Nginx logs and generate a security report (failed logins, suspicious IPs, error rates)
3. **Backup Automation**: Backup script with LVM snapshots, compression, rotation, and email notifications
4. **System Inventory**: Script that collects hardware info, installed packages, running services, and open ports
5. **Security Auditor**: Script that checks password policies, file permissions, open ports, and running services against a baseline

---

**Instructor Notes:**
- Start with simple examples and build complexity gradually
- Emphasize quoting and `set -euo pipefail` from day one
- Live-code a script during the lecture — students learn more watching the process
- Show `shellcheck` output on intentionally buggy scripts
- Connect to CLO 2: every exercise should involve system maintenance or log processing
- Assign homework that builds on the log analysis and backup scripts shown in class
- Mention that Assignment 2 (Backup Tools) will require the skills from this lecture
