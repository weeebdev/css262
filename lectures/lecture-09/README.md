# Lecture 9: Firewalls & Packet Filtering

## Overview

This lecture introduces Linux firewall fundamentals, focusing on the Netfilter framework, iptables, and UFW (Uncomplicated Firewall). Students learn packet filtering vs. stateful inspection, the INPUT/FORWARD/OUTPUT chain model, rule syntax, and how to combine firewalls with SSH hardening for defense in depth. By the end, students can configure perimeter defense on Linux servers—essential for securing internet-facing services.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain the difference between stateless packet filtering and stateful inspection
2. Describe the Netfilter framework and the roles of INPUT, OUTPUT, and FORWARD chains
3. Write iptables rules using `-A`, `-p`, `--dport`, `-s`, `-j` and understand default policies
4. Use connection tracking (conntrack) for ESTABLISHED and RELATED states
5. Configure UFW with allow/deny rules and application profiles
6. Persist firewall rules across reboots using iptables-persistent
7. Enable and interpret firewall logging
8. Combine firewall rules with SSH hardening for layered security
9. Apply common firewall patterns (default deny, restrict by IP, log before drop)

## Topics Covered

### Part 1: Firewall Fundamentals

#### 1.1 What is a Firewall?

- **Firewall**: Network security device that monitors and controls traffic based on rules
- Operates at Layer 3 (IP) and Layer 4 (TCP/UDP)
- Decides: allow or drop packets
- Sits between trusted (internal) and untrusted (external) networks

**Why it matters:** Default Linux installs often have no firewall enabled. Exposed services are easy targets for automated scanners (Shodan, masscan, nmap).

#### 1.2 Packet Filtering vs. Stateful Inspection

| Stateless | Stateful |
|----------|----------|
| Each packet evaluated independently | Tracks connections (conntrack) |
| Rules: source IP, dest IP, port, protocol | Knows "this packet is part of established session" |
| Must explicitly allow replies | ESTABLISHED/RELATED automatically allowed |
| Simpler but less flexible | Essential for practical rules |

**Linux uses stateful inspection** via `nf_conntrack` kernel module.

#### 1.3 Netfilter Framework

- **Netfilter**: Kernel subsystem for packet manipulation
- **iptables**: User-space tool to configure Netfilter rules
- **nftables**: Modern successor (different syntax)

**Packet flow:**
```
[Internet] → PREROUTING → FORWARD → POSTROUTING → [Internal]
                ↓
            INPUT → [Local Process]
                ↑
            OUTPUT ← [Local Process]
```

**Three main chains for filter table:**
- **INPUT**: Traffic destined for this host (incoming SSH, HTTP, etc.)
- **OUTPUT**: Traffic originating from this host
- **FORWARD**: Traffic passing through (when host acts as router)

#### 1.4 Netfilter Tables

| Table | Purpose |
|-------|---------|
| **filter** | Default — allow/drop (most firewall rules) |
| **nat** | NAT, port forwarding |
| **mangle** | Packet modification (TOS, TTL) |
| **raw** | Bypass conntrack for performance |

`iptables -L` shows the filter table by default. Use `-t nat` for NAT rules.

---

### Part 2: iptables Deep Dive

#### 2.1 Rule Syntax

```bash
iptables -A CHAIN -p PROTOCOL --dport PORT -j TARGET
```

| Option | Meaning | Example |
|--------|---------|---------|
| `-A` | Append rule | `-A INPUT` |
| `-I` | Insert at position | `-I INPUT 1` |
| `-D` | Delete rule | `-D INPUT 3` |
| `-p` | Protocol | `-p tcp`, `-p udp`, `-p icmp` |
| `--dport` | Destination port | `--dport 22` |
| `--sport` | Source port | `--sport 1024:65535` |
| `-s` | Source IP | `-s 192.168.1.0/24` |
| `-d` | Destination IP | `-d 10.0.0.1` |
| `-i` | Incoming interface | `-i eth0` |
| `-o` | Outgoing interface | `-o eth0` |
| `-j` | Jump to target | `-j ACCEPT`, `-j DROP`, `-j REJECT` |

**Note:** `--dport` and `--sport` require `-p tcp` or `-p udp`.

#### 2.2 Targets

| Target | Action |
|--------|--------|
| **ACCEPT** | Allow the packet |
| **DROP** | Silently discard (no response) |
| **REJECT** | Discard + send ICMP/port unreachable |
| **LOG** | Log and continue to next rule |
| **RETURN** | Return to calling chain |

**DROP vs REJECT:** DROP = stealth (attacker gets no response). REJECT = polite (client gets error). For security, DROP is often preferred on INPUT.

#### 2.3 Default Policies

```bash
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

Default policy applies when no rule matches. **Order of rules matters** — first match wins.

#### 2.4 Stateful Inspection (conntrack)

Connection states:
- **NEW**: First packet of new connection
- **ESTABLISHED**: Connection in progress
- **RELATED**: Related to existing (e.g. FTP data channel)
- **INVALID**: Malformed or suspicious

**The golden rule:**
```bash
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

This allows replies to outbound connections. Without it, SSH out works but responses get dropped. Place this rule **early** in the chain.

#### 2.5 Minimal Server Ruleset

```bash
iptables -F
iptables -X
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT  # optional
```

#### 2.6 Logging

```bash
iptables -A INPUT -m limit --limit 5/min -j LOG \
  --log-prefix "iptables-INPUT-drop: " --log-level 4
```

`--limit` prevents log flooding. LOG target continues to next rule — put LOG before DROP.

#### 2.7 Persisting Rules

Rules are in-memory — lost on reboot.

```bash
# Debian/Ubuntu
sudo apt install iptables-persistent
# Saves to /etc/iptables/rules.v4 on install and reboot

# Manual
sudo iptables-save > /etc/iptables/rules.v4
sudo iptables-restore < /etc/iptables/rules.v4
```

---

### Part 3: UFW — Uncomplicated Firewall

#### 3.1 What is UFW?

- **Frontend** for iptables
- Default on Ubuntu/Debian
- Simpler syntax, less error-prone
- Generates iptables rules under the hood

#### 3.2 Basic Commands

```bash
sudo ufw enable
sudo ufw disable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow ssh
sudo ufw deny 23/tcp
sudo ufw allow from 192.168.1.0/24 to any port 22
```

#### 3.3 Application Profiles

```bash
ufw app list
sudo ufw allow 'Nginx Full'
```

Profiles in `/etc/ufw/applications.d/`.

#### 3.4 Status & Management

```bash
sudo ufw status
sudo ufw status verbose
sudo ufw status numbered
sudo ufw delete 3
sudo ufw delete allow 22/tcp
sudo ufw reset
sudo ufw reload
```

#### 3.5 Secure Default Setup

**Order matters — allow SSH first!**
```bash
sudo ufw allow 22/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 3.6 Logging

```bash
sudo ufw logging on
sudo ufw logging medium
```

Logs: `/var/log/ufw.log` or syslog. Levels: off, low, medium, high, full.

---

### Part 4: Advanced & Real-World

#### 4.1 Firewall + SSH Hardening

Combine both for defense in depth:
- Firewall: restrict which IPs can reach port 22
- SSH: key-only auth, no root, Fail2Ban

```bash
# UFW: SSH only from office VPN
sudo ufw deny 22/tcp
sudo ufw allow from 203.0.113.0/24 to any port 22
```

#### 4.2 Common Patterns

| Pattern | Use Case |
|---------|----------|
| Default deny in | Block all, allow explicit |
| Default allow out | Server makes outbound connections |
| Allow loopback | Required for local services |
| ESTABLISHED,RELATED first | Stateful — allow replies |
| Log before drop | Debug and detect scans |
| Restrict by IP | Limit SSH/admin to trusted networks |

#### 4.3 nftables & firewalld

- **nftables**: Successor to iptables, different syntax, `nft` command
- **firewalld**: Default on RHEL/Fedora, zone-based, uses iptables/nftables backend

---

## Practical Exercises

### Exercise 1: iptables from Scratch

1. On a lab VM, run `sudo iptables -F` and `sudo iptables -X` (ensure you have console access!)
2. Set default policies: DROP INPUT/FORWARD, ACCEPT OUTPUT
3. Add: loopback, ESTABLISHED/RELATED, SSH (22), HTTP (80)
4. Test: `curl localhost`, `ss -tlnp`
5. From another machine: `nmap -p 22,80 <server-ip>`

### Exercise 2: UFW Setup

1. Configure UFW: `ufw allow ssh`, `ufw allow 80/tcp`, `ufw default deny incoming`
2. Enable UFW
3. Run `ufw status verbose` and `iptables -L -n -v`
4. Compare UFW rules with generated iptables rules

### Exercise 3: Restrict SSH by IP

1. Add UFW rule: allow SSH only from 192.168.1.0/24 (or your lab subnet)
2. Deny SSH from other sources
3. Test from allowed IP (should work) and blocked IP (should fail)
4. Document the rule for audit

### Exercise 4: Logging

1. Enable UFW logging: `ufw logging medium`
2. From another machine, try to connect to a closed port (e.g. `nc -zv <server> 9999`)
3. Inspect logs: `tail -f /var/log/ufw.log` or `journalctl -u ufw -f`
4. Identify the blocked connection attempt

### Exercise 5: Persistence

1. Configure iptables or UFW with desired rules
2. For iptables: install `iptables-persistent`, verify rules in `/etc/iptables/`
3. Reboot the VM
4. Verify rules are still active

## Troubleshooting Guide

### Common Issues and Solutions

**Problem:** Locked out after enabling firewall
```bash
# Need console access (VM console, KVM, cloud serial console)
# If UFW:
sudo ufw disable

# If iptables:
sudo iptables -P INPUT ACCEPT
sudo iptables -F
```

**Problem:** SSH works from one machine but not another
```bash
# Check if you restricted by IP
sudo ufw status numbered
# Ensure your IP/subnet is allowed for port 22
```

**Problem:** Can't reach web server after adding firewall
```bash
# Verify HTTP/HTTPS are allowed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

**Problem:** Rules disappear after reboot
```bash
# iptables: install persistence
sudo apt install iptables-persistent

# UFW: usually persists by default, check
sudo systemctl status ufw
```

**Problem:** Log flooding from port scans
```bash
# Use rate limiting for iptables LOG
iptables -A INPUT -m limit --limit 5/min -j LOG ...
```

## Key Commands Reference

### iptables
```bash
iptables -L -n -v
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -P INPUT DROP
iptables -F
iptables -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables-save > rules.backup
iptables-restore < rules.backup
```

### UFW
```bash
sudo ufw enable
sudo ufw disable
sudo ufw allow 22/tcp
sudo ufw deny 23/tcp
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw status verbose
sudo ufw status numbered
sudo ufw delete 3
sudo ufw reload
sudo ufw logging medium
```

## Additional Resources

### Official Documentation
- [netfilter/iptables](https://netfilter.org/) — Official project
- [UFW Ubuntu Documentation](https://help.ubuntu.com/community/UFW) — UFW guide
- [nftables wiki](https://wiki.nftables.org/) — nftables reference

### Books & Guides
- *"Linux Firewalls"* by Steve Suehring — iptables/nftables
- [Arch Wiki: iptables](https://wiki.archlinux.org/title/iptables) — Comprehensive reference
- [CIS Benchmark](https://www.cisecurity.org/) — Firewall hardening

### Practice
- Set up two VMs: server with firewall, attacker running `nmap`
- Build ruleset allowing only HTTP/HTTPS and SSH from specific IP

## Questions for Review

1. What is the difference between stateless packet filtering and stateful inspection?
2. Explain the roles of the INPUT, OUTPUT, and FORWARD chains.
3. Why must the ESTABLISHED,RELATED rule appear early in the INPUT chain?
4. What is the difference between DROP and REJECT? When might you prefer each?
5. Why should you allow SSH before setting default deny or enabling UFW?
6. How does UFW relate to iptables?
7. What does `iptables-persistent` do, and why is it needed?
8. How would you restrict SSH access to a specific subnet using UFW?
9. What is the purpose of the `--limit` option when using the LOG target?
10. How do firewalls complement SSH hardening for defense in depth?

## Lab Assignment Ideas

1. **Firewall Ruleset Design**: Document a ruleset for a web server (HTTP/HTTPS, SSH). Implement with both iptables and UFW. Compare and contrast.
2. **Restrict SSH by IP**: Configure firewall to allow SSH only from lab subnet. Test from allowed and blocked IPs. Write a short report.
3. **Logging & Analysis**: Enable firewall logging. Trigger a port scan from another VM. Analyze logs and document findings.
4. **Persistence Verification**: Configure firewall, reboot, verify rules persist. Document the process for iptables-persistent and UFW.
5. **Layered Defense Report**: Combine SSH hardening (Lecture 8) with firewall rules. Document the full configuration and explain how each layer contributes.

---

**Instructor Notes:**
- **CLO 4:** Harden security posture with firewall rules — this lecture directly addresses this
- **Lab 9: UFW/Iptables Setup** — align exercises with lab requirements
- **Quiz 1 this week** (Weeks 1-5) — remind students; firewall content will appear in Quiz 2
- **Homework 3 due** — check submission status
- **Connect to Week 8:** Firewalls add perimeter layer; SSH hardening protects the service itself
- **Connect to Week 10:** SELinux adds another layer (MAC) — defense in depth
- **Live demo:** Always allow SSH first; show lockout recovery via console; demonstrate `iptables -L` before/after UFW
- **Common student mistake:** Enabling firewall before allowing SSH — emphasize order of operations repeatedly
