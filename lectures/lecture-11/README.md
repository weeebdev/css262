# Lecture 11: Logging, Auditing & Cron

## Overview

This lecture builds the visibility layer of a hardened Linux system. Students learn how to collect, persist, route, and query system logs (via `journald` and `rsyslog`), prevent disk exhaustion with `logrotate`, record security-relevant events at the kernel level with `auditd`, and schedule recurring and one-off tasks with `cron` and `at`. These skills are foundational for incident detection, forensic investigation, and operational reliability.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Use `journalctl` to filter logs by unit, time, priority, and field
2. Configure persistent journal storage and set retention limits
3. Explain syslog facility and severity levels and read rsyslog routing rules
4. Configure rsyslog to forward logs to a remote server
5. Write `logrotate` configuration for an application log directory
6. Install and configure `auditd` with file watch and syscall rules
7. Query audit events with `ausearch` and generate summary reports with `aureport`
8. Write crontab entries using the five-field time syntax
9. Distinguish per-user crontabs from system-wide cron directories
10. Schedule one-off deferred jobs with `at`
11. Audit crontabs as part of an incident response checklist

## Topics Covered

### Part 1: systemd Journal (`journalctl`)

#### 1.1 What Is the Journal?

`systemd-journald` is a logging service built into systemd. It collects:
- Kernel messages (equivalent of `dmesg`)
- Syslog messages forwarded by applications via `syslog()` or `/dev/log`
- Standard output and error of all systemd units
- Structured metadata fields for each entry

The journal is stored in binary format for fast indexed access. By default it is **volatile** (stored in `/run/log/journal/`, lost on reboot). To persist it:

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
# Or set Storage=persistent in /etc/systemd/journald.conf and restart journald
```

#### 1.2 `journalctl` Filtering

```bash
journalctl -f                        # Follow live (like tail -f)
journalctl -u sshd                   # Logs for the sshd unit
journalctl -u sshd -f                # Follow sshd logs
journalctl -b                        # Current boot
journalctl -b -1                     # Previous boot
journalctl --since "2024-01-15 09:00:00"
journalctl --since "1 hour ago"
journalctl --since today
journalctl -p err                    # error (3) and above (0–3)
journalctl -p warning..crit          # severity range
journalctl -k                        # Kernel messages only
journalctl -n 50                     # Last 50 lines
journalctl --no-pager                # Don't paginate (for scripts)
journalctl -o json-pretty -n 5       # JSON output
journalctl /usr/sbin/sshd            # Filter by executable path
journalctl _PID=1234                 # Filter by PID
journalctl --disk-usage              # Disk space used by journal
journalctl --vacuum-size=500M        # Trim to 500 MB
journalctl --vacuum-time=30d         # Remove entries older than 30 days
```

#### 1.3 Syslog Priority Levels

| Number | Name | Meaning |
|--------|------|---------|
| 0 | emerg | System unusable |
| 1 | alert | Immediate action required |
| 2 | crit | Critical condition |
| 3 | err | Error condition |
| 4 | warning | Warning condition |
| 5 | notice | Normal but significant |
| 6 | info | Informational |
| 7 | debug | Debug messages |

`journalctl -p err` shows severity 0–3 (err and more severe). Lower number = higher severity.

#### 1.4 `journald.conf` Settings

`/etc/systemd/journald.conf`:

```ini
[Journal]
Storage=persistent        # volatile | persistent | auto | none
Compress=yes
SystemMaxUse=500M         # Max disk for persistent journal
RuntimeMaxUse=100M        # Max disk for volatile journal
MaxRetentionSec=1month
ForwardToSyslog=yes       # Forward to rsyslog
```

Restart after changes: `sudo systemctl restart systemd-journald`

---

### Part 2: syslog & rsyslog

#### 2.1 Architecture

Traditional syslog (and its modern replacement rsyslog) receives log messages from applications via the `syslog()` API and routes them to files, remote servers, or other destinations based on a **facility.severity** selector.

**Common log file locations:**

| File | Distro | Contents |
|------|--------|----------|
| `/var/log/syslog` | Debian/Ubuntu | General system messages |
| `/var/log/messages` | RHEL/CentOS | General system messages |
| `/var/log/auth.log` | Debian/Ubuntu | Authentication events |
| `/var/log/secure` | RHEL/CentOS | Authentication events |
| `/var/log/kern.log` | Debian/Ubuntu | Kernel messages |
| `/var/log/cron` | Most | Cron job output |

#### 2.2 Syslog Facilities

| Facility | Code | Source |
|----------|------|--------|
| `kern` | 0 | Kernel |
| `user` | 1 | User-level processes |
| `mail` | 2 | Mail subsystem |
| `daemon` | 3 | System daemons |
| `auth` | 4 | Authentication (security) |
| `syslog` | 5 | Internal syslogd messages |
| `cron` | 9 | Cron and at |
| `local0–7` | 16–23 | Locally-defined |

#### 2.3 rsyslog Configuration

Config files: `/etc/rsyslog.conf` and `/etc/rsyslog.d/*.conf`

**Selector format:** `facility.severity   destination`

```bash
# Route auth messages to auth.log
auth,authpriv.*          /var/log/auth.log

# Everything except auth to syslog (- = async write)
*.*;auth,authpriv.none   -/var/log/syslog

# Forward all logs to remote syslog server (UDP)
*.* @192.168.1.100:514

# Forward all logs to remote syslog server (TCP, reliable)
*.* @@192.168.1.100:514
```

Apply changes: `sudo systemctl restart rsyslog`

**Security note:** Forward logs to a remote server. An attacker who compromises a host may delete local logs. Remote copies are your forensic evidence.

---

### Part 3: logrotate & auditd

#### 3.1 logrotate

Prevents log files from growing indefinitely. Runs daily via cron or systemd timer. Config: `/etc/logrotate.conf` (global defaults) and `/etc/logrotate.d/` (per-application).

**Example `/etc/logrotate.d/myapp`:**

```
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        /bin/kill -HUP $(cat /var/run/myapp.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
```

| Directive | Meaning |
|-----------|---------|
| `daily` / `weekly` / `monthly` | Rotation frequency |
| `rotate N` | Keep N rotated files |
| `compress` | gzip rotated files |
| `delaycompress` | Don't gzip the most recent rotation |
| `missingok` | No error if log is missing |
| `notifempty` | Don't rotate empty files |
| `create MODE USER GROUP` | Create new log with these attributes |
| `postrotate`/`endscript` | Commands to run after rotation |

```bash
sudo logrotate -d /etc/logrotate.d/myapp   # Dry run
sudo logrotate -f /etc/logrotate.d/myapp   # Force rotation now
```

#### 3.2 auditd

`auditd` is the user-space component of the Linux Audit Framework. The kernel generates audit events; `auditd` writes them to `/var/log/audit/audit.log`.

**Key properties:**
- Kernel-driven — events are generated regardless of whether the application cooperates
- Records: file accesses, syscalls, login events, privilege escalation
- Required by PCI-DSS, HIPAA, DISA STIG, and many compliance frameworks
- Tamper-resistant: only root can stop `auditd`, and even then the kernel continues buffering

**Install and enable:**

```bash
# Debian/Ubuntu
sudo apt install auditd audispd-plugins

# RHEL/CentOS
sudo yum install audit

sudo systemctl enable --now auditd
sudo auditctl -s       # Kernel audit status
sudo auditctl -l       # List loaded rules
```

#### 3.3 Audit Rules

Rules are loaded at runtime with `auditctl` or persistently from `/etc/audit/rules.d/*.rules` (applied on start by `augenrules --load`).

**Syntax:**

```bash
# File/directory watch
auditctl -w PATH -p PERMISSIONS -k KEY

# Syscall watch
auditctl -a always,exit -F arch=b64 -S SYSCALL -k KEY
```

**Permission flags for `-p`:** `r` (read), `w` (write), `x` (execute), `a` (attribute change)

**Recommended rules (`/etc/audit/rules.d/hardening.rules`):**

```bash
# Identity files
-w /etc/passwd  -p wa -k identity
-w /etc/shadow  -p wa -k identity
-w /etc/group   -p wa -k identity
-w /etc/gshadow -p wa -k identity

# SSH configuration
-w /etc/ssh/sshd_config -p wa -k sshd_config

# sudo usage
-w /usr/bin/sudo -p x -k sudo_usage

# sudoers changes
-w /etc/sudoers      -p wa -k sudoers
-w /etc/sudoers.d/   -p wa -k sudoers

# Login records
-w /var/log/faillog  -p wa -k logins
-w /var/log/lastlog  -p wa -k logins
```

Apply persistent rules: `sudo augenrules --load`

#### 3.4 `ausearch` — Query the Audit Log

```bash
sudo ausearch -k identity              # By key tag
sudo ausearch -k identity -ts today    # Key + time
sudo ausearch -m USER_AUTH             # By event type
sudo ausearch -m USER_CMD              # sudo commands
sudo ausearch -m AVC                   # SELinux denials
sudo ausearch -ua alice                # By username
sudo ausearch -k identity --interpret  # Human-readable output
```

**Common event types:**

| Type | Meaning |
|------|---------|
| `USER_AUTH` | Authentication event (PAM) |
| `USER_LOGIN` | User login |
| `USER_CMD` | Command run via sudo |
| `AVC` | SELinux access denial |
| `SYSCALL` | System call |
| `PATH` | File path touched in an event |
| `EXECVE` | Argument list of an executed command |

#### 3.5 `aureport` — Summary Reports

```bash
sudo aureport                  # Overall summary
sudo aureport --auth           # Authentication events
sudo aureport --auth --failed  # Failed authentications only
sudo aureport --user           # Users who have audit events
sudo aureport --executable     # Executables that generated events
sudo aureport --comm --success # Successful commands
sudo aureport --start today --end now  # Time-bounded report
```

---

### Part 4: Cron & Scheduled Tasks

#### 4.1 Crontab Syntax

```
min  hour  dom  month  dow   command
 *     *    *     *     *    /usr/bin/script.sh
```

| Field | Range | Special chars |
|-------|-------|---------------|
| minute | 0–59 | `*` (any), `,` (list), `-` (range), `/` (step) |
| hour | 0–23 | same |
| day of month | 1–31 | same |
| month | 1–12 or Jan–Dec | same |
| day of week | 0–7 (0 and 7 = Sunday) | same |

**Examples:**

```bash
*/15 * * * *        # Every 15 minutes
0 2 * * *           # Daily at 2:00am
30 8 * * 1-5        # Weekdays at 8:30am
0 0 1 * *           # 1st of every month at midnight
0 */6 * * *         # Every 6 hours
@reboot             # Once on boot
@daily              # Equivalent to: 0 0 * * *
```

#### 4.2 Managing Crontabs

```bash
crontab -e               # Edit current user's crontab
crontab -l               # List current user's crontab
crontab -r               # Remove current user's crontab
sudo crontab -u alice -e  # Edit another user's crontab (root only)
sudo crontab -u alice -l  # List another user's crontab
```

#### 4.3 System Cron Locations

| Location | Purpose |
|----------|---------|
| `/etc/crontab` | System crontab — has user field |
| `/etc/cron.d/` | Drop-in cron files — have user field |
| `/etc/cron.hourly/` | Scripts run once per hour |
| `/etc/cron.daily/` | Scripts run once per day |
| `/etc/cron.weekly/` | Scripts run once per week |
| `/etc/cron.monthly/` | Scripts run once per month |

Scripts in the `cron.{hourly,daily,weekly,monthly}` dirs are executed by `run-parts`. Requirements:
- Must be executable (`chmod +x`)
- Filename must not contain a dot (e.g. `backup` not `backup.sh`)

**System crontab format** (`/etc/crontab`) adds a user field before the command:
```
17 * * * *  root  run-parts /etc/cron.hourly
```

**Drop-in format** (`/etc/cron.d/myapp`) — same as system crontab:
```
MAILTO=admin@example.com
0 3 * * *  appuser  /opt/myapp/cleanup.sh >> /var/log/cleanup.log 2>&1
```

#### 4.4 Cron Output

By default, cron emails the output to the local user. On servers without a mail system, this output is silently discarded.

Best practices:
- Redirect output to a log file: `>> /var/log/myjob.log 2>&1`
- Or set `MAILTO=admin@example.com` at the top of the crontab
- Never use `> /dev/null 2>&1` in production unless the command is truly safe to ignore

#### 4.5 `at` — One-Off Jobs

```bash
sudo apt install at   # Install

echo "/usr/bin/backup.sh" | at 03:00           # Run at 3am today
echo "/usr/bin/reboot" | at now + 2 hours      # Run in 2 hours

atq                  # List pending jobs
atrm 3               # Cancel job #3
at -c 3              # Show job #3's commands
```

#### 4.6 systemd Timers

A `.timer` unit triggers a `.service` unit. Advantages over cron:
- Output captured in journal (no silent failures)
- `Persistent=true` runs missed jobs after downtime
- Better dependency management

**`/etc/systemd/system/backup.timer`:**
```ini
[Unit]
Description=Daily Backup

[Timer]
OnCalendar=daily
Persistent=true
Unit=backup.service

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers --all     # Show all timers and next run time
```

#### 4.7 Cron Security

**Access control:**
- `/etc/cron.allow` — if present, only listed users can use cron
- `/etc/cron.deny` — if `cron.allow` doesn't exist, listed users are blocked

**Audit all crontabs (incident response):**

```bash
for user in $(cut -d: -f1 /etc/passwd); do
    entries=$(sudo crontab -u "$user" -l 2>/dev/null)
    [ -n "$entries" ] && echo "=== $user ===" && echo "$entries"
done
ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.hourly/
cat /etc/crontab
```

---

## Key Commands Reference

### journald
```bash
journalctl -f
journalctl -u sshd
journalctl -b
journalctl -p err
journalctl --since today
journalctl -k
journalctl --vacuum-size=500M
```

### rsyslog
```bash
sudo systemctl restart rsyslog
# Config: /etc/rsyslog.conf, /etc/rsyslog.d/
```

### logrotate
```bash
sudo logrotate -d /etc/logrotate.d/myapp   # Dry run
sudo logrotate -f /etc/logrotate.d/myapp   # Force
```

### auditd
```bash
sudo auditctl -l
sudo auditctl -w /etc/passwd -p wa -k identity
sudo augenrules --load
sudo ausearch -k identity -ts today --interpret
sudo aureport --auth --failed
```

### cron
```bash
crontab -e
crontab -l
sudo crontab -u user -l
atq
atrm N
systemctl list-timers --all
```

---

## Practical Exercises

### Exercise 1: journalctl Investigation
1. Run `journalctl -u sshd --since today -p info --no-pager` and count entries.
2. Attempt 3 failed SSH logins (wrong password). Find them in the journal.
3. Use `awk` and `sort | uniq -c` to count failed logins by IP from the journal output.
4. Check disk usage with `journalctl --disk-usage`.

### Exercise 2: logrotate
1. Create `/var/log/testapp/app.log` with some content.
2. Write `/etc/logrotate.d/testapp`: daily, rotate 5, compress, missingok, create 0640 root adm.
3. Run `logrotate -d` to validate. Run `logrotate -f` to force rotation.
4. Check that the rotated file exists and is gzipped.

### Exercise 3: auditd Watch Rules
1. Install `auditd` and start it.
2. Add a rule: `auditctl -w /etc/passwd -p wa -k passwd_watch`
3. Edit `/etc/passwd` (use `chfn` to change a GECOS field, then revert).
4. Run `ausearch -k passwd_watch --interpret` and find the event.
5. Run `aureport --user` and note the output.
6. Add the rule to `/etc/audit/rules.d/` and reload with `augenrules --load`.

### Exercise 4: Cron Scheduling
1. Open `crontab -e`. Add an entry that runs `date >> /tmp/heartbeat.log` every 2 minutes.
2. Wait 6 minutes. Check `/tmp/heartbeat.log` has at least 3 entries.
3. Remove the entry.
4. As root, audit all user crontabs using the loop in section 4.7.

### Exercise 5: systemd Timer
1. Create a service unit `/etc/systemd/system/heartbeat.service` that runs `date >> /tmp/timer.log`.
2. Create a timer unit `/etc/systemd/system/heartbeat.timer` that fires every 2 minutes.
3. Enable and start the timer.
4. Verify with `systemctl list-timers --all` and `journalctl -u heartbeat.service`.

---

## Troubleshooting Guide

**Journal not persisting across reboots:**
```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
# Or: set Storage=persistent in /etc/systemd/journald.conf
```

**auditd rules not loading after reboot:**
```bash
# Rules must be in /etc/audit/rules.d/*.rules (not set via auditctl alone)
sudo augenrules --load
sudo systemctl restart auditd
```

**Cron job not running:**
```bash
# Check cron daemon is running
sudo systemctl status cron   # Debian
sudo systemctl status crond  # RHEL

# Check cron log
grep CRON /var/log/syslog
journalctl -u cron

# Verify script is executable and path is absolute
chmod +x /path/to/script.sh
```

**logrotate not compressing:**
```bash
# delaycompress skips the most recent rotation — this is correct
# Second run will compress the previous rotation
sudo logrotate -f /etc/logrotate.d/myapp  # Rotate again to see compression
```

---

## Questions for Review

1. What is the difference between volatile and persistent journal storage?
2. What does `journalctl -p err` show? Is `err` included?
3. What is a syslog facility, and how does it differ from severity?
4. Why should you forward logs to a remote server?
5. What does `logrotate` do, and what problem does it solve?
6. What is the difference between `auditd` and `syslog` in terms of what triggers the event?
7. What does the `-k` flag in an `auditctl` rule do?
8. What is the difference between `ausearch` and `aureport`?
9. Write a crontab entry that runs `/usr/bin/backup.sh` at 3:30am every Sunday.
10. Why should you audit all user crontabs after a security incident?

---

**Instructor Notes:**
- **CLO 5:** Analyze system logs and audit trails — this lecture is the core of that outcome
- **Lab 11: Auditd & Logrotate** — key exercises are the audit watch rule and the logrotate config
- **Quiz 3 (Week 14)** covers Week 11: `journalctl` filtering, `logrotate`, `auditd` rules, `ausearch`/`aureport`, cron syntax
- **Connect to Week 10:** `ausearch -m AVC` was introduced in Week 10 — revisit it to reinforce the connection
- **Connect to Week 12:** Docker containers redirect stdout to the journal — same `journalctl -u` pattern applies
- **Live demo:** Show the SSH brute-force detection workflow: multiple failed logins → `journalctl -u sshd | grep Failed` → count by IP
- **Common student mistake:** Adding `auditctl` rules at runtime without adding them to `/etc/audit/rules.d/` — rules vanish on reboot
- **Common student mistake:** Cron script not executable (`chmod +x`), or using a relative path in the command
