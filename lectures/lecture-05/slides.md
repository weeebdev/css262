---
theme: default
background: https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 5
  Linux Administration & *nix Systems for Cybersecurity

  Bash Scripting & Automation
drawings:
  persist: false
transition: slide-left
title: 'Lecture 5: Bash Scripting & Automation'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Bash Scripting & Automation

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 5: Automate All the Things
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon:edit />
  </button>
</div>

---
layout: default
---

# 📋 Today's Agenda

<div class="grid grid-cols-2 gap-6 text-sm">

<div>

### Part 1: Scripting Fundamentals
- What is a shell script?
- Shebang, execution, and permissions
- Variables & data types
- User input & output

</div>

<div>

### Part 2: Control Structures & Functions
- Conditionals (`if`, `case`)
- Loops (`for`, `while`, `until`)
- Functions & scope
- Arrays & string operations

</div>

</div>

<div class="grid grid-cols-2 gap-6 text-sm mt-2">

<div>

### Part 3: Text Processing & Pipelines
- `grep`, `sed`, `awk`, `cut`
- Regular expressions
- Pipelines & redirection

</div>

<div>

### Part 4: Automation & Best Practices
- Cron jobs & scheduling
- Real-world scripts
- Error handling & debugging
- Security considerations

</div>

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🎯 <strong>Learning Objective:</strong> Develop automated solutions for system maintenance and log processing using Bash scripting.
</div>

---
layout: default
---

# 🔄 Quick Recap: Week 4

<v-clicks>

### Storage, Filesystems & LVM

- **Storage Hierarchy**: Physical disks → Partitions → Filesystems
- **Partition Tables**: MBR (legacy) vs GPT (modern standard)
- **Filesystems**: ext4 (general), XFS (performance), Btrfs (snapshots)
- **Mounting**: Manual `mount` and persistent `/etc/fstab`
- **LVM**: Flexible storage with PV → VG → LV architecture
- **Snapshots**: Point-in-time copies for consistent backups

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ You should now be comfortable managing storage, filesystems, and LVM volumes!
</div>

---
layout: section
---

# Part 1: Scripting Fundamentals
## Your First Bash Scripts

---
layout: default
---

# 🐚 What is a Shell Script?

<v-clicks>

A **shell script** is a text file containing a sequence of commands that the shell executes.

### Why Script?

- **Repeatability**: Run the same tasks consistently
- **Automation**: Schedule tasks to run unattended
- **Efficiency**: Combine many commands into one action
- **Documentation**: Scripts document your procedures
- **Error Reduction**: Eliminate human mistakes

### The Bash Shell

- **Bash** = Bourne Again Shell (default on most Linux distros)
- Superset of the original Bourne shell (`sh`)
- Available at `/bin/bash`
- Check your shell: `echo $SHELL`

</v-clicks>

---
layout: default
---

# 📜 Anatomy of a Script

<div class="text-sm">

```bash
#!/bin/bash
# backup.sh - Simple backup script
# Author: sysadmin | Date: 2025-01-15

set -euo pipefail

BACKUP_DIR="/backup"
SOURCE_DIR="/var/www"
DATE=$(date +%Y%m%d_%H%M%S)
ARCHIVE="${BACKUP_DIR}/www_${DATE}.tar.gz"

mkdir -p "$BACKUP_DIR"
tar czf "$ARCHIVE" "$SOURCE_DIR"

echo "Backup complete: $ARCHIVE"
```

</div>

<div class="grid grid-cols-3 gap-2 mt-2 text-xs">

<div v-click class="p-2 bg-blue-500 bg-opacity-20 rounded">
<strong>Line 1:</strong> Shebang (<code>#!/bin/bash</code>) — tells the kernel which interpreter to use
</div>

<div v-click class="p-2 bg-green-500 bg-opacity-20 rounded">
<strong>Line 5:</strong> <code>set -euo pipefail</code> — strict mode for safer scripts
</div>

<div v-click class="p-2 bg-yellow-500 bg-opacity-20 rounded">
<strong>Lines 7-9:</strong> Variables store configuration — easy to modify
</div>

</div>

---
layout: default
---

# ▶️ Running Scripts

<div class="text-sm">

<v-clicks>

### Method 1: Make it Executable

```bash
chmod +x backup.sh
./backup.sh
```

### Method 2: Invoke the Interpreter

```bash
bash backup.sh
```

### Method 3: Source (runs in current shell)

```bash
source backup.sh
# or
. backup.sh
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Key Difference:</strong> <code>./script.sh</code> runs in a subshell (isolated), while <code>source script.sh</code> runs in the current shell (can modify your environment).
</div>

---
layout: default
---

# 📦 Variables

<div class="text-sm">

<v-clicks>

### Assigning Variables (no spaces around `=`)

```bash
NAME="Linux"              # String
COUNT=42                  # Integer (still stored as string)
FILES=$(ls /tmp)          # Command substitution
TODAY=$(date +%F)         # Command substitution
```

### Using Variables

```bash
echo "Welcome to $NAME"
echo "File count: ${COUNT}"       # Braces for clarity
echo "Config: ${NAME}_config"     # Braces to delimit name
```

### Environment vs Local Variables

```bash
MY_VAR="local only"           # Local to current shell
export MY_VAR="shared"        # Available to child processes
env                           # Show all environment variables
```

</v-clicks>

</div>

---
layout: default
---

# 🔢 Special Variables

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

| Variable | Description |
|----------|-------------|
| `$0` | Script name |
| `$1` - `$9` | Positional arguments |
| `$#` | Number of arguments |
| `$@` | All args (preserves quoting) |
| `$*` | All args (single string) |
| `$?` | Exit status of last command |
| `$$` | Current process PID |
| `$!` | PID of last background process |

</div>

<div>

### Example

```bash
#!/bin/bash
echo "Script: $0"
echo "First arg: $1"
echo "All args ($#): $@"
echo "Last exit code: $?"
```

</div>

</div>

---
layout: default
---

# 💬 Input & Output

<div class="text-sm">

<v-clicks>

### Reading User Input

```bash
read -p "Enter your name: " USERNAME
echo "Hello, $USERNAME!"
read -sp "Password: " PASS       # -s = silent (no echo)
echo                              # newline after hidden input
read -t 10 -p "Quick! " ANSWER   # -t = timeout (seconds)
```

### Output Commands

```bash
echo "Simple output"
echo -e "Tabs:\tand\nnewlines"    # -e enables escape sequences

printf "%-20s %5d\n" "Users:" 42  # Formatted output
printf "%-20s %5d\n" "Groups:" 7
```

### Redirecting Output

```bash
echo "log entry" >> /var/log/app.log    # Append
echo "fresh start" > /var/log/app.log   # Overwrite
command 2>/dev/null                      # Discard errors
```

</v-clicks>

</div>

---
layout: default
---

# 🧮 Arithmetic

<div class="text-sm">

<v-clicks>

### Arithmetic Expansion `$(( ))`

```bash
A=10
B=3
echo "Sum: $((A + B))"           # 13
echo "Diff: $((A - B))"          # 7
echo "Product: $((A * B))"       # 30
echo "Division: $((A / B))"      # 3 (integer only!)
echo "Modulo: $((A % B))"        # 1
echo "Power: $((A ** B))"        # 1000
```

### Increment / Decrement

```bash
((COUNT++))                       # Increment
((COUNT--))                       # Decrement
((COUNT += 5))                    # Add 5
```

### Floating Point (use `bc`)

```bash
RESULT=$(echo "scale=2; 10 / 3" | bc)
echo "$RESULT"                    # 3.33
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Tip:</strong> Bash only supports integer math. For floating point, use <code>bc</code> or <code>awk</code>.
</div>

---
layout: section
---

# Part 2: Control Structures & Functions
## Making Decisions and Repeating Tasks

---
layout: default
---

# 🔀 Conditionals: `if` / `elif` / `else`

<div class="text-sm">

<v-clicks>

### Basic Syntax

```bash
if [[ condition ]]; then
    # commands
elif [[ condition ]]; then
    # commands
else
    # commands
fi
```

### Example: Check Disk Usage

```bash
USAGE=$(df / --output=pcent | tail -1 | tr -d '% ')

if [[ "$USAGE" -gt 90 ]]; then
    echo "CRITICAL: Disk usage at ${USAGE}%!"
elif [[ "$USAGE" -gt 75 ]]; then
    echo "WARNING: Disk usage at ${USAGE}%"
else
    echo "OK: Disk usage at ${USAGE}%"
fi
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Prefer <code>[[ ]]</code></strong> over <code>[ ]</code> — it supports regex, pattern matching, and avoids word-splitting issues.
</div>

---
layout: default
---

# 🧪 Test Operators

<div class="text-sm grid grid-cols-3 gap-4">

<div>

### Numeric Comparisons

| Operator | Meaning |
|----------|---------|
| `-eq` | Equal |
| `-ne` | Not equal |
| `-gt` | Greater than |
| `-ge` | Greater or equal |
| `-lt` | Less than |
| `-le` | Less or equal |

</div>

<div>

### String Comparisons

| Operator | Meaning |
|----------|---------|
| `==` | Equal |
| `!=` | Not equal |
| `-z` | Empty string |
| `-n` | Non-empty string |
| `<` / `>` | Lexicographic |

</div>

<div>

### Logical Operators

| Operator | Meaning |
|----------|---------|
| `&&` | AND |
| `\|\|` | OR |
| `!` | NOT |

</div>

</div>

---
layout: default
---

# 🧪 Test Operators: File Tests

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### File Tests

| Operator | Meaning |
|----------|---------|
| `-e` | File exists |
| `-f` | Is regular file |
| `-d` | Is directory |
| `-r` | Is readable |
| `-w` | Is writable |
| `-x` | Is executable |
| `-s` | File is non-empty |
| `-L` | Is symbolic link |

</div>

<div>

### Example

```bash
if [[ -f "/etc/passwd" ]]; then
    echo "File exists"
fi

if [[ -d "/tmp" && -w "/tmp" ]]; then
    echo "Dir is writable"
fi
```

</div>

</div>

---
layout: default
---

# 🔄 The `case` Statement

<div class="text-sm">

### Syntax

```text
case "$variable" in
  pattern1)  commands ;;
  pattern2)  commands ;;
  *)         default commands ;;
esac
```

### Example: Service Control

```text
#!/bin/bash
case "$1" in
  start)   systemctl start myapp ;;
  stop)    systemctl stop myapp ;;
  restart) systemctl restart myapp ;;
  status)  systemctl status myapp ;;
  *)       echo "Usage: $0 start|stop|restart|status"; exit 1 ;;
esac
```

</div>

---
layout: default
---

# 🔁 Loops: `for`

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### C-Style For Loop

```bash
for ((i = 1; i <= 5; i++)); do
    echo "Iteration $i"
done
```

### Iterate Over a List

```bash
for USER in alice bob charlie; do
    echo "Creating user: $USER"
    useradd "$USER"
done
```

</div>

<div>

### Iterate Over Files

```bash
for FILE in /var/log/*.log; do
    SIZE=$(du -sh "$FILE" | cut -f1)
    echo "$FILE: $SIZE"
done
```

### Range

```bash
for i in {1..10}; do
    echo "Server-$i"
done
```

</div>

</div>

---
layout: default
---

# 🔁 Loops: `while` & `until`

<div class="text-sm">

<v-clicks>

### `while` — Loop While Condition is True

```bash
COUNT=0
while [[ $COUNT -lt 5 ]]; do
    echo "Count: $COUNT"
    ((COUNT++))
done
```

### Reading a File Line by Line

```bash
while IFS= read -r LINE; do
    echo "Processing: $LINE"
done < /etc/passwd
```

### `until` — Loop Until Condition is True

```bash
until ping -c1 -W2 google.com &>/dev/null; do
    echo "Waiting for network..."
    sleep 5
done
echo "Network is up!"
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Tip:</strong> <code>while IFS= read -r LINE</code> is the safe way to read files — it preserves whitespace and backslashes.
</div>

---
layout: default
---

# 🧩 Functions

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Defining Functions

```bash
greet() {
    local NAME="$1"
    echo "Hello, $NAME!"
}
greet "World"
```

### Return Values

```bash
is_root() {
    [[ $(id -u) -eq 0 ]]
}
if is_root; then
    echo "Running as root"
else
    echo "Not root"; exit 1
fi
```

</div>

<div>

### Returning Data (stdout capture)

```bash
get_ip() {
    hostname -I | awk '{print $1}'
}
MY_IP=$(get_ip)
echo "Server IP: $MY_IP"
```

<div class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded">
💡 Always use <code>local</code> for function variables to avoid polluting the global scope.
</div>

</div>

</div>

---
layout: default
---

# 📚 Arrays

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Indexed Arrays

```bash
SERVERS=("web01" "web02" "db01")

echo "${SERVERS[0]}"        # web01
echo "${SERVERS[@]}"        # All elements
echo "${#SERVERS[@]}"       # Length: 3

SERVERS+=("monitor01")      # Append
unset SERVERS[2]            # Remove index 2
```

### Looping Over Arrays

```bash
for SERVER in "${SERVERS[@]}"; do
    ping -c1 -W2 "$SERVER" &>/dev/null \
      && echo "$SERVER: UP" \
      || echo "$SERVER: DOWN"
done
```

</div>

<div>

### Associative Arrays (Bash 4+)

```bash
declare -A PORTS
PORTS[http]=80
PORTS[https]=443
PORTS[ssh]=22

for SERVICE in "${!PORTS[@]}"; do
    echo "$SERVICE -> ${PORTS[$SERVICE]}"
done
```

</div>

</div>

---
layout: section
---

# Part 3: Text Processing & Pipelines
## Parsing Logs and Transforming Data

---
layout: default
---

# 🔍 `grep` — Search Text

<div class="text-sm">

<v-clicks>

### Basic Usage

```bash
grep "error" /var/log/syslog             # Find lines with "error"
grep -i "error" /var/log/syslog          # Case-insensitive
grep -n "error" /var/log/syslog          # Show line numbers
grep -c "error" /var/log/syslog          # Count matches
grep -r "TODO" /home/dev/project/        # Recursive search
```

### Regular Expressions

```bash
grep -E "^root:" /etc/passwd             # Lines starting with "root:"
grep -E "failed|error" /var/log/auth.log # Match either pattern
grep -E "[0-9]{1,3}\.[0-9]{1,3}" access.log  # IP-like patterns
grep -v "^#" /etc/ssh/sshd_config        # Exclude comments
```

### Practical: Failed SSH Logins

```bash
grep "Failed password" /var/log/auth.log | tail -20
grep "Failed password" /var/log/auth.log | \
  grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sort | uniq -c | sort -rn
```

</v-clicks>

</div>

---
layout: default
---

# ✂️ `cut`, `sort`, `uniq` — Slice & Dice

<div class="text-sm">

<v-clicks>

### `cut` — Extract Fields

```bash
cut -d: -f1 /etc/passwd                 # Usernames (field 1, : delimited)
cut -d: -f1,3 /etc/passwd               # Username and UID
```

### `sort` — Order Lines

```bash
sort /etc/passwd                        # Alphabetical sort
sort -t: -k3 -n /etc/passwd             # Sort by UID (numeric)
du -sh /var/log/* | sort -rh            # Sort by human-readable sizes
```

### `uniq` — Remove Duplicates (requires sorted input)

```bash
sort access.log | uniq -c               # Count occurrences
sort access.log | uniq -c | sort -rn    # Top occurrences
```

### Combined Pipeline

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

</v-clicks>

</div>

---
layout: default
---

# 🔧 `sed` — Stream Editor

<div class="text-sm">

**Stream editor:** transform text line-by-line (search/replace, print, delete).

### Search & Replace

```text
sed 's/old/new/' file.txt        # First match per line
sed 's/old/new/g' file.txt       # All matches (global)
sed -i 's/old/new/g' file.txt    # In-place edit
sed -i.bak 's/old/new/g' file    # In-place with .bak backup
```

### Line Operations

```text
sed -n '5,10p' file.txt          # Print lines 5–10 only
sed '3d' file.txt                # Delete line 3
sed '/^#/d' config.txt           # Delete lines starting with #
sed '/^$/d' file.txt             # Delete empty lines
```

### Practical: Config Editing

```text
sed -i 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config
sed '/^#/d; /^$/d' /etc/ssh/sshd_config   # Strip comments and blanks
```

</div>

---
layout: default
---

# 📊 `awk` — Pattern Processing

<div class="text-sm">

<v-clicks>

### Basic Structure: `awk 'pattern { action }' file`

```bash
awk '{print $1}' access.log                    # Print first field
awk '{print $1, $7}' access.log                # Print IP and URL
awk -F: '{print $1, $3}' /etc/passwd           # Custom delimiter
```

### Filtering

```bash
awk '$3 > 1000' /etc/passwd                    # UID > 1000
awk '/error/ {print $0}' /var/log/syslog       # Lines matching "error"
awk 'NR >= 10 && NR <= 20' file.txt            # Lines 10-20
```

### Built-in Variables & Computation

```bash
# Count lines
awk 'END {print NR}' file.txt

# Sum a column (e.g., bytes transferred)
awk '{sum += $10} END {print sum}' access.log

# Average response time
awk '{sum += $NF; n++} END {print sum/n}' access.log
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Tip:</strong> <code>awk</code> is a full programming language — great for log analysis, report generation, and data transformation.
</div>

---
layout: default
---

# 🔗 Pipelines & Redirection

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### The Pipe (`|`)

```bash
grep "error" /var/log/syslog | wc -l
```

### File Descriptors

| FD | Name | Default |
|----|------|---------|
| 0 | stdin | Keyboard |
| 1 | stdout | Terminal |
| 2 | stderr | Terminal |

</div>

<div>

### Redirection

```bash
command > file        # stdout (overwrite)
command >> file       # stdout (append)
command 2> file       # stderr to file
command &> file       # Both stdout & stderr
command 2>&1          # stderr to stdout
command < file        # File as stdin
```

### Process Substitution

```bash
diff <(ls dir1) <(ls dir2)
```

</div>

</div>

---
layout: default
---

# 📝 Practical: Log Analysis Pipeline

<div class="text-xs">

### Analyze Apache/Nginx Access Log

```bash
#!/bin/bash
# log_report.sh - Generate access log report
LOG="${1:-/var/log/nginx/access.log}"

echo "=== Access Log Report ==="
echo "Generated: $(date)"

echo "--- Total Requests ---"
wc -l < "$LOG"

echo "--- Top 10 IP Addresses ---"
awk '{print $1}' "$LOG" | sort | uniq -c | sort -rn | head -10

echo "--- HTTP Status Code Summary ---"
awk '{print $9}' "$LOG" | sort | uniq -c | sort -rn

echo "--- Top 10 Requested URLs ---"
awk '{print $7}' "$LOG" | sort | uniq -c | sort -rn | head -10

echo "--- Requests Per Hour ---"
awk '{print $4}' "$LOG" | cut -d: -f2 | sort | uniq -c
```

</div>

---
layout: section
---

# Part 4: Automation & Best Practices
## From Scripts to Production

---
layout: default
---

# ⏰ Cron — Scheduling Tasks

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Crontab Format

```text
┌──────── minute (0-59)
│ ┌────── hour (0-23)
│ │ ┌──── day of month (1-31)
│ │ │ ┌── month (1-12)
│ │ │ │ ┌ day of week (0-7)
│ │ │ │ │
* * * * * command
```

### Managing Crontab

```bash
crontab -e                # Edit crontab
crontab -l                # List entries
sudo crontab -u root -e  # Edit root's
```

</div>

<div>

### Examples

```bash
# Every day at 2:30 AM
30 2 * * * /opt/scripts/backup.sh

# Every 15 minutes
*/15 * * * * /opt/scripts/health_check.sh

# Monday-Friday at 9 AM
0 9 * * 1-5 /opt/scripts/daily_report.sh

# First day of every month
0 0 1 * * /opt/scripts/monthly_cleanup.sh
```

</div>

</div>

---
layout: default
---

# ⏰ Systemd Timers (Modern Alternative)

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Timer Unit: `backup.timer`

```ini
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

### Service Unit: `backup.service`

```ini
[Unit]
Description=Backup service

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
```

</div>

<div>

### Managing Timers

```bash
sudo systemctl enable --now backup.timer
systemctl list-timers --all
systemctl status backup.timer
journalctl -u backup.service
```

<div class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded">
💡 Systemd timers offer logging, dependencies, and better error handling than cron.
</div>

</div>

</div>

---
layout: default
---

# 🛡️ Error Handling & Strict Mode

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Strict Mode

```bash
#!/bin/bash
set -euo pipefail
# -e  Exit immediately on error
# -u  Treat unset variables as errors
# -o pipefail  Catch errors in pipelines
```

### Custom Error Handling

```bash
die() {
    echo "ERROR: $1" >&2
    exit "${2:-1}"
}
[[ -f "$CONFIG" ]] || die "Config not found"
```

</div>

<div>

### Trap — Run Cleanup on Exit

```bash
#!/bin/bash
set -euo pipefail

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

cp important_data "$TMPDIR/"
process_data "$TMPDIR/"
# TMPDIR removed automatically on exit
```

</div>

</div>

---
layout: default
---

# 🐛 Debugging Scripts

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Debug Mode

```bash
bash -x script.sh     # Trace every command
bash -n script.sh     # Syntax check only
bash -v script.sh     # Print as read
```

### Selective Debugging

```bash
#!/bin/bash
echo "Normal output"
set -x                # Turn on debugging
problematic_function
set +x                # Turn off debugging
echo "Back to normal"
```

</div>

<div>

### Debugging Tips

```bash
echo "DEBUG: VAR=$VAR" >&2

[[ $# -ge 2 ]] || {
  echo "Usage: $0 <src> <dest>"
  exit 1
}

shellcheck myscript.sh
```

<div class="mt-4 p-2 bg-blue-500 bg-opacity-20 rounded">
💡 <strong>ShellCheck</strong> (<code>shellcheck.net</code>) catches common bugs — always run it on your scripts!
</div>

</div>

</div>

---
layout: default
---

# 🔒 Security Best Practices

<div class="text-sm grid grid-cols-2 gap-4">

<div>

<v-clicks>

### Input Validation

```bash
# Sanitize user input
if [[ ! "$USERNAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
    die "Invalid username"
fi

# Avoid eval with user data
# BAD:  eval "$user_input"
# GOOD: Use arrays for commands
cmd=("ls" "-la" "$dir")
"${cmd[@]}"
```

### Quote Everything

```bash
# BAD:  rm -rf $DIR/*
# GOOD: rm -rf "${DIR:?}/"*
# ${DIR:?} fails if DIR is empty
```

</v-clicks>

</div>

<div>

<v-clicks>

### File Permissions

```bash
# Restrict script permissions
chmod 700 admin_script.sh

# Secure temp files
TMPFILE=$(mktemp)
chmod 600 "$TMPFILE"
```

### Avoid Common Pitfalls

```bash
# Use full paths in cron
PATH=/usr/local/bin:/usr/bin:/bin

# Don't store passwords in scripts
# Use: read -sp "Password: " PASS
# Or:  PASS=$(cat /etc/myapp/secret)

# Log actions for audit
logger "Backup started by $(whoami)"
```

</v-clicks>

</div>

</div>

---
layout: default
---

# 📝 Real-World Script: System Health Check

<div class="text-xs">

Script checks CPU load, memory, and disk usage against thresholds; logs WARN or OK.

```bash {lines:false}
#!/bin/bash
set -euo pipefail
WARN_CPU=80
WARN_MEM=85
WARN_DISK=90
HOST=$(hostname)
DATE=$(date '+%F %T')
echo "=== Health: $HOST ==="
echo "Date: $DATE"

# CPU: load vs cores -> WARN or OK
LOAD=$(cat /proc/loadavg | cut -d' ' -f1)
CORES=$(nproc)
CPU_PCT=$((LOAD * 100 / CORES))
if [[ "$CPU_PCT" -gt "$WARN_CPU" ]]; then echo "[WARN] CPU: $CPU_PCT%"; else echo "[ OK ] CPU: $CPU_PCT%"; fi

# Memory: usage % -> WARN or OK
MEM_PCT=$(free | awk '/Mem:/ {print int($3/$2*100)}')
if [[ "$MEM_PCT" -gt "$WARN_MEM" ]]; then echo "[WARN] Memory: $MEM_PCT%"; else echo "[ OK ] Memory: $MEM_PCT%"; fi
```

</div>

---
layout: default
---

# 📝 Real-World Script: Backup with Rotation

<div class="grid grid-cols-2 gap-4 text-xs">

<div>

```bash
#!/bin/bash
set -euo pipefail
# rotate_backup.sh

BACKUP_DIR="/backup"
SOURCE="/var/www"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
ARCHIVE="${BACKUP_DIR}/www_${DATE}.tar.gz"
LOGFILE="/var/log/backup.log"

log() {
  echo "$(date '+%F %T') $1" | tee -a "$LOGFILE"
}
```

</div>

<div>

```bash
log "Starting backup of $SOURCE"
mkdir -p "$BACKUP_DIR"

if tar czf "$ARCHIVE" \
    -C "$(dirname "$SOURCE")" \
    "$(basename "$SOURCE")"; then
    SIZE=$(du -sh "$ARCHIVE" | cut -f1)
    log "Backup complete: $ARCHIVE ($SIZE)"
else
    log "ERROR: Backup failed!"; exit 1
fi

# Rotate old backups
DELETED=$(find "$BACKUP_DIR" -name "*.tar.gz" \
  -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "Cleaned up $DELETED old backup(s)"
```

</div>

</div>

---
layout: default
---

# 📊 Summary: Bash Scripting & Automation

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Key Concepts Covered

1. **Script Basics**: Shebang, execution, variables
2. **Special Variables**: `$1`, `$@`, `$?`, `$$`
3. **Control Structures**: `if`, `case`, `for`, `while`
4. **Functions**: `local` scope, return values
5. **Text Processing**: `grep`, `sed`, `awk`
6. **Pipelines**: `|`, redirection (`>`, `2>&1`)
7. **Automation**: Cron & systemd timers
8. **Best Practices**: Strict mode, security

</div>

<div>

### The Scripting Mindset

- ✅ If you do it twice, script it
- ✅ Always use strict mode (`set -euo pipefail`)
- ✅ Quote your variables
- ✅ Validate inputs
- ✅ Log everything

</div>

</div>

---
layout: default
---

# 🎯 Learning Objectives: Did We Achieve?

<v-clicks>

### By now, you should be able to:

- ✅ Write and execute Bash scripts with proper structure
- ✅ Use variables, arguments, and arithmetic
- ✅ Implement conditionals and loops for control flow
- ✅ Define and use functions with local scope
- ✅ Process text with `grep`, `sed`, `awk`, and pipelines
- ✅ Schedule automated tasks with cron and systemd timers
- ✅ Apply error handling and strict mode
- ✅ Follow security best practices in scripts
- ✅ Build real-world system administration scripts

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
🎓 <strong>Next Week:</strong> Linux Networking Basics - Configure IP, DNS, and network interfaces!
</div>

---
layout: default
---

# 🧪 Lab Practice: Bash Scripting

<div class="text-sm">

### Exercise 1: User info script
- Write a script that takes a username as argument and prints: UID, GID, home dir, shell (use `getent` or parse `/etc/passwd`).
- Add a check: exit with an error message if no argument is given.

### Exercise 2: Log summary
- In `/var/log` (or a copy), use `grep`, `cut`, `sort`, `uniq` to list the **top 5 most common** words in a log file (ignore case; skip very short words).
- Pipe the result into a small script that prints a one-line summary.

### Exercise 3: Safe backup script
- Write a script that tars a given directory into `/tmp/backups` with a timestamp in the name.
- Use `set -euo pipefail`, check that the directory exists, and print the path of the created archive.

### Exercise 4: `sed` config tweak
- Take a copy of a config file (e.g. `sshd_config` or any `.conf`). Use `sed` to comment out every line that contains a given keyword (e.g. `Port`), then show a diff.

</div>

---
layout: default
---

# 🔗 Additional Resources

<div class="text-sm">

### Documentation
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/) - Official reference
- [Bash Hackers Wiki](https://wiki.bash-hackers.org/) - Community wiki
- [ShellCheck](https://www.shellcheck.net/) - Online script linter

### Books & Guides
- *"The Linux Command Line"* by William Shotts - Scripting chapters
- [Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/) - Comprehensive
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html) - Best practices

### Practice
- Write a script to automate user account creation
- Build a log parser for Apache/Nginx access logs
- Create a backup script with rotation and email alerts

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="pt-12 text-xl">
Next: Linux Networking Basics
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/yourusername/css262" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>
