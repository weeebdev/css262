# Lecture 8: SSH Hardening & Remote Access

## Overview

This lecture marks the first security-focused module of the course, introducing SSH (Secure Shell) as the primary mechanism for secure remote access to Linux systems. Students learn the protocol fundamentals, key-based authentication, server hardening via `sshd_config`, and advanced techniques including tunneling and Fail2Ban. By the end, students can replace insecure remote access methods with a defense-in-depth SSH configuration—essential for any cybersecurity professional managing Linux infrastructure.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain how SSH works: key exchange (Diffie-Hellman), symmetric encryption, and authentication
2. Use SSH, SCP, and SFTP for remote access and secure file transfer
3. Generate Ed25519 key pairs and deploy public keys with correct permissions
4. Configure `~/.ssh/config` for connection aliases and ProxyJump
5. Harden `sshd_config` with security best practices (disable root, disable passwords, restrict users)
6. Change the default SSH port and apply rate-limiting settings
7. Set up Fail2Ban for automated brute-force protection
8. Use SSH tunneling (local, remote, and dynamic SOCKS proxy)
9. Test configuration changes safely without locking yourself out
10. Run SSH audit tools (`ssh-audit`, `lynis`) and interpret findings

## Topics Covered

### Part 1: SSH Fundamentals

#### 1.1 What is SSH?

- **Secure Shell (SSH)**: Cryptographic network protocol (RFC 4253) for secure remote access
- **Default port**: 22/TCP
- **Replaces**: Telnet, rlogin, rsh (all unencrypted and insecure)
- **Provides**: Remote shell, file transfer (SCP/SFTP), port forwarding, X11 forwarding

**Why this matters:** SSH is the #1 target for brute-force attacks on internet-facing Linux servers. Shodan indexes millions of exposed SSH services.

#### 1.2 Client/Server Model

| Component | Role | Location |
|-----------|------|----------|
| **sshd** | Server daemon, listens on port 22 | `/etc/ssh/sshd_config` |
| **ssh** | Client, initiates connections | `~/.ssh/config` |

**Connection flow:**
1. TCP handshake on port 22
2. Protocol version exchange
3. **Key exchange** (Diffie-Hellman) — shared session key derived without transmission
4. Server authentication (host key in `/etc/ssh/ssh_host_*`)
5. **User authentication** (password or key)
6. Encrypted session established

**Host keys:** Prove server identity. First-connection prompt = TOFU (Trust On First Use). Verify fingerprint out-of-band before accepting.

#### 1.3 How SSH Encryption Works

| Layer | Purpose | Algorithms |
|-------|---------|------------|
| **Transport** | Encryption + integrity | AES-256-GCM, ChaCha20 |
| **Authentication** | Verify user identity | Public key, password, GSSAPI |
| **Connection** | Multiplex channels | Sessions, forwarded ports |

**Key exchange (simplified):** Client and server agree on algorithms; Diffie-Hellman generates shared session key; neither side transmits the key—it is derived independently. Session key encrypts all subsequent traffic.

#### 1.4 Basic Usage

```bash
# Basic connection
ssh user@192.168.1.100

# Custom port
ssh -p 2222 user@host.example.com

# Verbose (debugging)
ssh -v user@host

# Run command remotely
ssh user@host 'uptime && df -h'
```

**First connection — host key verification:**
```
The authenticity of host '192.168.1.100' can't be established.
ED25519 key fingerprint is SHA256:xR4kL9m2pQw...
Are you sure you want to continue connecting (yes/no)?
```

**Do:** Verify fingerprint out-of-band before accepting. **Don't:** Blindly type "yes" — MITM attacks exploit this.

#### 1.5 SCP — Secure Copy

```bash
# Upload file
scp file.txt user@host:/tmp/

# Download file
scp user@host:/var/log/syslog ./

# Recursive directory copy
scp -r ./project user@host:~/

# Custom port (note: -P for scp, -p for ssh)
scp -P 2222 file.txt user@host:/tmp/
```

#### 1.6 SFTP — Interactive File Transfer

```bash
sftp user@host
sftp> ls
sftp> cd /var/log
sftp> get syslog
sftp> put localfile.txt
sftp> exit
```

SFTP supports resume and is preferred over SCP for large transfers.

---

### Part 2: Key-Based Authentication

#### 2.1 Why Keys Over Passwords

| Passwords | Keys |
|-----------|------|
| Brute-force vulnerable (hydra, medusa) | 2048+ bit — infeasible to brute-force |
| Credential stuffing from leaks | No secret transmitted over network |
| Keyloggers, shoulder surfing | Passphrase adds 2nd factor |
| Difficult to audit & rotate | Per-device keys enable fine-grained revocation |
| Automation requires storing secrets | Easy automation (CI/CD, scripts) |

**Real-world stat:** SSH brute-force attempts average 10,000+/day on exposed servers. Password auth = open invitation.

#### 2.2 Key Types Comparison

| Type | Key Size | Speed | Security | Recommendation |
|------|----------|-------|----------|----------------|
| **RSA** | 2048–4096 bit | Slower | Good (≥3072) | Legacy compatibility only |
| **DSA** | 1024 bit | Fast | ❌ Deprecated | **Never use** |
| **ECDSA** | 256/384/521 bit | Fast | Good | Avoid (NIST curve concerns) |
| **Ed25519** | 256 bit | Fastest | Excellent | ✅ **Recommended** |

**Use Ed25519:** Shorter keys, faster operations, no known weaknesses, resistant to side-channel attacks. Use RSA-4096 only for legacy systems that don't support Ed25519.

#### 2.3 Generating Keys

```bash
ssh-keygen -t ed25519 -C "user@host"
```

```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/user/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/user/.ssh/id_ed25519
Your public key has been saved in /home/user/.ssh/id_ed25519.pub
```

| File | Contents | Share? |
|------|----------|--------|
| `~/.ssh/id_ed25519` | Private key | ❌ **NEVER** |
| `~/.ssh/id_ed25519.pub` | Public key | ✅ Yes — deploy to servers |

**Always set a passphrase!** An unprotected private key = anyone with file access can impersonate you.

#### 2.4 Deploying Keys

**Method 1: ssh-copy-id (easy)**
```bash
ssh-copy-id user@192.168.1.100
```

**Method 2: Manual**
```bash
cat ~/.ssh/id_ed25519.pub | ssh user@host \
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

#### 2.5 Critical Permissions

```bash
# On remote server:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# On local machine:
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

**Wrong permissions = SSH silently refuses key auth!** This is the #1 debugging issue for students. `StrictModes yes` in sshd_config enforces these checks.

#### 2.6 ssh-agent

```bash
eval $(ssh-agent -s)           # Start the agent
ssh-add ~/.ssh/id_ed25519     # Add key (enter passphrase once)
ssh-add -l                    # List loaded keys
ssh user@host                 # No passphrase prompt!
```

**Agent forwarding** (`ssh -A`): Use with caution — compromised remote host can use your keys. Prefer `ProxyJump` instead.

---

### Part 3: Hardening sshd_config

#### 3.1 File Location

- **Config:** `/etc/ssh/sshd_config`
- **Format:** `Keyword Value` (comments with `#`)

#### 3.2 Critical Settings

| Setting | Recommended | Why |
|---------|-------------|-----|
| `PermitRootLogin` | `no` | Never allow root SSH — force sudo, audit trail |
| `PasswordAuthentication` | `no` | Force key-based auth, eliminate brute-force |
| `PubkeyAuthentication` | `yes` | Enable key auth |
| `Port` | `2222` | Non-default — reduces automated scan noise |
| `AllowUsers` | `admin deploy` | Explicit allowlist — minimize attack surface |
| `AllowGroups` | `sshusers` | Restrict by group |
| `MaxAuthTries` | `3` | Rate-limit failed attempts |
| `LoginGraceTime` | `30` | Drop slow/hanging connections |
| `X11Forwarding` | `no` | Disable unless needed |
| `PermitEmptyPasswords` | `no` | Prevent misconfigured accounts |
| `ClientAliveInterval` | `300` | Keepalive every 5 min |
| `ClientAliveCountMax` | `2` | Disconnect after 2 missed keepalives |
| `Protocol` | `2` | SSHv1 is broken — never use |

**Additional options:**
```
Banner /etc/ssh/banner.txt    # Legal warning — "Unauthorized access prohibited"
MaxSessions 3                 # Limit multiplexed sessions
AllowTcpForwarding no         # Prevent tunnel abuse (if not needed)
```

**Order of operations:** 1) Generate keys → 2) Deploy to server → 3) Test key login → 4) **THEN** disable passwords. Never reverse this!

#### 3.3 Testing & Applying

```bash
# 1. Backup current config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 2. Edit config
sudo nano /etc/ssh/sshd_config

# 3. Validate syntax
sudo sshd -t
# No output = config is valid

# 4. Restart the service
sudo systemctl restart sshd

# 5. Test in a NEW terminal (keep current session open!)
ssh -p 2222 user@host
```

**Golden rule:** Always keep a second SSH session open while testing. Lock yourself out = need physical/console access to recover.

---

### Part 4: Advanced SSH

#### 4.1 SSH Client Config — ~/.ssh/config

```
Host myserver
    HostName 192.168.1.10
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host production
    HostName prod.example.com
    User deploy
    IdentityFile ~/.ssh/deploy_key
    ForwardAgent no

Host internal
    HostName 10.0.1.50
    User admin
    ProxyJump jump
```

**Usage:**
```bash
ssh myserver    # Expands to: ssh -p 2222 -i ~/.ssh/id_ed25519 admin@192.168.1.10
ssh internal    # Automatically jumps through bastion
```

#### 4.2 Port Forwarding

**Local forward** — access remote service locally:
```bash
ssh -L 8080:localhost:80 user@server
# localhost:8080 → server:80
```

**Remote forward** — expose local service to remote:
```bash
ssh -R 9090:localhost:3000 user@server
# server:9090 → your-machine:3000
```

**Dynamic SOCKS proxy** — route all traffic through tunnel:
```bash
ssh -D 1080 user@server
# Poor man's VPN — configure browser/app to use SOCKS5 localhost:1080
```

#### 4.3 Fail2Ban

**Install and enable:**
```bash
sudo apt install fail2ban
sudo systemctl enable --now fail2ban
```

**SSH jail config** — `/etc/fail2ban/jail.local`:
```ini
[sshd]
enabled  = true
port     = 2222
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 3600
findtime = 600
```

**Useful commands:**
```bash
sudo fail2ban-client status sshd
sudo fail2ban-client unban <IP>
```

#### 4.4 SSH Audit Tools

```bash
# ssh-audit — check server config
pip install ssh-audit
ssh-audit 192.168.1.100
```

Reports weak algorithms, ciphers, key exchange methods; flags vulnerable configurations. Run regularly against your servers.

**lynis:** System-wide audit including SSH:
```bash
sudo lynis audit system
```

#### 4.5 Two-Factor Authentication (2FA)

```bash
sudo apt install libpam-google-authenticator
google-authenticator
```

Adds TOTP (time-based one-time password) — works with Google Authenticator, Authy. Requires PAM configuration. SSH key + OTP = very strong auth.

**Defense in depth:** Key-based auth + Fail2Ban + 2FA + non-default port = multiple layers an attacker must bypass.

---

### Security Emphasis: Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|------------|
| Brute force | Keys + Fail2Ban |
| Root compromise | `PermitRootLogin no` |
| Password spray | `PasswordAuthentication no` |
| Port scanning | Non-default port |
| MITM | Host key verification |
| Idle session hijack | ClientAlive timeouts |
| Key theft | Passphrase + ssh-agent |

**Real-world:** SSH misconfiguration has been a factor in numerous breaches. Defense in depth is essential.

## Practical Exercises

### Exercise 1: Key Generation & Deployment

1. Generate an Ed25519 key pair with a passphrase: `ssh-keygen -t ed25519 -C "student@css262-lab"`
2. Deploy to your lab VM using `ssh-copy-id user@host`
3. Verify key-based login works (no password prompt)
4. Check permissions on `~/.ssh` and `~/.ssh/authorized_keys` on the server

### Exercise 2: Harden sshd_config

1. Backup `/etc/ssh/sshd_config`
2. Apply: `PermitRootLogin no`, `PasswordAuthentication no`, `Port 2222`, `MaxAuthTries 3`, `AllowUsers` for your user
3. Run `sudo sshd -t` to validate
4. Restart sshd — **keep existing session open**
5. Test from a new terminal with `ssh -p 2222 user@host` before closing the first session

### Exercise 3: Fail2Ban Setup

1. Install Fail2Ban and enable the service
2. Create `/etc/fail2ban/jail.local` with SSH jail: `maxretry=3`, `bantime=600`, `port=2222` (if you changed it)
3. Restart Fail2Ban
4. From another machine/terminal, trigger 3+ failed login attempts
5. Verify ban with `fail2ban-client status sshd`
6. Test that the banned IP cannot connect
7. Unban the IP when done

### Exercise 4: SSH Config & Tunneling

1. Create `~/.ssh/config` entries for your lab VMs (Host, HostName, User, Port, IdentityFile)
2. Connect using the alias: `ssh lab-server`
3. Set up a local port forward: `ssh -L 8080:localhost:80 user@server` (if server has a web service)
4. Verify the tunnel: `curl http://localhost:8080` from your machine
5. Use `ss -tlnp` to confirm the local listener

### Exercise 5: SSH Audit

1. Install `ssh-audit`: `pip install ssh-audit`
2. Run `ssh-audit` against your lab server
3. Document any warnings or recommendations
4. Apply at least one recommended fix and re-run the audit

## Troubleshooting Guide

### Common Issues and Solutions

**Problem:** "Permission denied (publickey)" — key auth fails
```bash
# Check permissions on server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify key is in authorized_keys
cat ~/.ssh/authorized_keys

# Check sshd_config
grep -E "PubkeyAuthentication|AuthorizedKeysFile" /etc/ssh/sshd_config

# Debug with verbose client
ssh -vvv user@host
```

**Problem:** Locked out after changing sshd_config
```bash
# Need physical/console access (VM console, KVM, cloud serial console)
# Restore backup or fix typo:
sudo cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config
sudo systemctl restart sshd
```

**Problem:** "Host key verification failed"
```bash
# Key changed (reinstall, different server). Remove old key:
ssh-keygen -R hostname
# Or edit ~/.ssh/known_hosts manually
```

**Problem:** ssh-copy-id fails with "Permission denied"
```bash
# Ensure password auth is still enabled on server (temporarily)
# Or use manual method:
cat ~/.ssh/id_ed25519.pub | ssh user@host 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

**Problem:** Fail2Ban not banning
```bash
# Check jail is enabled
sudo fail2ban-client status

# Verify log path (Debian: /var/log/auth.log, RHEL: /var/log/secure)
# Check filter matches
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf
```

## Key Commands Reference

### Connection & File Transfer
```bash
ssh user@host
ssh -p 2222 user@host
ssh -v user@host
scp file user@host:/path
scp -r dir user@host:/path
scp -P 2222 file user@host:/path
sftp user@host
```

### Key Management
```bash
ssh-keygen -t ed25519 -C "comment"
ssh-copy-id user@host
ssh-add ~/.ssh/id_ed25519
ssh-add -l
eval $(ssh-agent -s)
```

### Server Configuration
```bash
sudo nano /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl restart sshd
```

### Tunneling
```bash
ssh -L 8080:localhost:80 user@host
ssh -R 9090:localhost:3000 user@host
ssh -D 1080 user@host
```

### Fail2Ban
```bash
sudo fail2ban-client status sshd
sudo fail2ban-client unban <IP>
```

### Audit
```bash
ssh-audit host
sudo lynis audit system
```

## Additional Resources

### Official Documentation
- [OpenSSH Manual Pages](https://www.openssh.com/manual.html) — Official sshd_config reference
- [ssh-audit on GitHub](https://github.com/jtesta/ssh-audit) — SSH server & client auditing
- [Fail2Ban Documentation](https://www.fail2ban.org/) — Brute-force protection

### Books & Guides
- *"SSH Mastery"* by Michael W. Lucas — Comprehensive SSH reference
- [Mozilla SSH Guidelines](https://infosec.mozilla.org/guidelines/openssh) — Production hardening
- [CIS Benchmark for Linux](https://www.cisecurity.org/benchmark/distribution_independent_linux) — SSH section

### Practice
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/) — SSH-based wargame
- Set up two VMs: harden one, attempt brute-force on the other with `hydra` (in lab only)

## Questions for Review

1. What is the difference between SSH and Telnet? Why is SSH preferred?
2. Explain the role of Diffie-Hellman in the SSH connection process.
3. Why is Ed25519 recommended over RSA for new SSH keys?
4. What permissions are required for `~/.ssh` and `~/.ssh/authorized_keys`? What happens if they are wrong?
5. Why should you disable `PasswordAuthentication` only after deploying keys?
6. What does `sshd -t` do, and why run it before restarting sshd?
7. Explain the difference between local port forwarding (`-L`) and remote port forwarding (`-R`).
8. How does Fail2Ban protect against SSH brute-force attacks?
9. What is the purpose of `ProxyJump` in `~/.ssh/config`?
10. Why keep an existing SSH session open when testing sshd_config changes?

## Lab Assignment Ideas

1. **SSH Hardening Checklist**: Apply all recommended sshd_config settings to a lab VM; document before/after with `ssh-audit` output
2. **Key Deployment Script**: Bash script that reads a list of users/hosts and deploys a public key via ssh-copy-id, with error handling
3. **Fail2Ban Tuning**: Configure Fail2Ban with custom `bantime` and `findtime`; test with intentional failed logins; write a short report on effectiveness
4. **Bastion Jump Setup**: Configure a two-tier setup (jump host + internal server) using `ProxyJump`; demonstrate access to internal host via single `ssh internal` command
5. **SSH Audit Report**: Run ssh-audit and lynis against a lab server; produce a report with findings, risk level, and remediation steps for each issue

---

**Instructor Notes:**
- **CLO 4:** Harden security posture with SSH keys and disabling services — this lecture directly addresses this
- **Lab 8: SSH Config** — align exercises with lab requirements; ensure students complete key deployment before disabling passwords
- **Quiz 1 this week** covers Weeks 1–7; remind students to review prior material
- **Security block begins:** Weeks 8–11 focus on hardening; frame this as the first of four security-focused lectures
- **Connect to Week 9:** Firewalls will complement SSH hardening — mention that firewall rules will further restrict SSH access
- **Mid-semester project:** SSH hardening will be an integrated component; students should document their sshd_config and key setup
- **Live demo:** Show the lockout risk — keep a second session open when changing sshd_config; demonstrate `sshd -t` validation
- **Common student mistake:** Wrong permissions on authorized_keys — emphasize 600 and 700 repeatedly
