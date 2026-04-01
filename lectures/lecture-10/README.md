# Lecture 10: Mandatory Access Control (SELinux)

## Overview

This lecture introduces Mandatory Access Control (MAC) and SELinux as the third layer of the defense-in-depth stack (after SSH hardening and firewalls). Students learn why traditional DAC permissions are insufficient against compromised processes, how SELinux enforces type enforcement policy, and how to manage security contexts, booleans, and AVC denials. The goal is confident day-to-day operation of SELinux-enabled systems — not disabling it.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain the difference between Discretionary Access Control (DAC) and Mandatory Access Control (MAC)
2. Describe SELinux modes (enforcing, permissive, disabled) and when each is appropriate
3. Read and interpret a four-field SELinux security context (`user:role:type:level`)
4. Use `ls -Z`, `ps -Z`, and `id -Z` to inspect security contexts
5. Change file contexts temporarily with `chcon` and permanently with `semanage fcontext` + `restorecon`
6. Manage SELinux booleans with `getsebool` and `setsebool -P`
7. Register non-standard ports with `semanage port`
8. Troubleshoot AVC denials using `ausearch`, `audit2why`, and `sealert`
9. Generate and install a custom policy module with `audit2allow` when no boolean exists

## Topics Covered

### Part 1: DAC vs MAC

#### 1.1 Discretionary Access Control (DAC)

Traditional Linux permissions are *discretionary*: the owner of a file decides who can access it via `chmod`/`chown`. Key properties:

- Processes run with the full permissions of the user who started them
- UID 0 (root) bypasses all DAC checks
- If a service is compromised, the attacker inherits the service's permissions

**The problem:** A web server process exploited via a vulnerability can read `/etc/shadow`, database credential files, or open reverse shells — DAC cannot prevent this.

#### 1.2 Mandatory Access Control (MAC)

MAC shifts control from the file owner to a system-wide policy:

- Every process runs in a *domain* (type ending in `_t`, e.g. `httpd_t`)
- Every file/socket/port has a *label* (also a type, e.g. `httpd_sys_content_t`)
- The kernel's SELinux module checks every access: "Does policy allow domain X to perform action Y on label Z?"
- If no explicit allow rule exists → **denied**, even for root

#### 1.3 DAC vs MAC Comparison

| Feature | DAC | MAC (SELinux) |
|---------|-----|---------------|
| Policy set by | File owner | System administrator |
| Root bypass | Yes | No |
| Granularity | user/group/other | type → type, per operation |
| Default stance | Allow unless denied | Deny unless allowed |
| Linux implementations | chmod, ACLs | SELinux, AppArmor |

Both must allow an access for it to succeed. DAC allows + MAC denies = **denied**.

---

### Part 2: SELinux Architecture

#### 2.1 Modes

| Mode | Behavior |
|------|----------|
| **Enforcing** | Policy is enforced; denials are blocked and logged to audit.log |
| **Permissive** | Policy is not enforced; denials are logged only (useful for debugging) |
| **Disabled** | SELinux is completely off; no labeling, no logging |

```bash
getenforce                  # Print current mode
sestatus                    # Full status
sudo setenforce 0           # Switch to permissive (runtime only)
sudo setenforce 1           # Switch to enforcing (runtime only)
```

#### 2.2 Persistent Configuration

`/etc/selinux/config`:
```
SELINUX=enforcing
SELINUXTYPE=targeted
```

Changing `SELINUX=disabled` requires a reboot. Going from disabled back to enforcing requires a full filesystem relabel:
```bash
sudo touch /.autorelabel
sudo reboot
```

#### 2.3 Policy Types

| Type | Description |
|------|-------------|
| **targeted** | Confines specific daemons; all other processes run as `unconfined_t`. Default and most practical. |
| **mls** | Multi-Level Security with Bell-LaPadula model (classified/secret). Used in government environments. |

#### 2.4 How Policy Decisions Work

SELinux uses Type Enforcement (TE) rules:
```
allow httpd_t httpd_sys_content_t:file { read open getattr };
```

This rule says: processes in domain `httpd_t` may `read`, `open`, and `getattr` files labeled `httpd_sys_content_t`.

If no matching allow rule exists, access is denied and an AVC (Access Vector Cache) denial is logged.

---

### Part 3: Security Contexts & Labels

#### 3.1 Context Format

```
user:role:type:level
```

| Field | Meaning | Common Values |
|-------|---------|---------------|
| user | SELinux user (not Linux user) | `system_u`, `unconfined_u` |
| role | RBAC role | `system_r` (daemons), `object_r` (files) |
| type | Domain or label — the key field | `httpd_t`, `httpd_sys_content_t` |
| level | MLS sensitivity (targeted policy: always `s0`) | `s0` |

#### 3.2 Viewing Contexts

```bash
ls -Z /var/www/html/index.html
# system_u:object_r:httpd_sys_content_t:s0  /var/www/html/index.html

ps -eZ | grep httpd
# system_u:system_r:httpd_t:s0  ...  /usr/sbin/httpd

id -Z
# unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023

sudo semanage port -l | grep http
# http_port_t    tcp    80, 443, 8080, 8443
```

#### 3.3 Changing File Contexts

**Temporary (`chcon`):**
```bash
sudo chcon -t httpd_sys_content_t /var/www/myapp/index.html
sudo chcon -R -t httpd_sys_content_t /var/www/myapp/
```

`chcon` changes are overwritten by `restorecon` or a relabel. Use for testing only.

**Restoring defaults (`restorecon`):**
```bash
sudo restorecon -v /var/www/html/index.html
sudo restorecon -Rv /var/www/         # recursive, verbose
sudo restorecon -Rvn /var/www/        # dry run
```

**Important:** `cp` inherits the destination's context. `mv` preserves the source's context. Files moved from home directories to `/var/www/html` will have `user_home_t` — fix with `restorecon`.

**Permanent context rules (`semanage fcontext`):**
```bash
# Add a rule
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/myapp(/.*)?"

# Apply the rule
sudo restorecon -Rv /srv/myapp/

# List custom rules
sudo semanage fcontext -l -C

# Delete a rule
sudo semanage fcontext -d "/srv/myapp(/.*)?"
```

The regex `(/.*)?` matches the directory itself and all files inside recursively.

#### 3.4 Port Contexts

SELinux also restricts which ports a domain can bind to or connect on.

```bash
# List allowed ports
sudo semanage port -l | grep http
# http_port_t    tcp    80, 443, 8080, 8443

# Allow Apache to bind on port 8888
sudo semanage port -a -t http_port_t -p tcp 8888

# Remove the mapping
sudo semanage port -d -t http_port_t -p tcp 8888
```

---

### Part 4: Booleans & Troubleshooting

#### 4.1 SELinux Booleans

Booleans are on/off switches built into the policy. They enable common optional behaviors without writing custom policy.

```bash
getsebool -a                              # List all booleans
getsebool -a | grep httpd                 # Filter
sudo setsebool httpd_can_network_connect on    # Set (runtime)
sudo setsebool -P httpd_can_network_connect on # Set (persistent)
sudo semanage boolean -l | grep httpd     # List with descriptions
```

**Always use `-P`** to persist across reboots.

**Common booleans:**

| Boolean | Purpose | Default |
|---------|---------|---------|
| `httpd_can_network_connect` | Apache makes arbitrary TCP connections | off |
| `httpd_can_network_connect_db` | Apache connects to DB port | off |
| `httpd_can_sendmail` | Apache sends email via sendmail/postfix | off |
| `httpd_enable_homedirs` | Apache serves from user home dirs | off |
| `samba_enable_home_dirs` | Samba shares home directories | off |
| `ftpd_anon_write` | FTP allows anonymous uploads | off |

#### 4.2 Reading AVC Denials

```bash
sudo ausearch -m AVC -ts recent           # Recent denials
sudo ausearch -m AVC -ts today            # Today's denials
sudo grep "avc:  denied" /var/log/audit/audit.log
```

**Anatomy of an AVC message:**
```
type=AVC msg=audit(1234567890.123:456): avc:  denied  { read }
  for pid=1234 comm="httpd" name="config.php"
  scontext=system_u:system_r:httpd_t:s0
  tcontext=unconfined_u:object_r:user_home_t:s0
  tclass=file permissive=0
```

- `{ read }` — denied operation
- `comm` — process name
- `scontext` — source (process) context
- `tcontext` — target (file/resource) context
- `tclass` — object class (file, dir, tcp_socket, etc.)

#### 4.3 `audit2why` — Explain the Denial

```bash
sudo ausearch -m AVC -ts recent | audit2why
```

Output explains why the denial occurred and often suggests a fix:
- "The boolean `httpd_enable_homedirs` is set to off" → `setsebool -P httpd_enable_homedirs on`
- "Missing type enforcement (TE) allow rule" → need `audit2allow` or `restorecon`

#### 4.4 `audit2allow` — Generate Custom Policy

When no boolean covers the use case:

```bash
sudo ausearch -m AVC -ts recent | audit2allow           # Show rules
sudo ausearch -m AVC -ts recent | audit2allow -M mypol  # Create module
sudo semodule -i mypol.pp                               # Install module
```

**Review the generated rules before installing.** Overly broad custom policy weakens SELinux. Only install the minimum necessary allow rules.

#### 4.5 `sealert` — Human-Readable Alerts

`sealert` (from `setroubleshoot`) provides ranked suggestions:

```bash
sudo sealert -a /var/log/audit/audit.log
```

Ranks solutions by confidence and prints the exact command to run.

#### 4.6 Troubleshooting Workflow

```
Service broken after deploy?
  │
  ├─ getenforce → Enforcing?
  │    └─ Yes: check for AVC denials
  │
  ├─ ausearch -m AVC -ts recent
  │    └─ Found denials?
  │         ├─ audit2why → boolean suggested → setsebool -P
  │         ├─ "wrong context" → restorecon -Rv /path
  │         ├─ "port not allowed" → semanage port -a
  │         └─ no boolean → audit2allow -M → review → semodule -i
  │
  └─ Still failing? setenforce 0, reproduce, collect all AVCs, fix, setenforce 1
```

---

## Common Pitfalls

| Pitfall | Cause | Fix |
|---------|-------|-----|
| File moved with `mv` has wrong label | `mv` preserves source context | `restorecon -Rv /destination` |
| Files in non-standard web root denied | Missing `httpd_sys_content_t` label | `semanage fcontext -a` + `restorecon` |
| Service can't bind to custom port | Port not in SELinux type list | `semanage port -a -t <type> -p tcp <port>` |
| App can't connect to database | `httpd_can_network_connect_db` off | `setsebool -P httpd_can_network_connect_db on` |
| `audit2allow` installed blindly | Overly permissive policy | Review rules before `semodule -i` |

---

## Key Commands Reference

```bash
# Mode management
getenforce
sestatus
sudo setenforce 0 | 1
# /etc/selinux/config — persistent

# Viewing contexts
ls -Z /path
ps -eZ | grep service
id -Z
sudo semanage port -l | grep type

# File contexts
sudo chcon -t TYPE /path              # Temporary
sudo restorecon -Rv /path             # Restore defaults
sudo semanage fcontext -a -t TYPE "/path(/.*)?"  # Add rule
sudo semanage fcontext -l -C          # List custom rules
sudo restorecon -Rv /path             # Apply rule

# Port contexts
sudo semanage port -a -t TYPE -p tcp PORT
sudo semanage port -l | grep TYPE

# Booleans
getsebool -a | grep NAME
sudo setsebool -P BOOLEAN on|off
sudo semanage boolean -l | grep NAME

# Troubleshooting
sudo ausearch -m AVC -ts recent
sudo ausearch -m AVC -ts recent | audit2why
sudo ausearch -m AVC -ts recent | audit2allow
sudo ausearch -m AVC -ts recent | audit2allow -M mypol
sudo semodule -i mypol.pp
sudo sealert -a /var/log/audit/audit.log
```

---

## Practical Exercises

### Exercise 1: Check Modes
1. Run `getenforce` and `sestatus`. Note the current mode and policy type.
2. Switch to permissive with `sudo setenforce 0`. Confirm with `getenforce`.
3. Switch back to enforcing. Check `/etc/selinux/config` and note if mode matches.

### Exercise 2: File Context Investigation
1. Create `/tmp/testfile.html` and check its context with `ls -Z`.
2. Copy it to `/var/www/html/` with `cp`. Check the context.
3. Create `/tmp/testfile2.html`, then move it with `mv`. Check the context.
4. Use `restorecon -v` to fix the moved file's context.

### Exercise 3: Custom Web Root
1. Create directory `/srv/mysite/` and a test `index.html`.
2. Configure Apache to serve from `/srv/mysite/` (update `DocumentRoot`).
3. Attempt to access via browser/curl. Note the SELinux denial in `audit.log`.
4. Use `audit2why` to diagnose. Apply the fix with `semanage fcontext` + `restorecon`.
5. Verify the site loads.

### Exercise 4: Port Context
1. Configure Apache to listen on port 8888 in `httpd.conf`.
2. Try to start Apache. Check for errors.
3. Check `audit.log` for the AVC denial.
4. Use `semanage port -a` to add port 8888 to `http_port_t`.
5. Start Apache and verify it binds.

### Exercise 5: Booleans
1. Run `getsebool -a | grep httpd` and review available booleans.
2. Check the value of `httpd_can_network_connect`.
3. Try to make Apache connect to a backend (curl from a PHP script, or `wget` from Apache context).
4. Check `audit.log`. Use `audit2why` — note the boolean suggestion.
5. Enable the boolean with `setsebool -P`. Verify the connection succeeds.

---

## Questions for Review

1. What is the fundamental difference between DAC and MAC?
2. In which SELinux mode are policy violations logged but not enforced?
3. What are the four fields in a SELinux security context, and which one matters most for Type Enforcement?
4. What command restores a file's context to its default policy label?
5. What is the difference between `chcon` and `semanage fcontext`?
6. Why should you use `setsebool -P` rather than `setsebool`?
7. What does an AVC denial message tell you, and where are these messages logged?
8. What tool explains why an AVC denial occurred and what to do about it?
9. When would you use `audit2allow`, and what caution should you exercise?
10. Why is "just disable SELinux" bad advice?

---

**Instructor Notes:**
- **CLO 5:** Analyze logs and audit trails, detect SELinux violations — this lecture directly addresses this
- **Lab 10: SELinux Contexts** — key exercises are custom web root and boolean troubleshooting
- **Quiz 2 (Week 12)** covers Week 10: modes, contexts, `ls -Z`, `chcon`, `restorecon`, booleans, `audit2why`
- **Connect to Week 9:** Firewalls = network perimeter. SELinux = process-level confinement. Both needed.
- **Connect to Week 11:** `auditd` logs SELinux denials in `/var/log/audit/audit.log` — students will return to this
- **Live demo:** Show `ls -Z /var/www/html`, copy a file from `~/` to `/var/www/html/` with `cp` vs `mv`, show why `mv` needs `restorecon`
- **Common student mistake:** Adding `semanage fcontext` rule but forgetting to run `restorecon` afterward
- **Platform note:** SELinux is RHEL/CentOS/Fedora. Ubuntu uses AppArmor. Lab VMs should be CentOS Stream or RHEL-based for this lecture.
