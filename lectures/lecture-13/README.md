# Lecture 13: Vulnerability Scanning & Patching

## Overview

This lecture closes the loop on the course's security hardening thread by teaching students how to systematically find and fix vulnerabilities across Linux systems. Students learn the CVE/CVSS ecosystem, distro-specific patch workflows, local and network scanning tools (Lynis, Trivy, OpenVAS), and how to scale patching across a fleet using Ansible. The workflow from detection through prioritization, testing, deployment, and verification is presented as a repeatable process aligned with industry compliance requirements.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain what a CVE is, what CVSS measures, and how to use severity levels to prioritize remediation
2. Find distro-specific security advisories for Ubuntu/Debian and RHEL/CentOS
3. Apply security updates using `apt` and `dnf`, including CVE-targeted patching
4. Configure automated security updates with `unattended-upgrades` and `dnf-automatic`
5. Run Lynis and interpret its hardening index and warnings
6. Use Trivy to scan container images, local filesystems, and source repositories
7. Explain what OpenVAS/Greenbone scans and the legal constraints on its use
8. Write an Ansible playbook to apply security patches to a fleet of servers
9. Describe rollback strategies at the package level (version pinning) and infrastructure level (snapshots)
10. Verify that a specific CVE has been remediated after patching

## Topics Covered

### Part 1: The Vulnerability Lifecycle

#### 1.1 CVEs and NVD

A **CVE (Common Vulnerability and Exposure)** is a unique identifier for a publicly known security flaw. Format: `CVE-YEAR-SEQUENCE` (e.g., `CVE-2021-44228` = Log4Shell).

- Maintained by [MITRE](https://cve.mitre.org/)
- Enriched with CVSS scores in the [NVD](https://nvd.nist.gov/)
- Distros issue their own advisories linking CVEs to specific package versions

**Lifecycle:**
1. Researcher discovers vulnerability
2. Responsible disclosure to vendor (typically 90-day window)
3. Vendor develops patch
4. CVE ID assigned
5. Coordinated public disclosure
6. Patch released and published in distro advisories

A **zero-day** is a vulnerability that is exploited before the vendor is aware or before a patch exists.

#### 1.2 CVSS Scoring

CVSS v3.1 scores vulnerabilities on a 0–10 scale:

| Score | Severity | SLA |
|-------|----------|-----|
| 9.0–10.0 | Critical | Patch within 24 hours |
| 7.0–8.9 | High | Patch within 7 days |
| 4.0–6.9 | Medium | Patch within 30 days |
| 0.1–3.9 | Low | Next maintenance cycle |

**Key metrics:** Attack Vector (Network is worst), Attack Complexity (Low is worst), Privileges Required (None is worst), User Interaction, Confidentiality/Integrity/Availability impact.

**Contextual adjustment:** A Critical CVE on an isolated internal system is less urgent than a High CVE on an internet-facing service. Always factor in actual exposure.

#### 1.3 CISA Known Exploited Vulnerabilities (KEV)

The CISA KEV catalog lists CVEs with confirmed active exploitation in the wild. Any entry on this list should be treated as Priority 1 regardless of CVSS score. [https://www.cisa.gov/known-exploited-vulnerabilities-catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

#### 1.4 Distro Advisories

```bash
# Ubuntu Security Notices
https://ubuntu.com/security/notices

# Check system status
ubuntu-security-status
apt-get changelog openssh-server | grep CVE

# RHEL Security Advisories
dnf updateinfo list security
dnf updateinfo list --cve CVE-2023-38408

# Debian Security Advisories
https://www.debian.org/security/
debsecan --suite bookworm
```

---

### Part 2: Linux Package Patching

#### 2.1 Debian/Ubuntu Patching

```bash
# Update index
sudo apt update

# List upgradable packages
apt list --upgradable

# Apply all updates
sudo apt upgrade -y

# Apply only security updates
sudo unattended-upgrade --dry-run -d   # Preview
sudo apt-get -s --only-upgrade upgrade

# Clean up
sudo apt autoremove --purge -y
sudo apt clean

# Check for required reboot
cat /var/run/reboot-required
```

#### 2.2 RHEL/CentOS/Fedora Patching

```bash
# Check for updates
sudo dnf check-update

# List security updates only
sudo dnf updateinfo list security

# Apply all security updates
sudo dnf update --security -y

# Apply update for a specific CVE
sudo dnf update --cve CVE-2023-38408

# Check if reboot is needed
sudo needs-restarting -r        # Kernel / init only
sudo needs-restarting           # All services needing restart

# Transaction history
sudo dnf history
sudo dnf history info 42        # Details of transaction #42
```

#### 2.3 Automated Security Updates

**Debian/Ubuntu — unattended-upgrades:**

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

Key options in `/etc/apt/apt.conf.d/50unattended-upgrades`:
- `Allowed-Origins`: restrict to security pocket only
- `AutoFixInterruptedDpkg`: recover from interrupted upgrades
- `Remove-Unused-Dependencies`: auto-remove after upgrades
- `Automatic-Reboot`: dangerous in production — set a maintenance window time instead

**RHEL/CentOS — dnf-automatic:**

```bash
sudo dnf install dnf-automatic
# /etc/dnf/automatic.conf: set upgrade_type = security, apply_updates = yes
sudo systemctl enable --now dnf-automatic.timer
```

#### 2.4 Kernel Updates

Kernel updates always require a reboot to take effect. Live patching options:
- RHEL: `kpatch` (applies in-memory patches for critical CVEs)
- Ubuntu: Canonical Livepatch (requires subscription)

```bash
uname -r                         # Running kernel
dpkg --list | grep linux-image   # Installed kernels (Debian)
rpm -qa kernel                   # Installed kernels (RHEL)
```

---

### Part 3: Vulnerability Scanning Tools

#### 3.1 Lynis

Lynis is an open-source local security auditing tool. It runs on the target host and performs 300+ tests covering:

- Boot and filesystem hardening
- Package management
- Authentication and authorization
- SSH configuration
- Firewall and network settings
- Kernel hardening (sysctl)
- Logging and auditing

```bash
sudo apt install lynis
sudo lynis audit system

# Non-interactive for automation
sudo lynis audit system --quiet --no-colors --logfile /tmp/lynis.log

# Check results
cat /var/log/lynis.log | grep -E "WARNING|SUGGESTION"
```

**Output interpretation:**
- `[OK]` — passes the check
- `[WARNING]` — security concern, prioritize
- `[SUGGESTION]` — improvement opportunity
- **Hardening index:** 0–100; 80+ is a reasonable security target

#### 3.2 Trivy

Trivy is a comprehensive vulnerability and misconfiguration scanner:

```bash
# Image scan
trivy image nginx:1.25 --severity HIGH,CRITICAL

# Filesystem scan
trivy fs /opt/myapp

# Repository scan
trivy repo https://github.com/myorg/myapp

# Secret detection
trivy fs --scanners secret .

# IaC / Dockerfile misconfiguration
trivy config ./infrastructure/

# SBOM generation
trivy image --format cyclonedx myapp:v1.0 -o sbom.json

# CI/CD integration — exit non-zero on findings
trivy image --exit-code 1 --severity CRITICAL myapp:v1.0
```

#### 3.3 OpenVAS / Greenbone Community Edition

OpenVAS is a network vulnerability scanner that checks remote hosts for:
- Open ports and running services
- Version-based CVE matches
- Misconfigurations and weak credentials
- 80,000+ Network Vulnerability Tests (NVTs)

```bash
# Quick start with Docker
docker run -d -p 9392:9392 --name greenbone greenbone/community-edition
# Access: https://localhost:9392 (admin/admin — change immediately)
```

**Legal and ethical constraints:** Only scan systems you own or have explicit written permission to scan. Unauthorized scanning is illegal under computer crime laws in most jurisdictions and may trigger incident response at the target organization.

#### 3.4 debsecan / rpm advisories

```bash
# Debian/Ubuntu
sudo apt install debsecan
debsecan --suite $(lsb_release -cs)
debsecan | grep CVE-2023-38408   # Check specific CVE

# RHEL/CentOS
sudo dnf updateinfo list security
sudo dnf updateinfo info RHSA-2023:1234
```

#### 3.5 Prioritization Framework

```
Priority 1 (< 24 hours):
  CVSS ≥ 9.0 AND Network Attack Vector AND No Auth Required
  OR on CISA KEV catalog

Priority 2 (< 7 days):
  CVSS 7.0–8.9 OR Known exploit available

Priority 3 (< 30 days):
  CVSS 4.0–6.9 AND No known exploit

Priority 4 (Maintenance window):
  CVSS < 4.0 OR Physical access required
```

---

### Part 4: Patch Management at Scale

#### 4.1 Ansible Fleet Patching

```yaml
# patch-servers.yml
- name: Apply security patches
  hosts: all
  become: yes
  serial: 2          # Rolling update — 2 servers at a time

  tasks:
    - name: Update cache (Debian)
      apt:
        update_cache: yes
      when: ansible_os_family == "Debian"

    - name: Apply security updates (Debian)
      apt:
        upgrade: yes
        only_upgrade: yes
      when: ansible_os_family == "Debian"

    - name: Apply security updates (RHEL)
      dnf:
        name: "*"
        state: latest
        security: yes
      when: ansible_os_family == "RedHat"

    - name: Check reboot required
      stat:
        path: /var/run/reboot-required
      register: reboot_req

    - name: Reboot if kernel updated
      reboot:
        reboot_timeout: 300
      when: reboot_req.stat.exists
```

```bash
# Dry run first
ansible-playbook patch-servers.yml --check --diff

# Apply
ansible-playbook patch-servers.yml -i inventory.ini
```

#### 4.2 Rollback Strategies

**Package-level rollback:**

```bash
# Debian: pin to a previous version
sudo apt install nginx=1.24.0-1
sudo apt-mark hold nginx

# RHEL: downgrade
sudo dnf downgrade nginx
sudo dnf versionlock add nginx
```

**Infrastructure-level rollback (recommended):**

- Take a VM/cloud snapshot before every patch cycle
- LVM snapshot before major updates: `lvcreate -L 5G -s -n root_snap /dev/vg0/root`
- Cloud: AMI snapshot (AWS), Managed Disk snapshot (Azure), VM snapshot (GCP)
- Restore: revert snapshot in hypervisor/cloud console; fast and complete

#### 4.3 CIS Benchmark & OpenSCAP

```bash
sudo apt install scap-security-guide openscap-scanner

# Audit against CIS Level 1
sudo oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_cis_level1_server \
  --report /tmp/cis-report.html \
  /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml

# View HTML report in browser
```

**Never run `--remediate` in production without testing in staging first.** It may disable services, change SSH configuration, or alter firewall rules.

#### 4.4 Verification

```bash
# Check installed version matches advisory's fixed version
dpkg -l openssh-server   # Compare with USN fixed version

# CVE gone from debsecan output
debsecan | grep CVE-2023-38408   # Should return nothing

# RHEL: confirm advisory applied
sudo dnf updateinfo info RHSA-2023:1234

# Audit log: when was the package updated?
zcat /var/log/dpkg.log*.gz | grep openssh   # Debian
sudo dnf history                              # RHEL
```

#### 4.5 Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| MTTD | Mean Time to Detect | < 24 hours |
| MTTR (Critical) | Mean Time to Remediate Critical CVEs | < 24 hours |
| MTTR (High) | Mean Time to Remediate High CVEs | < 7 days |
| Patch Coverage | % systems with Critical/High patches | > 95% |
| Lynis Score | Hardening index | > 80 |
| Open Criticals | Unpatched CVSS ≥ 9.0 | 0 |

---

## Key Commands Reference

```bash
# Debian/Ubuntu
apt update && apt upgrade -y
apt list --upgradable
unattended-upgrade --dry-run -d
debsecan --suite $(lsb_release -cs)
ubuntu-security-status

# RHEL/CentOS
dnf check-update
dnf update --security -y
dnf update --cve CVE-YYYY-NNNNN
dnf updateinfo list security
needs-restarting -r
dnf history

# Scanners
sudo lynis audit system
trivy image myapp:v1.0 --severity HIGH,CRITICAL
trivy fs /opt/myapp
trivy config Dockerfile

# OpenSCAP
oscap xccdf eval --profile PROFILE --report report.html ds-file.xml

# Ansible
ansible-playbook patch.yml --check   # Dry run
ansible-playbook patch.yml -i hosts  # Apply

# Kernel
uname -r
cat /var/run/reboot-required
needs-restarting -r
```

---

## Practical Exercises

### Exercise 1: Lynis System Audit
1. Install and run `sudo lynis audit system`.
2. Record the hardening index.
3. Find the top 3 warnings (search for `[WARNING]` in the output).
4. Resolve one warning (e.g., set `PermitRootLogin no` in SSH config, or install `fail2ban`).
5. Re-run Lynis and confirm the warning is resolved and the score improved.

### Exercise 2: CVE Investigation and Patching
1. Run `debsecan` (Ubuntu) or `sudo dnf updateinfo list security` (RHEL).
2. Find the highest-CVSS CVE in the output.
3. Look it up on [nvd.nist.gov](https://nvd.nist.gov/).
4. Apply the relevant package update: `sudo apt install <pkg>` or `sudo dnf update --cve <CVE-ID>`.
5. Re-run the check and confirm the CVE is no longer listed.

### Exercise 3: Container Image Scanning
1. Pull `python:3.9`: `docker pull python:3.9`
2. Scan: `trivy image --severity CRITICAL,HIGH python:3.9`
3. Count Critical and High CVEs.
4. Scan `python:3.11-slim` and compare.
5. Write a one-paragraph justification for which base image to use and why.

### Exercise 4: Ansible Patching Playbook
1. Write a playbook that updates package cache, applies security updates, and reboots if needed.
2. Test with `--check` flag first.
3. Run against `localhost` with `--connection=local`.
4. Verify the changes with `sudo dnf history` or `zcat /var/log/dpkg.log.gz`.

### Exercise 5: Automated Updates
1. Install `unattended-upgrades` (Ubuntu) or `dnf-automatic` (RHEL).
2. Configure to apply security updates only.
3. Perform a dry run to verify the configuration is correct.
4. Confirm the timer/cron is active.

---

## Troubleshooting Guide

**debsecan shows CVEs after patching:**
```bash
# The package may need the newer version from backports or a specific PPA
apt-cache policy <package>   # Check available versions
# If distro hasn't backported the fix, check for workarounds in the advisory
```

**Lynis score didn't improve after fixing a warning:**
```bash
# Re-read the exact Lynis test description
sudo lynis show details AUTH-9308   # Show full details for a test ID
# Some warnings require a full service restart or reboot
```

**Ansible patching failed mid-flight:**
```bash
# Check which hosts succeeded vs failed
ansible-playbook patch.yml -i hosts --limit failed_hosts
# Investigate failed host
ssh failedhost 'sudo dnf history | head -5'
```

**`needs-restarting` shows services needing restart:**
```bash
# List services that need restart (not full reboot)
sudo needs-restarting
# Restart affected services
sudo systemctl restart <service>
```

---

## Questions for Review

1. What is a CVE and what information does it contain?
2. What does a CVSS score of 9.5 with Attack Vector: Network, Privileges Required: None mean in practical terms?
3. What is the difference between `apt upgrade` and `apt full-upgrade`?
4. How does `dnf update --cve CVE-2023-38408` differ from `dnf update --security`?
5. What does Lynis's hardening index measure, and what score should you target?
6. Name three types of assets Trivy can scan beyond Docker images.
7. Why must you have explicit permission before running OpenVAS against a target?
8. What is the `serial` keyword in an Ansible playbook and why does it matter for patching?
9. What is the safest rollback strategy for a production server and why?
10. After patching a CVE, how do you verify it has been remediated?

---

**Instructor Notes:**
- **CLO 4:** Implement security hardening — Lynis and OpenSCAP directly address this
- **CLO 5:** Analyze audit trails — `dnf history` and dpkg logs are the patch audit trail
- **Lab 13: Scanning & Patching** — focus on Exercises 1 (Lynis) and 2 (CVE patching); keep Exercise 4 as stretch
- **Live demo:** Run `lynis audit system` live and walk through fixing one warning in real time
- **Live demo:** Show `debsecan` output, look up one CVE on NVD, apply the patch, confirm CVE disappears
- **Ethics discussion:** Walk through the legal implications of unauthorized scanning — use real examples from news
- **Connect to Week 12:** Trivy was introduced for container scanning; here it extends to filesystems and repos
- **Connect to Week 11:** `auditd` and `dnf history` / dpkg logs are the audit trail for patching — link the concepts
- **Common student mistake:** Running `oscap --remediate` on a live system without reading the profile first — it can break SSH config
- **Assignment connection:** Homework 4 (vuln_scanner.sh) implements a basic version of what Lynis does — reference it here
