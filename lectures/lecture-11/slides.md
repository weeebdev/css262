---
theme: default
background: https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 11
  Linux Administration & *nix Systems for Cybersecurity

  Logging, Auditing & Cron
drawings:
  persist: false
transition: slide-left
title: 'Lecture 11: Logging, Auditing & Cron'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Logging, Auditing & Cron

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 11: Visibility Into Your System
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

### Part 1: systemd Journal
- `journalctl` filtering & options
- Boot logs, unit logs, priority filtering
- Log persistence across reboots

</div>

<div>

### Part 2: syslog & rsyslog
- Traditional syslog architecture
- Facilities and severities
- rsyslog rules and remote logging

</div>

</div>

<div class="grid grid-cols-2 gap-6 text-sm mt-2">

<div>

### Part 3: logrotate & auditd
- Preventing disk fill with logrotate
- `auditd`: kernel-level audit framework
- Writing watch rules, `ausearch`, `aureport`

</div>

<div>

### Part 4: Cron & Scheduled Tasks
- crontab syntax and fields
- System-wide cron directories
- `at` for one-off jobs, `systemd` timers

</div>

</div>

---
layout: default
---

# 🔄 Quick Recap: Week 10

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### SELinux

<v-clicks>

- DAC (file permissions) vs MAC (policy)
- Modes: enforcing, permissive, disabled
- Security contexts: `user:role:type:level`
- Booleans: `setsebool -P`
- Troubleshooting: `ausearch` → `audit2why`

</v-clicks>

</div>

<div>

### Key Takeaways

<v-clicks>

- SELinux confines **what** processes can do
- But who's watching **what** they do?
- An intruder may already be inside — logs are your evidence
- **Today**: Build visibility — detect, record, schedule

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔍 <strong>You can't defend what you can't see.</strong> Logging and auditing are the foundation of incident detection and forensics.
</div>

---
layout: section
---

# Part 1
## 📓 systemd Journal (`journalctl`)

---
layout: default
---

# 📓 systemd Journal Overview

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### What It Is

<v-clicks>

- Binary log store managed by `systemd-journald`
- Collects kernel messages, syslog, stdout/stderr of units
- Stored in `/run/log/journal/` (volatile) or `/var/log/journal/` (persistent)
- Indexed — fast filtering by unit, time, priority, field

</v-clicks>

</div>

<div>

### Why It Matters

<v-clicks>

- One place for all system and service logs
- Survives rapid log rotation (binary format)
- Correlated with systemd unit lifecycle events
- Works without syslogd — but can forward to it

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>Persistence:</strong> By default the journal is volatile (lost on reboot). Create <code>/var/log/journal/</code> or set <code>Storage=persistent</code> in <code>/etc/systemd/journald.conf</code> to persist it.
</div>

---
layout: default
---

# 🔍 `journalctl` — Common Usage

<div class="text-sm">

```bash
# Follow new messages in real time (like tail -f)
journalctl -f

# Show messages for a specific unit
journalctl -u sshd
journalctl -u nginx -f

# Show messages since boot
journalctl -b
journalctl -b -1          # Previous boot

# Filter by time
journalctl --since "2024-01-15 10:00:00"
journalctl --since "1 hour ago"
journalctl --since today

# Filter by priority (emerg=0 to debug=7)
journalctl -p err           # error and above
journalctl -p warning..err  # range

# Show kernel messages only
journalctl -k
```

</div>

---
layout: default
---

# 🔍 `journalctl` — More Filters

<div class="text-sm">

```bash
# Show last N lines
journalctl -n 50

# No pager (pipe-friendly)
journalctl --no-pager

# JSON output (for parsing)
journalctl -o json-pretty -n 5

# Filter by executable or PID
journalctl /usr/sbin/sshd
journalctl _PID=1234

# Combine filters
journalctl -u sshd --since today -p err

# Disk usage / cleanup
journalctl --disk-usage
journalctl --vacuum-size=500M
```

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>For security investigations:</strong> <code>journalctl -u sshd --since yesterday | grep "Failed"</code> — find all failed SSH logins.
</div>

</div>

---
layout: default
---

# 📊 Log Priorities (Syslog Severity Levels)

<div class="text-sm">

| Number | Name | Meaning | Example |
|--------|------|---------|---------|
| 0 | **emerg** | System unusable | Kernel panic |
| 1 | **alert** | Immediate action needed | Corrupted disk |
| 2 | **crit** | Critical conditions | Hardware failure |
| 3 | **err** | Error conditions | Service start failure |
| 4 | **warning** | Warning conditions | Config deprecated |
| 5 | **notice** | Normal but significant | Service started |
| 6 | **info** | Informational | User logged in |
| 7 | **debug** | Debug-level messages | Verbose tracing |

</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <code>journalctl -p err</code> shows <strong>err and higher severity</strong> (0–3). Lower number = higher severity.
</div>

---
layout: default
---

# ⚙️ Configuring journald

<div class="text-sm">

### `/etc/systemd/journald.conf`

```ini
[Journal]
Storage=persistent      # volatile | persistent | auto | none
Compress=yes            # Compress stored entries
SystemMaxUse=500M       # Max disk space for system journal
RuntimeMaxUse=100M      # Max for runtime (volatile) journal
MaxRetentionSec=1month  # Discard entries older than this
ForwardToSyslog=yes     # Forward to rsyslog/syslogd
```

```bash
# Apply changes
sudo systemctl restart systemd-journald

# Make journal persistent now (without restarting)
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
```

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>For compliance and forensics:</strong> Always configure persistent journal storage. Volatile logs vanish on reboot — useless for incident response.
</div>

---
layout: section
---

# Part 2
## 📜 syslog & rsyslog

---
layout: default
---

# 📜 Traditional syslog Architecture

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### How It Works

<v-clicks>

- Applications log via the `syslog()` syscall
- The syslog daemon receives messages and routes them
- Routing based on **facility** (what's logging) + **severity** (how bad)
- Writes to files in `/var/log/`
- Can forward to remote log servers

</v-clicks>

</div>

<div>

### Key Log Files

```
/var/log/syslog      # General log (Debian/Ubuntu)
/var/log/messages    # General log (RHEL/CentOS)
/var/log/auth.log    # Auth events (Debian/Ubuntu)
/var/log/secure      # Auth events (RHEL/CentOS)
/var/log/kern.log    # Kernel messages
/var/log/cron        # Cron job output
```

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>rsyslog</strong> is the most common syslog daemon on modern Linux. It is compatible with classic syslog but adds TCP forwarding, templates, and filtering.
</div>

---
layout: default
---

# 📊 Syslog Facilities

<div class="text-sm">

| Facility | Code | Source |
|----------|------|--------|
| `kern` | 0 | Kernel messages |
| `user` | 1 | User-space processes |
| `daemon` | 3 | System daemons |
| `auth` | 4 | Security/authentication |
| `cron` | 9 | Cron daemon |
| `local0–7` | 16–23 | Locally-defined |

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 Rules match <code>facility.severity</code>. Example: <code>auth.info</code> = auth at info-level and above. <code>*.*</code> = everything.
</div>

</div>

---
layout: default
---

# ⚙️ rsyslog Configuration

<div class="text-sm">

### `/etc/rsyslog.conf` and `/etc/rsyslog.d/*.conf`

```bash
# Selector syntax:  facility.severity    destination
auth,authpriv.*          /var/log/auth.log
*.*;auth,authpriv.none   -/var/log/syslog   # leading - = async write
kern.*                   /var/log/kern.log
cron.*                   /var/log/cron.log
```

### Forward to Remote Syslog Server

```bash
# /etc/rsyslog.d/50-remote.conf

# UDP (traditional, no delivery guarantee)
*.* @192.168.1.100:514

# TCP (reliable)
*.* @@192.168.1.100:514
```

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Security best practice:</strong> Forward to a remote log server. An attacker who compromises a host may delete local logs — remote copies survive.
</div>

</div>

---
layout: default
---

# 🔍 Reading Logs

<div class="text-sm">

### Traditional Text Log Commands

```bash
# Tail a file live
tail -f /var/log/auth.log

# Last 100 lines
tail -n 100 /var/log/syslog

# Search for a pattern
grep "Failed password" /var/log/auth.log
grep "sshd" /var/log/auth.log | grep -i "invalid"

# Count failed SSH logins per IP
grep "Failed password" /var/log/auth.log \
  | awk '{print $11}' | sort | uniq -c | sort -rn
```

</div>

<v-clicks>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Quick SSH investigation:</strong> The above pipeline shows which IPs are brute-forcing your server and how many attempts each made.
</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 On systemd systems, <code>journalctl -u sshd</code> is often more convenient than grepping text logs — it's indexed and faster.
</div>

</v-clicks>

---
layout: section
---

# Part 3
## 🔄 logrotate & auditd

---
layout: default
---

# 🔄 logrotate — Preventing Disk Fill

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### The Problem

<v-clicks>

- Log files grow unbounded without rotation
- A busy web server: access.log can hit gigabytes/day
- Full disk → service crashes, denial of service
- Old logs consume space that's no longer needed

</v-clicks>

</div>

<div>

### How logrotate Works

<v-clicks>

- Runs daily via cron (or systemd timer)
- Renames old log, creates new empty log
- Compresses old files, deletes after N rotations
- Sends `SIGHUP` to services to reopen logs
- Config: `/etc/logrotate.conf` + `/etc/logrotate.d/`

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Result:</strong> <code>/var/log/syslog</code>, <code>/var/log/syslog.1</code>, <code>/var/log/syslog.2.gz</code>, … — controlled rotation window.
</div>

---
layout: default
---

# ⚙️ logrotate Configuration

<div class="text-sm">

### `/etc/logrotate.d/myapp`

```bash
/var/log/myapp/*.log {
    daily               # Rotate daily
    rotate 14           # Keep 14 rotated files
    compress            # gzip old files
    delaycompress       # Don't compress the most recent rotation
    missingok           # Don't error if log file is missing
    notifempty          # Don't rotate empty files
    create 0640 www-data adm  # Create new log with these perms
    sharedscripts       # Run postrotate once for all matched files
    postrotate
        # Tell the service to reopen its log file
        /bin/kill -HUP $(cat /var/run/myapp.pid) 2>/dev/null || true
    endscript
}
```

### Test Without Actually Rotating

```bash
sudo logrotate -d /etc/logrotate.d/myapp     # Debug/dry run
sudo logrotate -f /etc/logrotate.d/myapp     # Force rotation
```

</div>

---
layout: default
---

# 🔍 auditd — Kernel Audit Framework

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### What auditd Does

<v-clicks>

- Kernel-level audit subsystem (`kauditd`)
- Records: file access, syscalls, logins, privilege use
- Writes to `/var/log/audit/audit.log`
- Tamper-resistant: requires root to stop, kernel-driven
- Used by SELinux, Fail2Ban, compliance frameworks

</v-clicks>

</div>

<div>

### Why It's Important

<v-clicks>

- Detects access to sensitive files
- Records who ran what with `sudo`
- Required by PCI-DSS, HIPAA, DISA STIG
- Forensic evidence after an incident
- Captures events even text logs don't

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔑 <strong>auditd vs syslog:</strong> syslog is application-driven (apps decide what to log). auditd is kernel-driven (the kernel records events regardless of the application).
</div>

---
layout: default
---

# ⚙️ auditd: Install & Basic Config

<div class="text-sm">

```bash
# Install (Debian/Ubuntu)
sudo apt install auditd audispd-plugins

# Install (RHEL/CentOS)
sudo yum install audit

# Enable and start
sudo systemctl enable --now auditd

# Status
sudo systemctl status auditd
sudo auditctl -s        # Kernel audit status
sudo auditctl -l        # List loaded rules
```

### Configuration Files

```
/etc/audit/auditd.conf      # Daemon settings (log path, size, rotation)
/etc/audit/audit.rules      # Persistent rules (loaded on start)
/etc/audit/rules.d/*.rules  # Rules in drop-in directory (preferred)
```

</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 Rules added with <code>auditctl</code> are runtime-only. Use <code>/etc/audit/rules.d/</code> for persistence. Run <code>augenrules --load</code> to reload.
</div>

---
layout: default
---

# 📝 Writing Audit Rules

<div class="text-sm">

### `auditctl` Rule Syntax

```bash
# Watch a file (-w path, -p permissions, -k tag)
sudo auditctl -w /etc/passwd -p rwa -k passwd_changes

# Watch a directory recursively
sudo auditctl -w /etc/ssh/ -p rwxa -k ssh_config

# Audit a syscall (always,exit = record on syscall return)
sudo auditctl -a always,exit -F arch=b64 -S execve -k exec_commands
```

</div>

---
layout: default
---

# 📝 Common Audit Rule Sets

<div class="text-sm">

```bash
# /etc/audit/rules.d/hardening.rules

# Watch for changes to passwd and shadow
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group  -p wa -k identity
-w /etc/gshadow -p wa -k identity

# Watch SSH configuration
-w /etc/ssh/sshd_config -p wa -k sshd_config

# Log all sudo commands
-w /usr/bin/sudo -p x -k sudo_usage

# Log failed login attempts
-w /var/log/faillog -p wa -k logins
-w /var/log/lastlog -p wa -k logins

# Detect privilege escalation attempts
-a always,exit -F arch=b64 -S setuid -k priv_esc
```

</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ These rules align with CIS Benchmark for Linux and DISA STIG recommendations.
</div>

---
layout: default
---

# 🔍 `ausearch` — Querying the Audit Log

<div class="text-sm">

```bash
# Search by key tag
sudo ausearch -k passwd_changes

# Search by time range
sudo ausearch -ts today
sudo ausearch -ts "04/01/2024 10:00:00" -te "04/01/2024 11:00:00"

# Search by username
sudo ausearch -ua alice

# Search by event type
sudo ausearch -m USER_AUTH          # Authentication events
sudo ausearch -m USER_CMD           # sudo commands
sudo ausearch -m AVC                # SELinux denials
sudo ausearch -m SYSCALL -k exec_commands

# Combined
sudo ausearch -k identity -ts today --interpret
```

</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <code>--interpret</code> flag translates numeric UIDs and syscall numbers to human-readable names.
</div>

---
layout: default
---

# 📊 `aureport` — Summary Reports

<div class="text-sm">

```bash
# Summary of all events
sudo aureport

# Authentication events
sudo aureport --auth

# Failed authentication
sudo aureport --auth --failed

# Summary of executable events
sudo aureport --executable

# List of all users who ran commands
sudo aureport --user

# Events in a time range
sudo aureport --start today --end now

# Commands run via sudo
sudo aureport --comm --success
```

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔑 <strong>aureport is ideal for periodic reporting</strong> (daily digest) while ausearch is for targeted investigations.
</div>

---
layout: section
---

# Part 4
## ⏰ Cron & Scheduled Tasks

---
layout: default
---

# ⏰ What is Cron?

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### The cron Daemon

<v-clicks>

- Runs scheduled commands at specified times
- `crond` reads crontab files on startup and after changes
- Per-user crontabs: `crontab -e`
- System crontabs: `/etc/crontab`, `/etc/cron.d/`
- Logs output to syslog (facility `cron`)

</v-clicks>

</div>

<div>

### Why It Matters for Security

<v-clicks>

- Attackers install cron persistence for re-entry
- Scheduled tasks run as specific users — privilege concern
- Cron output is often silently discarded (MAILTO)
- Malicious crons are a common persistence mechanism
- Must audit crontabs as part of incident response

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Incident response:</strong> After a breach, always check <code>crontab -l</code> for all users and <code>/etc/cron.d/</code> for attacker persistence.
</div>

---
layout: default
---

# 📝 Crontab Syntax

<div class="text-sm">

```
┌───────────── minute       (0 - 59)
│ ┌─────────── hour         (0 - 23)
│ │ ┌───────── day of month (1 - 31)
│ │ │ ┌─────── month        (1 - 12 or Jan-Dec)
│ │ │ │ ┌───── day of week  (0 - 7, Sunday = 0 or 7)
│ │ │ │ │
* * * * *  command to execute
```

### Examples

```bash
# Every minute
* * * * *   /usr/bin/check-disk.sh

# Daily at 2:30am
30 2 * * *  /usr/bin/backup.sh

# Weekdays at 8am
0 8 * * 1-5  /usr/bin/send-report.sh

# Every 15 minutes
*/15 * * * *  /usr/bin/poll-api.sh
```

</div>

---
layout: default
---

# ⚙️ Managing Crontabs

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### User Crontabs

```bash
crontab -e              # Edit own crontab
crontab -l              # List own crontab
crontab -r              # Remove own crontab
sudo crontab -u alice -e  # Edit alice's crontab
sudo crontab -u alice -l  # List alice's crontab
```

</div>

<div>

### System Cron Locations

```
/etc/crontab       # System crontab (+ user field)
/etc/cron.d/       # Drop-in files
/etc/cron.hourly/  # Run hourly
/etc/cron.daily/   # Run daily
/etc/cron.weekly/  # Run weekly
/etc/cron.monthly/ # Run monthly
```

</div>

</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 Scripts in <code>/etc/cron.daily/</code> etc. are executed by <code>run-parts</code> — must be executable and have no dots in the filename.
</div>

---
layout: default
---

# 📝 System Crontab Format

<div class="text-sm">

### `/etc/crontab` — Has a User Field

```bash
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# min hour dom month dow  user    command
17  *  * * *  root  cd / && run-parts --report /etc/cron.hourly
25  6  * * *  root  test -x /usr/sbin/anacron || run-parts /etc/cron.daily
47  6  * * 7  root  test -x /usr/sbin/anacron || run-parts /etc/cron.weekly
52  6  1 * *  root  test -x /usr/sbin/anacron || run-parts /etc/cron.monthly
```

### Drop-in Files: `/etc/cron.d/`

```bash
# /etc/cron.d/myapp
MAILTO=admin@example.com

0 3 * * *  appuser  /opt/myapp/bin/cleanup.sh >> /var/log/myapp-cleanup.log 2>&1
```

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔑 <strong>User field:</strong> System crontabs specify which user runs the command. Per-user crontabs (via <code>crontab -e</code>) do not have this field.
</div>

---
layout: default
---

# ⏰ Cron Output & MAILTO

<div class="text-sm">

```bash
# Capture output in the crontab itself
*/5 * * * *  /usr/bin/check.sh >> /var/log/check.log 2>&1

# Email output to a specific address
MAILTO=admin@example.com
0 2 * * *  /usr/bin/backup.sh

# Discard all output (silent mode — use carefully)
0 2 * * *  /usr/bin/backup.sh > /dev/null 2>&1
```

</div>

<v-clicks>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Don't silently discard cron output in production.</strong> If a job fails, you'll never know. Log to a file or set <code>MAILTO</code>.
</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 Default behavior without redirection: cron emails output to the running user via local mail. On servers without mail configured, this silently disappears.
</div>

</v-clicks>

---
layout: default
---

# 🕐 `at` — One-Off Scheduled Jobs

<div class="text-sm">

```bash
# Install
sudo apt install at

# Schedule a job for a specific time
echo "/usr/bin/backup.sh" | at 02:30
echo "/usr/bin/reboot" | at 23:00 + 1 day

# Interactive input
at now + 5 minutes
at> /usr/bin/cleanup.sh
at> 
(press Ctrl+D to submit)

# List pending at jobs
atq

# Remove a pending job
atrm 3           # Remove job #3

# View a job's content
at -c 3          # Show job #3's commands
```

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <code>at</code> is useful for one-time deferred tasks (run this script after office hours). Cron is for recurring tasks.
</div>

---
layout: default
---

# ⏱️ systemd Timers

<div class="text-sm">

A `.timer` unit triggers a `.service` unit — output goes to the journal, no silent failures.

<div class="mb-2 p-2 bg-yellow-500 bg-opacity-20 rounded">
💡 <strong>Advantages over cron:</strong> Journal integration, <code>Persistent=true</code> handles missed runs, systemd dependency management.
</div>

```ini
# /etc/systemd/system/backup.timer
[Timer]
OnCalendar=daily
Persistent=true
Unit=backup.service
[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now backup.timer
systemctl list-timers --all
```

</div>

---
layout: default
---

# 🔒 Cron Security Considerations

<div class="text-sm">

<v-clicks>

### Controlling Who Can Use Cron

```bash
# Allow only listed users (if file exists)
/etc/cron.allow

# Block listed users (if cron.allow doesn't exist)
/etc/cron.deny
```

### Audit All Crontabs

```bash
# Check all user crontabs
for user in $(cut -d: -f1 /etc/passwd); do
    entries=$(crontab -u $user -l 2>/dev/null)
    [ -n "$entries" ] && echo "=== $user ===" && echo "$entries"
done

# Check system cron directories
ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.hourly/
cat /etc/crontab
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Attacker persistence:</strong> A cron job running as root every minute is a classic backdoor. Audit all crontabs regularly and after any security incident.
</div>

---
layout: default
---

# 📊 Putting It Together: Detection Workflow

<div class="text-sm">

<v-clicks>

### Scenario: Detecting a Brute-Force SSH Attack

```bash
# 1. Check for repeated failed logins (journald)
journalctl -u sshd --since today | grep "Failed password" | head -20

# 2. Count top attacking IPs
journalctl -u sshd --since today --no-pager \
  | grep "Failed password" \
  | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10

# 3. Check if any succeeded after failures
journalctl -u sshd --since today | grep "Accepted"

# 4. Correlate with audit log (were any files accessed?)
sudo ausearch -ua suspicioususer -ts today --interpret

# 5. Check for new cron persistence
sudo crontab -u suspicioususer -l 2>/dev/null
ls -lt /etc/cron.d/      # Recently modified?
```

</v-clicks>

</div>

---
layout: default
---

# ✅ Logging & Auditing Checklist

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Logging

- [ ] Journal storage is persistent (`/var/log/journal/`)
- [ ] `journald.conf` retention configured
- [ ] rsyslog forwarding to remote log server
- [ ] `/var/log/auth.log` or `/var/log/secure` monitored
- [ ] logrotate configured for all app logs

</div>

<div>

### Auditing & Cron

- [ ] `auditd` installed and enabled
- [ ] Audit rules for `/etc/passwd`, `/etc/shadow`, `/etc/ssh/`
- [ ] `MAILTO` set for cron jobs or output redirected
- [ ] Crontabs audited for all users
- [ ] `/etc/cron.d/` contents reviewed
- [ ] `at` queue empty or expected

</div>

</div>

---
layout: default
---

# 📊 Summary: Logging, Auditing & Cron

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Key Concepts

1. **journald**: Indexed binary log, `journalctl` for filtering
2. **rsyslog**: Text-based, facility.severity routing, remote forwarding
3. **logrotate**: Prevent disk fill, compress and rotate on schedule
4. **auditd**: Kernel-driven audit, watch rules, `ausearch`/`aureport`
5. **cron**: Recurring scheduled tasks, five time fields + command
6. **at**: One-off deferred jobs
7. **systemd timers**: Modern cron with journal integration

</div>

<div>

### Key Files

| File/Command | Purpose |
|-------------|---------|
| `/var/log/journal/` | Persistent journal store |
| `/etc/rsyslog.d/` | rsyslog rules |
| `/etc/logrotate.d/` | Log rotation config |
| `/var/log/audit/audit.log` | auditd log |
| `/etc/audit/rules.d/` | Persistent audit rules |
| `crontab -e` | Edit user crontab |
| `/etc/cron.d/` | System drop-in crons |

</div>

</div>

---
layout: default
---

# 🎯 Learning Objectives: Did We Achieve?

<v-clicks>

### By now, you should be able to:

- ✅ Use `journalctl` to filter logs by unit, time, priority, and keyword
- ✅ Configure persistent journal storage
- ✅ Explain syslog facility and severity and read rsyslog rules
- ✅ Configure logrotate to rotate application logs
- ✅ Install and configure `auditd` with watch rules
- ✅ Query audit events with `ausearch` and generate reports with `aureport`
- ✅ Write crontab entries using the five-field time syntax
- ✅ Distinguish per-user crontabs from system cron directories
- ✅ Schedule one-off jobs with `at`
- ✅ Audit crontabs as part of incident response

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
🎓 <strong>Next Week:</strong> Containerization (Docker) — namespaces, cgroups, images, and container security!
</div>

---
layout: default
---

# 🧪 Lab Practice: Auditd & Logrotate

<div class="text-sm">

### Exercise 1: journalctl Investigation
Filter `journalctl` to show only SSH-related events since yesterday at priority `info` and above. Find any failed authentication attempts. Count unique source IPs.

### Exercise 2: logrotate Configuration
Write a logrotate config for `/var/log/myapp/*.log`: rotate daily, keep 7 files, compress, create with permissions 0640. Test with `logrotate -d`.

### Exercise 3: Audit Rules
Install `auditd`. Add rules to watch `/etc/passwd` and `/etc/sudoers` for writes. Edit `/etc/passwd` (e.g. change a comment field). Use `ausearch -k` to find the event. Run `aureport --auth`.

### Exercise 4: Cron Scheduling
Create a crontab entry that appends a timestamp to `/tmp/heartbeat.log` every 5 minutes. After 15 minutes, verify the log has three entries. Then disable the job.

</div>

---
layout: default
---

# 🔗 Additional Resources

<div class="text-sm">

### Documentation
- [systemd journal](https://www.freedesktop.org/software/systemd/man/journalctl.html) — Official journalctl manual
- [rsyslog Documentation](https://www.rsyslog.com/doc/master/index.html) — Configuration reference
- [Linux Audit Documentation](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/security_hardening/auditing-the-system_security-hardening) — Red Hat audit guide
- [logrotate man page](https://linux.die.net/man/8/logrotate)

### Books & Guides
- *"The Linux Command Line"* by William Shotts — Chapters on shell and text processing
- [NIST SP 800-92](https://csrc.nist.gov/publications/detail/sp/800-92/final) — Guide to Computer Security Log Management
- [CIS Benchmark for Linux](https://www.cisecurity.org/) — Logging and auditing section

### Practice
- Set up auditd, trigger events, and write a short incident report
- Configure rsyslog forwarding to a second VM and verify logs arrive
- Write a `systemd` timer that replaces an existing cron job

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="pt-12 text-xl">
Next: Containerization (Docker)
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/yourusername/css262" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>
