---
theme: default
background: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 9
  Linux Administration & *nix Systems for Cybersecurity

  Firewalls & Packet Filtering
drawings:
  persist: false
transition: slide-left
title: 'Lecture 9: Firewalls & Packet Filtering'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Firewalls & Packet Filtering

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 9: Perimeter Defense with iptables & UFW
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

### Part 1: Firewall Fundamentals
- What is a firewall & why it matters
- Packet filtering vs. stateful inspection
- Netfilter framework & Linux firewall stack

</div>

<div>

### Part 2: iptables Deep Dive
- Chains: INPUT, FORWARD, OUTPUT
- Rule syntax & default policies
- Stateful inspection (conntrack)

</div>

</div>

<div class="grid grid-cols-2 gap-6 text-sm mt-2">

<div>

### Part 3: UFW — Uncomplicated Firewall
- UFW as iptables frontend
- allow/deny rules & application profiles
- Common patterns & best practices

</div>

<div>

### Part 4: Advanced & Real-World
- Persisting rules, logging
- Combining with SSH hardening
- nftables & firewalld overview

</div>

</div>

---
layout: default
---

# 🔄 Quick Recap: Week 8

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### SSH Hardening

<v-clicks>

- Key-based auth (Ed25519), disable passwords
- `PermitRootLogin no`, `AllowUsers`
- Fail2Ban for brute-force protection
- `~/.ssh/config`, port forwarding

</v-clicks>

</div>

<div>

### Key Takeaways

<v-clicks>

- SSH is the #1 attack target on Linux servers
- Defense in depth: keys + Fail2Ban + non-default port
- **Today**: Add another layer — **firewall rules**
- Firewall controls *which* traffic reaches SSH at all

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🛡️ <strong>Perimeter Defense:</strong> Firewalls filter traffic before it reaches services. SSH hardening + firewall = layered security.
</div>

---
layout: section
---

# Part 1
## 🛡️ Firewall Fundamentals

---
layout: default
---

# 🛡️ What is a Firewall?

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Definition

<v-clicks>

- **Firewall**: Network security device that monitors and controls traffic
- Operates at Layer 3 (IP) and Layer 4 (TCP/UDP)
- Decides: allow or drop packets based on rules
- Sits between trusted (internal) and untrusted (external) networks

</v-clicks>

</div>

<div>

### Why Firewalls Matter

<v-clicks>

- **Defense in depth** — even if a service has bugs, firewall can block access
- **Least privilege** — only allow what's needed
- **Reduce attack surface** — close unused ports
- **Logging** — detect scan/attack attempts

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Reality:</strong> Default Linux install often has no firewall enabled. Exposed services = easy targets for automated scanners.
</div>

---
layout: default
---

# 📦 Packet Filtering vs. Stateful Inspection

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Stateless (Packet Filtering)

<v-clicks>

- Each packet evaluated **independently**
- Rules: source IP, dest IP, port, protocol
- **Problem**: Can't distinguish reply from new connection
- Example: Allow port 22 in → must also allow port 22 out for replies

</v-clicks>

</div>

<div>

### Stateful (Connection Tracking)

<v-clicks>

- Tracks **connections** (conntrack)
- Knows: "this packet is part of established session"
- **Benefit**: Allow established/related, drop new unsolicited
- Example: Allow SSH out → replies automatically allowed

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Linux uses stateful inspection</strong> via `nf_conntrack` — essential for practical firewall rules.
</div>

---
layout: default
---

# 🏗️ Netfilter & the Linux Firewall Stack

<div class="text-sm">

<v-clicks>

### Netfilter Framework

- **Netfilter**: Kernel subsystem for packet manipulation
- **iptables**: User-space tool to configure Netfilter rules
- **nftables**: Modern successor (we'll touch on it later)

### Packet Flow Through Chains

```
[Internet] → PREROUTING → FORWARD → POSTROUTING → [Internal]
                ↓
            INPUT → [Local Process]
                ↑
            OUTPUT ← [Local Process]
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
🔑 <strong>Three main chains:</strong> <code>INPUT</code> (to this host), <code>OUTPUT</code> (from this host), <code>FORWARD</code> (routed traffic).
</div>

---
layout: default
---

# 📊 Netfilter Tables

<div class="text-sm">

| Table | Purpose | Common Use |
|-------|---------|------------|
| **filter** | Default — allow/drop | Most firewall rules |
| **nat** | NAT, port forwarding | Masquerading, DNAT |
| **mangle** | Packet modification | TOS, TTL |
| **raw** | Bypass conntrack | Performance tuning |

</div>

<v-clicks>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Default:</strong> <code>iptables -L</code> shows the <code>filter</code> table. Use <code>-t nat</code> for NAT rules.
</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Order matters:</strong> Rules are evaluated top-to-bottom. First match wins.
</div>

</v-clicks>

---
layout: section
---

# Part 2
## 🔧 iptables Deep Dive

---
layout: default
---

# 🔗 The Three Main Chains

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### INPUT
Traffic **destined for this host**

<v-clicks>

- Incoming SSH, HTTP, etc.
- **Most rules go here** for a server
- Block unwanted external access

</v-clicks>

</div>

<div>

### OUTPUT
Traffic **originating from this host**

<v-clicks>

- Outgoing connections
- Often permissive (allow all)
- Restrict for compliance/egress control

</v-clicks>

</div>

</div>

<div class="mt-2">

### FORWARD
Traffic **passing through** (routing)

<v-clicks>

- Used when host acts as router/gateway
- For simple servers: often empty

</v-clicks>

</div>

---
layout: default
---

# 📝 iptables Rule Syntax

<div class="text-sm">

### Basic Structure

```bash
iptables -A CHAIN -p PROTOCOL --dport PORT -j TARGET
```

| Option | Meaning | Example |
|--------|---------|---------|
| `-A` | Append rule to chain | `-A INPUT` |
| `-p` | Protocol | `-p tcp`, `-p udp`, `-p icmp` |
| `--dport` | Destination port | `--dport 22` |
| `-s` | Source IP | `-s 192.168.1.0/24` |
| `-j` | Jump to target | `-j ACCEPT`, `-j DROP`, `-j REJECT` |

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-xs">
🚨 <strong>Note:</strong> <code>--dport</code> and <code>--sport</code> require <code>-p tcp</code> or <code>-p udp</code>.
</div>

---
layout: default
---

# 🎯 iptables Targets

<div class="text-sm">

| Target | Action |
|--------|--------|
| **ACCEPT** | Allow the packet |
| **DROP** | Silently discard (no response) |
| **REJECT** | Discard + send ICMP/port unreachable |
| **LOG** | Log and continue to next rule |
| **RETURN** | Return to calling chain |

</div>

<v-clicks>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>DROP vs REJECT:</strong> DROP = stealth (attacker gets no response). REJECT = polite (client gets error). For security, DROP is often preferred on INPUT.
</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Default policy:</strong> What happens if no rule matches. Set with <code>iptables -P CHAIN ACCEPT|DROP</code>.
</div>

</v-clicks>

---
layout: default
---

# 📋 iptables: Common Commands

<div class="text-sm">

```bash
# List rules (filter table)
iptables -L -n -v

# Set default policy
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established/related (stateful!)
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
```

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-xs">
🚨 <strong>Order:</strong> Established/related FIRST, then specific allows, default policy last. Wrong order = lockout!
</div>

---
layout: default
---

# 🔄 Stateful Inspection: conntrack

<div class="grid grid-cols-2 gap-2 text-sm">

<div>

### Connection States

<v-clicks>

- **NEW**: First packet of new connection
- **ESTABLISHED**: Connection in progress
- **RELATED**: Related (e.g. FTP data)
- **INVALID**: Malformed or suspicious

</v-clicks>

</div>

<div>

### The Golden Rule

```bash
iptables -A INPUT -m conntrack \
  --ctstate ESTABLISHED,RELATED -j ACCEPT
```

<v-clicks>

- Allows **replies** to outbound connections
- Without this: SSH out works, but responses get dropped!
- Place this rule **early** in the chain

</v-clicks>

</div>

</div>

---
layout: default
---

# 🌐 Example: Minimal Server Ruleset

<div class="text-xs">

```bash
iptables -F && iptables -X
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT
```

</div>

---
layout: default
---

# 📝 iptables Logging

<div class="text-sm">

```bash
# Log dropped packets (before DROP rule)
iptables -A INPUT -m limit --limit 5/min -j LOG \
  --log-prefix "iptables-INPUT-drop: " --log-level 4

# View logs
sudo dmesg | grep iptables
# Or: journalctl -k | grep iptables
```

</div>

<v-clicks>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>--limit</strong> prevents log flooding. Without it, a port scan could fill disk with log entries.
</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>LOG target:</strong> Packet continues to next rule after logging. Put LOG before DROP.
</div>

</v-clicks>

---
layout: default
---

# 💾 Persisting iptables Rules

<div class="text-sm">

### Rules are in-memory — lost on reboot!

```bash
# Save rules (Debian/Ubuntu)
sudo iptables-save > /etc/iptables/rules.v4

# Restore on boot: install iptables-persistent
sudo apt install iptables-persistent
# Saves to /etc/iptables/rules.v4 on install/reboot

# Manual save/restore
sudo iptables-save > rules.backup
sudo iptables-restore rules.backup
```

</div>

<div class="grid grid-cols-2 gap-4 text-xs mt-2">

<div class="p-2 bg-green-500 bg-opacity-20 rounded">
✅ <strong>Debian/Ubuntu:</strong> <code>iptables-persistent</code> package
</div>

<div class="p-2 bg-yellow-500 bg-opacity-20 rounded">
💡 <strong>RHEL/Fedora:</strong> <code>firewalld</code> or <code>iptables-service</code>
</div>

</div>

---
layout: section
---

# Part 3
## 🔥 UFW — Uncomplicated Firewall

---
layout: default
---

# 🔥 What is UFW?

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Uncomplicated Firewall

<v-clicks>

- **Frontend** for iptables
- Default on Ubuntu/Debian
- Simpler syntax than raw iptables
- Still generates iptables rules under the hood

</v-clicks>

</div>

<div>

### Why Use UFW?

<v-clicks>

- Easier to learn and remember
- Application profiles (predefined rules)
- Less error-prone
- Good for most server use cases

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>UFW translates to iptables.</strong> Run <code>iptables -L</code> after UFW rules to see the result.
</div>

---
layout: default
---

# 🔧 UFW Basic Commands

<div class="text-sm">

```bash
# Enable/disable (asks for confirmation)
sudo ufw enable
sudo ufw disable

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow/deny rules
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 23/tcp

# By application name
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

</div>

<div class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-xs">
💡 Application profiles in <code>/etc/ufw/applications.d/</code>. List with <code>ufw app list</code>.
</div>

---
layout: default
---

# 📋 UFW Rule Syntax

<div class="text-sm">

```bash
# Allow from specific IP
sudo ufw allow from 192.168.1.100

# Allow from subnet
sudo ufw allow from 192.168.1.0/24 to any port 22

# Deny from IP
sudo ufw deny from 10.0.0.50

# Allow to specific port with protocol
sudo ufw allow 53/udp
sudo ufw allow 53/tcp
```

</div>

<div class="grid grid-cols-2 gap-4 text-xs mt-2">

<div class="p-2 bg-green-500 bg-opacity-20 rounded">
✅ Rules are **stateful** by default — replies allowed automatically
</div>

<div class="p-2 bg-yellow-500 bg-opacity-20 rounded">
💡 <code>ufw status numbered</code> — show rules with numbers for delete
</div>

</div>

---
layout: default
---

# 📊 UFW Status & Management

<div class="text-sm">

```bash
# Status
sudo ufw status
sudo ufw status verbose
sudo ufw status numbered

# Delete rule by number
sudo ufw delete 3

# Delete by rule
sudo ufw delete allow 22/tcp

# Reset (disable + flush all rules)
sudo ufw reset

# Reload (apply changes)
sudo ufw reload
```

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>ufw reset</strong> removes everything. Use with caution. Ensure SSH is allowed before enabling!
</div>

---
layout: default
---

# 🔒 UFW: Secure Default Setup

<div class="text-sm">

### Recommended Order

```bash
# 1. Allow SSH FIRST (avoid lockout!)
sudo ufw allow 22/tcp
# Or: sudo ufw allow ssh

# 2. Set defaults
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 3. Add other allows
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. Enable (will prompt)
sudo ufw enable

# 5. Verify
sudo ufw status verbose
```

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Always allow SSH before enabling!</strong> Locking yourself out of a remote server = need console access.
</div>

---
layout: default
---

# 📝 UFW Logging

<div class="text-sm">

```bash
# Enable logging (off, low, medium, high, full)
sudo ufw logging on
sudo ufw logging medium

# Logs go to
# /var/log/ufw.log  (or syslog, depending on config)
```

</div>

<div class="grid grid-cols-2 gap-4 text-xs mt-2">

<div class="p-2 bg-yellow-500 bg-opacity-20 rounded">
💡 <strong>low</strong> = blocked only. <strong>medium</strong> = blocked + policy violations. <strong>high</strong> = all packets.
</div>

<div class="p-2 bg-green-500 bg-opacity-20 rounded">
✅ Use <code>medium</code> for typical servers — see attacks without log flood
</div>

</div>

---
layout: section
---

# Part 4
## 🚀 Advanced & Real-World

---
layout: default
---

# 🛡️ Firewall + SSH Hardening: Layered Defense

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Combine Both

<v-clicks>

- Firewall: restrict which IPs can reach port 22
- SSH: key-only auth, no root, Fail2Ban
- Example: Allow SSH only from office VPN subnet

</v-clicks>

</div>

<div>

### Example: Restrict SSH by IP

```bash
# UFW
sudo ufw deny 22/tcp
sudo ufw allow from 203.0.113.0/24 to any port 22

# iptables equivalent
iptables -A INPUT -p tcp -s 203.0.113.0/24 --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j DROP
```

</div>

</div>

---
layout: default
---

# 📊 Common Firewall Patterns

<div class="text-sm">

| Pattern | Use Case |
|---------|----------|
| **Default deny in** | Block all, allow explicit — most secure |
| **Default allow out** | Let server make outbound connections |
| **Allow loopback** | Required for local services |
| **ESTABLISHED,RELATED first** | Stateful — allow replies |
| **Log before drop** | Debug and detect scans |
| **Restrict by IP** | Limit SSH/admin to trusted networks |

</div>

<div class="mt-2 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Principle:</strong> Least privilege. Only open what's needed. Prefer IP allowlists over "allow from any."
</div>

---
layout: default
---

# 🔄 nftables & firewalld Overview

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### nftables

<v-clicks>

- **Successor** to iptables
- Single framework, better performance
- Different syntax
- `nft` command, rules in `/etc/nftables.conf`

</v-clicks>

</div>

<div>

### firewalld

<v-clicks>

- Default on RHEL, Fedora, CentOS
- Zone-based (public, internal, etc.)
- Dynamic updates without restart
- Uses iptables or nftables as backend

</v-clicks>

</div>

</div>

<div v-click class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
💡 <strong>For this course:</strong> Focus on iptables + UFW. nftables/firewalld are good to know for RHEL environments.
</div>

---
layout: default
---

# ✅ Firewall Security Checklist

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Configuration

- [ ] Default deny incoming
- [ ] Allow SSH before enabling
- [ ] ESTABLISHED,RELATED rule (stateful)
- [ ] Allow loopback (lo)
- [ ] Only open required ports
- [ ] Restrict SSH by IP if possible

</div>

<div>

### Operations

- [ ] Persist rules (iptables-persistent / ufw)
- [ ] Enable logging (medium level)
- [ ] Test from second session before closing SSH
- [ ] Document rules for audit
- [ ] Combine with SSH hardening

</div>

</div>

---
layout: default
---

# 📊 Summary: Firewalls & Packet Filtering

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Key Concepts

1. **Netfilter/iptables**: Kernel + user-space firewall
2. **Chains**: INPUT, OUTPUT, FORWARD
3. **Stateful**: conntrack — ESTABLISHED,RELATED
4. **Targets**: ACCEPT, DROP, REJECT, LOG
5. **UFW**: Simpler frontend for iptables
6. **Persistence**: iptables-save, iptables-persistent

</div>

<div>

### Rule Order Matters

1. Loopback
2. ESTABLISHED,RELATED
3. Specific allows (SSH, HTTP, etc.)
4. Log (optional)
5. Default policy (DROP)

</div>

</div>

---
layout: default
---

# 🎯 Learning Objectives: Did We Achieve?

<v-clicks>

### By now, you should be able to:

- ✅ Explain packet filtering vs. stateful inspection
- ✅ Describe the INPUT, FORWARD, OUTPUT chains
- ✅ Write iptables rules with `-A`, `-p`, `--dport`, `-j`
- ✅ Use conntrack for ESTABLISHED,RELATED
- ✅ Configure UFW with allow/deny rules
- ✅ Persist firewall rules across reboots
- ✅ Combine firewall with SSH hardening
- ✅ Enable logging and interpret firewall logs

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
🎓 <strong>Next Week:</strong> Mandatory Access Control (SELinux) — contexts, booleans, and audit2why!
</div>

---
layout: default
---

# 🧪 Lab Practice: Firewalls

<div class="text-sm">

### Exercise 1: iptables from Scratch
On a lab VM, flush rules and build a minimal ruleset: default deny INPUT, allow loopback, ESTABLISHED/RELATED, SSH (22), HTTP (80). Test with `curl` and `ss`.

### Exercise 2: UFW Setup
Configure UFW with the same rules. Use `ufw allow ssh`, `ufw allow 80/tcp`. Enable and verify with `ufw status verbose`. Compare with `iptables -L`.

### Exercise 3: Restrict SSH by IP
Add a rule to allow SSH only from your lab subnet (e.g. 192.168.1.0/24). Test from allowed and blocked IPs. Document the rule.

### Exercise 4: Logging
Enable UFW logging at medium level. Trigger a blocked connection (e.g. try to connect to closed port from another machine). Inspect `/var/log/ufw.log` or `journalctl`.

</div>

---
layout: default
---

# 🔗 Additional Resources

<div class="text-sm">

### Documentation
- [netfilter/iptables](https://netfilter.org/) — Official project
- [UFW Ubuntu Documentation](https://help.ubuntu.com/community/UFW) — UFW guide
- [nftables wiki](https://wiki.nftables.org/) — nftables reference

### Books & Guides
- *"Linux Firewalls"* by Steve Suehring — iptables/nftables
- [Arch Wiki: iptables](https://wiki.archlinux.org/title/iptables) — Comprehensive reference
- [CIS Benchmark](https://www.cisecurity.org/) — Firewall hardening

### Practice
- Set up two VMs: one as "server" with firewall, one as "attacker" — run `nmap` scans
- Build a ruleset that allows only HTTP/HTTPS and SSH from specific IP

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="pt-12 text-xl">
Next: Mandatory Access Control (SELinux)
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/yourusername/css262" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>
