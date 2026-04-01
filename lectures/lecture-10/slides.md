---
theme: default
background: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 10
  Linux Administration & *nix Systems for Cybersecurity

  Mandatory Access Control (SELinux)
drawings:
  persist: false
transition: slide-left
title: 'Lecture 10: Mandatory Access Control (SELinux)'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Mandatory Access Control (SELinux)

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 10: Confining Processes with SELinux
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

### Part 1: DAC vs MAC
- Why standard permissions aren't enough
- Discretionary vs. Mandatory Access Control
- Real-world breaches that MAC prevents

</div>

<div>

### Part 2: SELinux Architecture
- Modes: enforcing, permissive, disabled
- Policies: targeted vs. MLS
- Checking & changing modes

</div>

</div>

<div class="grid grid-cols-2 gap-6 text-sm mt-2">

<div>

### Part 3: Security Contexts & Labels
- Users, roles, types, levels
- `ls -Z`, `ps -Z`, `id -Z`
- `chcon`, `restorecon`, `semanage fcontext`

</div>

<div>

### Part 4: Booleans & Troubleshooting
- Tuning policy with `setsebool`
- `audit2why`, `audit2allow`
- Common SELinux denials & fixes

</div>

</div>

---
layout: default
---

# 🔄 Quick Recap: Week 9

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Firewalls & Packet Filtering

<v-clicks>

- Netfilter/iptables: chains, tables, targets
- Stateful inspection with conntrack
- UFW as iptables frontend
- Default deny, allow SSH first, persist rules

</v-clicks>

</div>

<div>

### Key Takeaways

<v-clicks>

- Firewalls control **network** access (Layer 3/4)
- But what if an attacker gets **past** the firewall?
- A compromised Apache process can read `/etc/shadow`?
- **Today**: Confine processes to their own sandbox

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🛡️ <strong>Defense in Depth:</strong> Firewalls guard the perimeter. SELinux guards what processes can do <em>after</em> they're running.
</div>

---
layout: section
---

# Part 1
## 🔓 DAC vs MAC

---
layout: default
---

# 🔓 Discretionary Access Control (DAC)

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### How Traditional Linux Permissions Work

<v-clicks>

- Owner of a file **decides** who can access it
- `chmod`, `chown`, `chgrp` — user-controlled
- Root (UID 0) bypasses **all** permissions
- Processes inherit the permissions of the user who started them

</v-clicks>

</div>

<div>

### The Problem

<v-clicks>

- If Apache runs as `www-data` and gets exploited...
- Attacker has **all** rights of `www-data`
- Can read anything `www-data` can read
- Root processes? **Unlimited access** if compromised
- DAC trusts the user — not the process

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>DAC Weakness:</strong> A single compromised daemon can escalate to read sensitive files, open network connections, or pivot laterally — DAC can't stop it.
</div>

---
layout: default
---

# 🛡️ Mandatory Access Control (MAC)

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### How MAC Works

<v-clicks>

- **System policy** decides access — not the user
- Even root is subject to MAC rules
- Each process is confined to a **security domain**
- Each file/resource has a **security label**
- Access = policy must explicitly allow domain → label

</v-clicks>

</div>

<div>

### Benefits

<v-clicks>

- Compromised Apache can only access **Apache files**
- Root exploit in a service? Still confined by policy
- **Least privilege** enforced by the kernel
- Defense in depth: DAC + MAC + firewall
- Required by PCI-DSS, DISA STIG, HIPAA

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>MAC Principle:</strong> "Even if you are root, if the policy says no, the answer is no."
</div>

---
layout: default
---

# 📊 DAC vs MAC Comparison

<div class="text-sm">

| Feature | DAC (Traditional) | MAC (SELinux) |
|---------|-------------------|---------------|
| **Who sets policy** | File owner | System administrator |
| **Root bypass** | Yes — root can do anything | No — root is confined too |
| **Granularity** | User/group/other | Process type → resource label |
| **Default** | Permissive (allow unless denied) | Restrictive (deny unless allowed) |
| **Use case** | Desktop, dev environments | Servers, compliance, production |
| **Linux implementations** | chmod, chown, ACLs | SELinux, AppArmor |

</div>

<v-clicks>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>DAC + MAC together:</strong> Both must allow access. DAC says yes + MAC says no = <strong>denied</strong>.
</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔑 <strong>SELinux</strong> is the MAC implementation on RHEL, CentOS, Fedora, and Amazon Linux. <strong>AppArmor</strong> is used on Ubuntu/Debian.
</div>

</v-clicks>

---
layout: default
---

# 💥 Real-World: Why MAC Matters

<div class="text-sm">

<v-clicks>

### Scenario: Apache Exploit Without SELinux

1. Attacker finds RCE in a PHP application
2. Gains shell as `www-data` (Apache's user)
3. Reads `/etc/shadow` → offline password cracking
4. Reads database credentials in `/var/www/config.php`
5. Opens reverse shell to external C2 server
6. **Full compromise** from a single web vulnerability

### Same Scenario WITH SELinux (enforcing)

1. Attacker gains shell as `www-data` — but process is type `httpd_t`
2. `httpd_t` cannot read `/etc/shadow` → **denied**
3. `httpd_t` cannot open arbitrary network ports → **denied**
4. `httpd_t` can only access files labeled `httpd_sys_content_t`
5. Attacker is **confined** — limited blast radius

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>SELinux turns a full server compromise into a contained web-tier incident.</strong>
</div>

---
layout: section
---

# Part 2
## ⚙️ SELinux Architecture

---
layout: default
---

# ⚙️ SELinux Modes

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Three Modes

<v-clicks>

- **Enforcing** — Policy is enforced; denials are blocked and logged
- **Permissive** — Policy is not enforced; denials are logged only
- **Disabled** — SELinux is completely off; no labels, no logging

</v-clicks>

</div>

<div>

### Checking & Changing

```bash
# Check current mode
getenforce
# Output: Enforcing | Permissive | Disabled

# Temporarily switch (until reboot)
sudo setenforce 0   # Permissive
sudo setenforce 1   # Enforcing

# Check detailed status
sestatus
```

</div>

</div>

<v-clicks>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Production:</strong> Always <code>Enforcing</code>. Use <code>Permissive</code> only for debugging.
</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Never disable SELinux!</strong> "Just disable SELinux" is the #1 bad advice on the internet. Fix the policy instead.
</div>

</v-clicks>

---
layout: default
---

# 📄 Persistent Mode Configuration

<div class="text-sm">

### `/etc/selinux/config`

```bash
# /etc/selinux/config
SELINUX=enforcing
SELINUXTYPE=targeted
```

| Setting | Options | Description |
|---------|---------|-------------|
| `SELINUX` | `enforcing`, `permissive`, `disabled` | Mode after reboot |
| `SELINUXTYPE` | `targeted`, `mls` | Policy type |

</div>

<v-clicks>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Changing to/from <code>disabled</code> requires a reboot</strong> and full filesystem relabel (<code>touch /.autorelabel && reboot</code>). This can take 10+ minutes.
</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Targeted policy:</strong> Confines specific services (httpd, sshd, etc.) while leaving unconfined processes alone. This is the default and most practical.
</div>

</v-clicks>

---
layout: default
---

# 🏗️ SELinux Policy Architecture

<div class="text-sm">

<v-clicks>

### How SELinux Decides

```
Process (subject)        Resource (object)
   httpd_t        →         httpd_sys_content_t
       ↓                           ↓
   "Can httpd_t read files labeled httpd_sys_content_t?"
       ↓
   Policy says: ALLOW ✅  (or DENY ❌)
```

### Policy Components

| Component | Description |
|-----------|-------------|
| **Type Enforcement (TE)** | Core — which types can access which types |
| **Role-Based Access Control (RBAC)** | Which roles can transition to which types |
| **Multi-Level Security (MLS)** | Sensitivity levels (classified, secret, top-secret) |

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Type Enforcement</strong> is what you'll work with 99% of the time. Types on processes ("domains") and types on files ("labels") are the core concept.
</div>

---
layout: default
---

# 📊 sestatus — Full Status Check

<div class="text-sm">

```bash
$ sestatus
SELinux status:                 enabled
SELinuxfs mount:                /sys/fs/selinux
SELinux root directory:         /etc/selinux
Loaded policy name:             targeted
Current mode:                   enforcing
Mode from config file:          enforcing
Policy MLS status:              enabled
Policy deny_unknown status:     allowed
Memory protection checking:     actual (secure)
Max kernel policy version:      33
```

</div>

<v-clicks>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>Key fields:</strong> "Current mode" = runtime mode. "Mode from config file" = mode after reboot. These can differ if you used <code>setenforce</code>.
</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Loaded policy:</strong> <code>targeted</code> means only specific services are confined. Unconfined processes run as <code>unconfined_t</code>.
</div>

</v-clicks>

---
layout: section
---

# Part 3
## 🏷️ Security Contexts & Labels

---
layout: default
---

# 🏷️ SELinux Security Contexts

<div class="text-sm">

### Every Process and File Has a Context

```
user:role:type:level
```

| Field | Meaning | Example |
|-------|---------|---------|
| **user** | SELinux user (not Linux user) | `system_u`, `unconfined_u` |
| **role** | Role for RBAC | `system_r`, `object_r` |
| **type** | Domain (process) or label (file) | `httpd_t`, `httpd_sys_content_t` |
| **level** | MLS sensitivity | `s0`, `s0:c0.c1023` |

</div>

<v-clicks>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔑 <strong>The type field is what matters most.</strong> Type Enforcement rules use it to decide access: "Can domain <code>httpd_t</code> read type <code>httpd_sys_content_t</code>?"
</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 Convention: process types end in <code>_t</code>, file types end in <code>_t</code>, booleans often end in <code>_bool</code>.
</div>

</v-clicks>

---
layout: default
---

# 🔍 Viewing Contexts: `-Z` Flag

<div class="text-sm">

### Files

```bash
$ ls -Z /var/www/html/index.html
unconfined_u:object_r:httpd_sys_content_t:s0  /var/www/html/index.html
```

### Processes

```bash
$ ps auxZ | grep httpd
system_u:system_r:httpd_t:s0    root  1234  ... /usr/sbin/httpd
```

### Current User

```bash
$ id -Z
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
```

### Ports

```bash
$ sudo semanage port -l | grep http
http_port_t    tcp    80, 443, 8080, 8443
```

</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Remember:</strong> Add <code>-Z</code> to <code>ls</code>, <code>ps</code>, <code>id</code>, <code>netstat</code> to see SELinux contexts.
</div>

---
layout: default
---

# 🔧 Changing File Contexts: `chcon`

<div class="text-sm">

### Temporary Context Change

```bash
# Change type of a file
sudo chcon -t httpd_sys_content_t /var/www/myapp/index.html

# Change full context
sudo chcon system_u:object_r:httpd_sys_content_t:s0 /var/www/myapp/index.html

# Recursive
sudo chcon -R -t httpd_sys_content_t /var/www/myapp/
```

</div>

<v-clicks>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong><code>chcon</code> is temporary!</strong> A filesystem relabel (<code>restorecon</code>) will overwrite your changes. Use <code>semanage fcontext</code> for permanent changes.
</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>Use <code>chcon</code> for quick testing</strong>, then make it permanent with <code>semanage fcontext</code> + <code>restorecon</code>.
</div>

</v-clicks>

---
layout: default
---

# 🔄 Restoring Contexts: `restorecon`

<div class="text-sm">

### Reset to Default Labels

```bash
# Restore default context for a file
sudo restorecon -v /var/www/html/index.html

# Recursive — restore entire directory
sudo restorecon -Rv /var/www/

# Check what would change (dry run)
sudo restorecon -Rvn /var/www/
```

### When to Use

<v-clicks>

- After moving/copying files (context may not match destination)
- After `chcon` experiments — reset to known good
- After adding rules with `semanage fcontext`
- Full system relabel: `touch /.autorelabel && reboot`

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong><code>cp</code> inherits destination context; <code>mv</code> preserves source context.</strong> This is the #1 cause of SELinux issues with moved files!
</div>

---
layout: default
---

# 📝 Permanent Context Rules: `semanage fcontext`

<div class="text-sm">

### Add a Permanent File Context Rule

```bash
# Add rule: all files under /srv/myapp get httpd_sys_content_t
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/myapp(/.*)?"

# Apply the rule
sudo restorecon -Rv /srv/myapp/
```

### Manage Rules

```bash
# List all custom rules
sudo semanage fcontext -l -C

# Delete a rule
sudo semanage fcontext -d "/srv/myapp(/.*)?"
```

</div>

<div class="grid grid-cols-2 gap-4 text-xs mt-2">

<div class="p-2 bg-green-500 bg-opacity-20 rounded">
✅ <strong>Workflow:</strong> 1) <code>semanage fcontext -a</code> → 2) <code>restorecon -Rv</code> → context survives relabels
</div>

<div class="p-2 bg-yellow-500 bg-opacity-20 rounded">
💡 The regex <code>(/.*)?</code> matches the directory and everything inside recursively
</div>

</div>

---
layout: default
---

# 🌐 Managing Port Contexts

<div class="text-sm">

### SELinux also controls which ports services can bind to

```bash
# List allowed ports for HTTP
sudo semanage port -l | grep http_port_t
# http_port_t    tcp    80, 443, 8080, 8443

# Add a custom port (e.g., run Apache on 8888)
sudo semanage port -a -t http_port_t -p tcp 8888

# Delete a port mapping
sudo semanage port -d -t http_port_t -p tcp 8888
```

</div>

<v-clicks>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Common error:</strong> Starting Apache on port 9090 fails with "Permission denied" even as root — SELinux blocks it because 9090 isn't in <code>http_port_t</code>.
</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Fix:</strong> <code>sudo semanage port -a -t http_port_t -p tcp 9090</code> — then restart the service.
</div>

</v-clicks>

---
layout: section
---

# Part 4
## 🔧 Booleans & Troubleshooting

---
layout: default
---

# 🔘 SELinux Booleans

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### What Are Booleans?

<v-clicks>

- **On/off switches** for policy features
- Toggle without writing custom policy
- Example: "Allow httpd to connect to the network"
- Hundreds of booleans available

</v-clicks>

### Common Booleans

```bash
httpd_can_network_connect    off
httpd_can_sendmail           off
httpd_enable_homedirs        off
samba_enable_home_dirs       off
ftpd_full_access             off
```

</div>

<div>

### Managing Booleans

```bash
# List all booleans
getsebool -a

# Filter
getsebool -a | grep httpd

# Set temporarily (until reboot)
sudo setsebool httpd_can_network_connect on

# Set permanently
sudo setsebool -P httpd_can_network_connect on

# List with descriptions
sudo semanage boolean -l | grep httpd
```

</div>

</div>

---
layout: default
---

# 🔘 Common Boolean Scenarios

<div class="text-sm">

| Scenario | Boolean | Default |
|----------|---------|---------|
| Apache connects to DB backend | `httpd_can_network_connect_db` | off |
| Apache connects to any network | `httpd_can_network_connect` | off |
| Apache sends email | `httpd_can_sendmail` | off |
| Apache serves user home dirs | `httpd_enable_homedirs` | off |
| Samba shares home directories | `samba_enable_home_dirs` | off |
| FTP allows uploads | `ftpd_anon_write` | off |
| HTTPD can execute CGI | `httpd_enable_cgi` | on |

</div>

<v-clicks>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>Booleans are the easiest fix.</strong> Before writing custom policy, check if a boolean already exists for your use case.
</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Use <code>-P</code> flag</strong> to persist across reboots! Without it, boolean resets on next boot.
</div>

</v-clicks>

---
layout: default
---

# 🔍 Troubleshooting: Reading AVC Denials

<div class="text-sm">

### Where Denials Are Logged

```bash
# Audit log (primary)
sudo ausearch -m AVC -ts recent

# System journal
sudo journalctl -t setroubleshoot

# Messages log
sudo grep "avc:  denied" /var/log/audit/audit.log
```

### Anatomy of an AVC Denial

```
type=AVC msg=audit(1234567890.123:456): avc:  denied  { read }
  for pid=1234 comm="httpd" name="config.php"
  dev="sda1" ino=789012
  scontext=system_u:system_r:httpd_t:s0
  tcontext=unconfined_u:object_r:user_home_t:s0
  tclass=file permissive=0
```

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🔑 <strong>Key fields:</strong> <code>scontext</code> = source (process), <code>tcontext</code> = target (file), <code>{ read }</code> = denied action, <code>tclass</code> = object class.
</div>

---
layout: default
---

# 🛠️ `audit2why` — Explain the Denial

<div class="text-sm">

### Translate AVC Messages into Human-Readable Explanations

```bash
# Pipe audit log through audit2why
sudo ausearch -m AVC -ts recent | audit2why
```

### Example Output

```
type=AVC msg=audit(...): avc:  denied  { read } for ...
  scontext=system_u:system_r:httpd_t:s0
  tcontext=unconfined_u:object_r:user_home_t:s0

    Was caused by:
        Missing type enforcement (TE) allow rule.
        You can use audit2allow to generate a loadable module to allow this access.

    # Or: "The boolean httpd_enable_homedirs is set to off"
    #     setsebool -P httpd_enable_homedirs on
```

</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong><code>audit2why</code> often tells you the exact boolean to flip.</strong> Always check this before writing custom policy.
</div>

---
layout: default
---

# 🛠️ `audit2allow` — Generate Custom Policy

<div class="text-sm">

### When No Boolean Exists

```bash
# Generate a TE rule
sudo ausearch -m AVC -ts recent | audit2allow

# Generate a loadable policy module
sudo ausearch -m AVC -ts recent | audit2allow -M mypolicy
sudo semodule -i mypolicy.pp
```

### Workflow

```
1. Hit denial in enforcing mode
2. Check audit.log → ausearch -m AVC
3. Run audit2why → is there a boolean?
   ├─ Yes → setsebool -P <boolean> on
   └─ No  → audit2allow → review → semodule -i
4. Test again
```

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Never blindly run <code>audit2allow</code> and install!</strong> Review the generated rules. Overly permissive custom policy defeats the purpose of SELinux.
</div>

---
layout: default
---

# 🔄 SELinux Troubleshooting Workflow

<div class="text-sm">

```
Service not working?
  ↓
Check: getenforce → is SELinux enforcing?
  ↓ Yes
Check logs: ausearch -m AVC -ts recent
  ↓
Run: audit2why
  ↓
├─ "Boolean X is off"     → setsebool -P X on
├─ "Wrong file context"   → restorecon -Rv /path
├─ "Wrong port context"   → semanage port -a -t type -p tcp PORT
└─ "Missing TE rule"      → audit2allow -M policy → review → semodule -i
  ↓
Test the fix
  ↓
Verify: ausearch -m AVC -ts recent (no new denials)
```

</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>Tip:</strong> Switch to permissive (<code>setenforce 0</code>), reproduce the issue, collect all denials, fix them, then go back to enforcing (<code>setenforce 1</code>).
</div>

---
layout: default
---

# 📝 `setroubleshoot` — GUI-Friendly Diagnostics

<div class="text-sm">

### Install & Use

```bash
# Install setroubleshoot
sudo yum install setroubleshoot setroubleshoot-server

# View recent alerts
sudo sealert -a /var/log/audit/audit.log

# Real-time monitoring
sudo journalctl -t setroubleshoot -f
```

### Example Output

```
SELinux is preventing httpd from read access on the file config.php

***** Plugin restorecon (99.5 confidence) suggests *****
If you want to fix the label:
    /sbin/restorecon -v /var/www/html/config.php
```

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong><code>sealert</code> ranks solutions by confidence.</strong> Start with the highest-confidence suggestion.
</div>

</div>

---
layout: default
---

# ⚠️ Common SELinux Pitfalls

<div class="text-sm">

| Pitfall | Cause | Fix |
|---------|-------|-----|
| File copied with `mv` | `mv` preserves source context | `restorecon -Rv /destination` |
| Custom web root | Files not labeled `httpd_sys_content_t` | `semanage fcontext` + `restorecon` |
| Non-standard port | Port not in SELinux port list | `semanage port -a` |
| App can't connect to DB | `httpd_can_network_connect_db` is off | `setsebool -P` |
| Home dir in web root | `httpd_enable_homedirs` is off | `setsebool -P` or fix file labels |
| "Just disable SELinux" | Nukes all MAC protection | Fix the actual denial instead |

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>#1 Rule:</strong> Never disable SELinux. If it's blocking something, the fix is almost always: wrong label, missing boolean, or missing port context.
</div>

---
layout: default
---

# ✅ SELinux Security Checklist

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Configuration

- [ ] SELinux is in **enforcing** mode
- [ ] `/etc/selinux/config` says `enforcing`
- [ ] Targeted policy loaded
- [ ] No unnecessary custom modules
- [ ] File contexts match expected labels
- [ ] Non-standard ports registered with `semanage`

</div>

<div>

### Operations

- [ ] Monitor denials: `ausearch -m AVC`
- [ ] Use `audit2why` before custom policy
- [ ] Use `restorecon` after moving files
- [ ] Set booleans with `-P` flag (persist)
- [ ] Document any custom policy modules
- [ ] Test changes in permissive, deploy in enforcing

</div>

</div>

---
layout: default
---

# 📊 Summary: Mandatory Access Control (SELinux)

<div class="grid grid-cols-2 gap-2 text-sm">

<div>

### Key Concepts

1. **DAC vs MAC**: DAC = user decides; MAC = policy decides
2. **Modes**: Enforcing, Permissive, Disabled
3. **Contexts**: `user:role:type:level` on every object
4. **Type Enforcement**: Core — `domain_t` can access `type_t`
5. **Booleans**: Toggle policy features on/off
6. **Troubleshooting**: `ausearch` → `audit2why` → fix

</div>

<div>

### Essential Commands

<div class="text-xs">

| Command | Purpose |
|---------|---------|
| `getenforce` / `sestatus` | Check mode & status |
| `ls -Z` / `ps -Z` | View contexts |
| `chcon -t TYPE` | Temporary label change |
| `restorecon -Rv` | Restore default labels |
| `semanage fcontext` | Permanent context rules |
| `setsebool -P` | Toggle booleans |
| `ausearch -m AVC` | Find denials |
| `audit2why` | Explain denials |

</div>

</div>

</div>

---
layout: default
---

# 🎯 Learning Objectives: Did We Achieve?

<v-clicks>

### By now, you should be able to:

- ✅ Explain the difference between DAC and MAC
- ✅ Describe SELinux modes and when to use each
- ✅ Read and interpret security contexts (`user:role:type:level`)
- ✅ Use `ls -Z`, `ps -Z`, `id -Z` to inspect contexts
- ✅ Change file contexts with `chcon` and `restorecon`
- ✅ Create permanent context rules with `semanage fcontext`
- ✅ Manage SELinux booleans with `getsebool` and `setsebool -P`
- ✅ Troubleshoot denials using `ausearch`, `audit2why`, and `sealert`

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
🎓 <strong>Next Week:</strong> Logging, Auditing & Cron — journald, rsyslog, logrotate, auditd, and scheduled tasks!
</div>

---
layout: default
---

# 🧪 Lab Practice: SELinux Contexts

<div class="text-sm">

### Exercise 1: Check & Toggle Modes
Verify SELinux is enforcing with `getenforce` and `sestatus`. Switch to permissive with `setenforce 0`, confirm, then switch back. Check `/etc/selinux/config` for boot-time setting.

### Exercise 2: File Contexts
Create a file in `/tmp/`, then move it to `/var/www/html/`. Check its context with `ls -Z`. Use `restorecon` to fix it. Verify the context changed to `httpd_sys_content_t`.

### Exercise 3: Custom Web Root
Create `/srv/mysite/index.html`. Use `semanage fcontext` to assign `httpd_sys_content_t`. Apply with `restorecon`. Configure Apache to serve from `/srv/mysite` and verify it works.

### Exercise 4: Booleans & Troubleshooting
Attempt to have Apache connect to a backend service. Check `audit.log` for the AVC denial. Run `audit2why` to identify the boolean. Enable it with `setsebool -P` and verify the connection works.

</div>

---
layout: default
---

# 🔗 Additional Resources

<div class="text-sm">

### Documentation
- [Red Hat SELinux User's Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/using_selinux/) — Comprehensive reference
- [SELinux Project Wiki](https://selinuxproject.org/page/Main_Page) — Community documentation
- [Fedora SELinux Guide](https://docs.fedoraproject.org/en-US/quick-docs/getting-started-with-selinux/) — Getting started

### Books & Guides
- *"SELinux System Administration"* by Sven Vermeulen — Deep dive into SELinux
- [Gentoo SELinux Handbook](https://wiki.gentoo.org/wiki/SELinux) — Thorough technical reference
- [CIS Benchmark](https://www.cisecurity.org/) — SELinux hardening section

### Practice
- Install RHEL/CentOS VM with SELinux enforcing
- Deploy Apache with a custom web root and fix all SELinux denials
- Use `audit2why` to troubleshoot Samba or PostgreSQL access issues

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="pt-12 text-xl">
Next: Logging, Auditing & Cron
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/yourusername/css262" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>
