# Lecture 7: Package Management & Repositories

## Overview

This lecture covers Linux package management fundamentals across the two major ecosystems—Debian/Ubuntu (apt/dpkg) and Fedora/RHEL (dnf/rpm). Students learn how to install, update, remove, and search for packages; manage repositories and GPG keys; and build software from source when no package is available. By the end, students can configure package repositories for reliable connectivity, install security tools, and handle dependency resolution—essential skills for system administration and cybersecurity.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain why package managers exist (dependency resolution, version management, security updates, rollback)
2. Distinguish between Debian (.deb) and Red Hat (.rpm) ecosystems
3. Use APT and dpkg to install, update, remove, and query packages on Debian/Ubuntu
4. Use DNF and rpm to perform the same operations on Fedora/RHEL
5. Configure and manage package repositories (sources.list, sources.list.d, yum.repos.d)
6. Add third-party repositories (PPA, COPR) and verify GPG keys
7. Pin or hold packages to prevent unwanted upgrades
8. Build software from source using configure/make/install and create packages with checkinstall
9. Resolve common package management errors (broken dependencies, held packages, missing repos)
10. Prepare for installing security packages in Weeks 8–9 (openssh, fail2ban, ufw)

## Topics Covered

### Part 1: Package Management Fundamentals

#### 1.1 Why Package Managers?

- **Dependency resolution**: Automatically install required libraries and tools
- **Version management**: Track installed versions, avoid conflicts
- **Security updates**: Apply patches via `apt upgrade` / `dnf update`
- **Easy rollback**: Remove or downgrade packages cleanly
- **Reproducibility**: Same package versions across systems

#### 1.2 Two Ecosystems

| Ecosystem | Low-Level | High-Level | Package Format |
|-----------|-----------|------------|----------------|
| Debian/Ubuntu | dpkg | apt, apt-get | .deb |
| Fedora/RHEL | rpm | dnf, yum | .rpm |

**Debian family:** Ubuntu, Debian, Linux Mint, Kali, Pop!_OS  
**Red Hat family:** Fedora, RHEL, CentOS, Rocky, AlmaLinux

#### 1.3 Package Metadata

- **Name**: e.g., `openssh-server` (Debian) or `openssh-server` (RHEL)
- **Version**: e.g., 1:8.9p1-3ubuntu0.6
- **Dependencies**: `Depends`, `Pre-Depends` (Debian); `Requires` (RPM)
- **Conflicts**: Packages that cannot coexist
- **Provides**: Virtual packages or alternative implementations

#### 1.4 Package Lifecycle

```
search → install → configure → update → remove
```

1. **Search**: Find packages by name or keyword
2. **Install**: Download and install with dependencies
3. **Configure**: Post-install scripts (e.g., user creation, config generation)
4. **Update**: Refresh package lists; upgrade installed packages
5. **Remove**: Uninstall; optionally purge config files

### Part 2: APT Deep Dive (Debian/Ubuntu)

#### 2.1 Updating Package Lists

```bash
# Refresh package index from repositories
sudo apt update

# Upgrade installed packages (safe, no new deps)
sudo apt upgrade

# Full upgrade (may install/remove packages to satisfy deps)
sudo apt full-upgrade
```

**Always run `apt update` before `apt upgrade`**—otherwise you get stale package lists.

#### 2.2 Install, Remove, Purge

```bash
# Install package
sudo apt install openssh-server

# Install multiple packages
sudo apt install nginx fail2ban ufw

# Remove package (keeps config files)
sudo apt remove package-name

# Remove package and config files
sudo apt purge package-name

# Remove orphaned dependencies
sudo apt autoremove
```

#### 2.3 Search and Query

```bash
# Search by keyword
apt search openssh

# Show package details
apt show openssh-server

# List installed packages
apt list --installed

# List all available (including upgradable)
apt list --upgradable
```

#### 2.4 dpkg (Low-Level)

```bash
# Install .deb file directly (no dependency resolution)
sudo dpkg -i package.deb

# List installed packages
dpkg -l
dpkg -l | grep openssh

# Find which package owns a file
dpkg -S /usr/bin/ssh

# Reconfigure broken/unpacked packages
sudo dpkg --configure -a

# Fix broken dependencies
sudo apt --fix-broken install
```

#### 2.5 Pinning Packages

```bash
# Hold package (prevent upgrades)
sudo apt-mark hold package-name

# Unhold
sudo apt-mark unhold package-name

# Show held packages
apt-mark showhold
```

**Pinning via priorities:** `/etc/apt/preferences.d/` for pin priorities

```text
# /etc/apt/preferences.d/pin-package
Package: package-name
Pin: version 1.2.3*
Pin-Priority: 1001
```

### Part 3: DNF Deep Dive (Fedora/RHEL)

#### 3.1 Install, Update, Remove

```bash
# Install package
sudo dnf install openssh-server

# Update all packages
sudo dnf update

# Remove package
sudo dnf remove package-name

# Search packages
dnf search openssh
```

#### 3.2 Query and Info

```bash
# Show package details
dnf info openssh-server

# List installed packages
dnf list installed

# Find which package provides a file or command
dnf provides /usr/bin/ssh
dnf provides "*/bin/ssh"
```

#### 3.3 rpm (Low-Level)

```bash
# Install .rpm file
sudo rpm -ivh package.rpm

# List all installed packages
rpm -qa
rpm -qa | grep openssh

# Find which package owns a file
rpm -qf /usr/bin/ssh

# List files in a package
rpm -ql openssh-server
```

#### 3.4 DNF Groups

```bash
# List available groups
dnf group list

# Install group (e.g., development tools)
sudo dnf group install "Development Tools"

# List packages in a group
dnf group info "Development Tools"
```

#### 3.5 DNF Modules (RHEL 8+)

Modules provide alternative versions (e.g., Python 3.9 vs 3.11).

```bash
# List available modules
dnf module list

# Enable a module stream
sudo dnf module enable python39

# Install from module
sudo dnf install @python39
```

### Part 4: Repository Management

#### 4.1 Repository Structure

| Distro | Main Config | Additional Repos |
|--------|-------------|------------------|
| Debian/Ubuntu | `/etc/apt/sources.list` | `/etc/apt/sources.list.d/*.list` |
| Fedora/RHEL | — | `/etc/yum.repos.d/*.repo` |

#### 4.2 sources.list Format (Debian/Ubuntu)

```text
# Format: deb [options] uri suite [components]
deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu jammy-security main restricted universe multiverse
```

**Components:** `main` (free), `restricted` (proprietary), `universe`, `multiverse`

**Signed-by (modern):**
```text
deb [signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] http://archive.ubuntu.com/ubuntu jammy main
```

#### 4.3 Adding PPAs (Ubuntu)

```bash
# Install add-apt-repository if missing
sudo apt install software-properties-common

# Add PPA
sudo add-apt-repository ppa:deadsnakes/ppa

# Update and install
sudo apt update
sudo apt install python3.12
```

#### 4.4 COPR (Fedora)

```bash
# Enable COPR repo
sudo dnf copr enable user/project

# Install from COPR
sudo dnf install package-name
```

#### 4.5 GPG Key Verification

**Legacy (deprecated):**
```bash
# Add key (deprecated)
sudo apt-key add keyfile.asc
```

**Modern (signed-by):**
```bash
# Download and add key to keyring
wget -O- https://example.com/key.asc | gpg --dearmor | sudo tee /usr/share/keyrings/example-archive-keyring.gpg > /dev/null

# Use in sources.list
deb [signed-by=/usr/share/keyrings/example-archive-keyring.gpg] https://repo.example.com stable main
```

#### 4.6 Security Risks of Third-Party Repos

- **Supply chain**: Untrusted repos can inject malicious packages
- **Key compromise**: Stolen GPG keys enable signed malware
- **Best practices**: Prefer official repos; verify PPA/COPR maintainers; use `signed-by` for explicit key binding

### Part 5: Building from Source

#### 5.1 When to Build from Source

- No package available for your distro
- Need custom compile flags or patches
- Need latest version not yet packaged

#### 5.2 Prerequisites

```bash
# Debian/Ubuntu
sudo apt install build-essential

# Fedora/RHEL
sudo dnf group install "Development Tools"
```

#### 5.3 Classic Build Flow

```bash
# Extract source
tar -xzf package-1.0.tar.gz
cd package-1.0

# Configure (optional prefix)
./configure --prefix=/usr/local

# Build
make

# Install (requires root for system dirs)
sudo make install
```

#### 5.4 Build Dependencies

```bash
# Debian: install deps for building a package
sudo apt build-dep package-name

# Fedora: same
sudo dnf builddep package-name
```

#### 5.5 checkinstall (Create .deb/.rpm from Source)

```bash
# After make, instead of make install:
sudo checkinstall

# Creates .deb (Debian) or .rpm (Fedora) and installs it
# Package can then be removed via apt/dnf
```

## Practical Exercises

### Exercise 1: APT Basics (Debian/Ubuntu)

1. Run `apt update` and `apt upgrade`
2. Search for `fail2ban` with `apt search`
3. Use `apt show fail2ban` to inspect dependencies
4. Install a small package (e.g., `htop`), then remove it with `apt remove` and `apt autoremove`

### Exercise 2: DNF Basics (Fedora/RHEL)

1. Run `dnf update`
2. Search for `fail2ban` with `dnf search`
3. Use `dnf info` and `dnf provides` to explore a package
4. Install the "Development Tools" group with `dnf group install`

### Exercise 3: Repository Management

1. List entries in `/etc/apt/sources.list` (or `/etc/yum.repos.d/`)
2. Add a PPA (Ubuntu) or COPR (Fedora) and install one package from it
3. Document the `signed-by` or GPG key used for that repo

### Exercise 4: Package Pinning

1. Use `apt-mark hold` (or `dnf versionlock` on Fedora) on a non-critical package
2. Run `apt upgrade` and verify the package is not upgraded
3. Unhold and upgrade again

### Exercise 5: Build from Source

1. Download a small source tarball (e.g., `htop` or `nano` from GNU)
2. Install build dependencies with `apt build-dep` or `dnf builddep`
3. Run `./configure`, `make`, and `sudo checkinstall` to create a package
4. Verify the package appears in `dpkg -l` or `rpm -qa`

## Troubleshooting Guide

### Common Issues and Solutions

**Problem:** `apt update` fails with "Could not get lock"
```bash
# Another apt process is running; wait or kill it
sudo killall apt
# Or remove lock if process died
sudo rm /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock
sudo dpkg --configure -a
```

**Problem:** Broken dependencies after interrupted install
```bash
# Fix broken packages
sudo apt --fix-broken install
# Or
sudo dpkg --configure -a
```

**Problem:** Package held back, won't upgrade
```bash
# Check held packages
apt-mark showhold

# Unhold if intentional
sudo apt-mark unhold package-name

# Or use full-upgrade (may have side effects)
sudo apt full-upgrade
```

**Problem:** "Unable to locate package"
```bash
# Update package lists
sudo apt update   # or: sudo dnf makecache

# Check if repo is enabled
cat /etc/apt/sources.list
ls /etc/apt/sources.list.d/
# or: dnf repolist
```

**Problem:** GPG key error when adding repo
```bash
# Ensure key is in keyring and sources.list uses signed-by
# Re-download and add key
wget -O- https://example.com/key.asc | gpg --dearmor | sudo tee /usr/share/keyrings/example.gpg
```

**Problem:** `checkinstall` fails or package not found
```bash
# Ensure make succeeded and you're in the source directory
make
sudo checkinstall -y  # -y for non-interactive defaults
```

## Key Commands Reference

### APT (Debian/Ubuntu)
```bash
sudo apt update
sudo apt upgrade
sudo apt full-upgrade
sudo apt install package
sudo apt remove package
sudo apt purge package
sudo apt autoremove
apt search keyword
apt show package
apt list --installed
apt list --upgradable
```

### dpkg
```bash
sudo dpkg -i package.deb
dpkg -l
dpkg -S /path/to/file
sudo dpkg --configure -a
```

### DNF (Fedora/RHEL)
```bash
sudo dnf install package
sudo dnf update
sudo dnf remove package
dnf search keyword
dnf info package
dnf list installed
dnf provides /path/to/file
sudo dnf group install "Development Tools"
dnf module list
```

### rpm
```bash
sudo rpm -ivh package.rpm
rpm -qa
rpm -qf /path/to/file
rpm -ql package
```

### Repositories
```bash
# PPA (Ubuntu)
sudo add-apt-repository ppa:user/repo

# COPR (Fedora)
sudo dnf copr enable user/project

# GPG key (modern)
gpg --dearmor < key.asc | sudo tee /usr/share/keyrings/repo.gpg
```

### Build from Source
```bash
./configure --prefix=/usr/local
make
sudo make install
# Or: sudo checkinstall
sudo apt build-dep package   # Debian
sudo dnf builddep package   # Fedora
```

## Additional Resources

### Official Documentation
- [Debian Package Management](https://www.debian.org/doc/manuals/debian-reference/ch02.en.html)
- [Ubuntu Server Guide: Package Management](https://ubuntu.com/server/docs/package-management)
- [Fedora DNF documentation](https://dnf.readthedocs.io/)
- [RPM Package Manager](https://rpm.org/)

### Books & Guides
- *"UNIX and Linux System Administration Handbook"* — Package management chapter
- [Arch Wiki: Pacman](https://wiki.archlinux.org/title/Pacman) — Concepts apply across distros
- [Red Hat: Managing software with DNF](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/managing_software_with_the_dnf_tool/)

### Practice
- Set up a VM with Ubuntu and one with Fedora; practice both ecosystems
- Add a PPA and COPR repo; compare how each integrates
- Build a small project from source and create a package with checkinstall

## Questions for Review

1. What is the difference between `apt upgrade` and `apt full-upgrade`?
2. When would you use `dpkg -i` instead of `apt install`?
3. What does `apt purge` do that `apt remove` does not?
4. How do you find which package provides a specific file?
5. What is the purpose of `apt-mark hold`?
6. Explain the format of a `sources.list` line (deb, uri, suite, components).
7. What security risk do third-party repositories pose?
8. When is it appropriate to build software from source?
9. What does `checkinstall` do, and why use it instead of `make install`?
10. How do you fix "broken dependencies" after an interrupted package install?

## Lab Assignment Ideas

1. **Dual-Ecosystem Comparison**: Document APT vs DNF commands for the same tasks (install, search, remove) in a cheat sheet
2. **Repository Audit**: List all enabled repos on a system; identify which are official vs third-party; document GPG verification
3. **Package Pinning Lab**: Pin a package, attempt upgrade, verify it stays; document the process
4. **Source Build & Package**: Build a utility from source, use checkinstall to create .deb or .rpm, install and remove it via the package manager
5. **Security Prep**: Install openssh-server, fail2ban, and ufw; document versions and any configuration changes (preview for Weeks 8–9)

---

**Instructor Notes:**
- Emphasize CLO 3: Configure package repositories for reliable connectivity
- Lab 7: Software Compilation — align exercises with build-from-source and checkinstall
- Quiz 1 covers Weeks 1–7 material — include package management in review
- Connect to future: Weeks 8–9 will require installing security packages (openssh, fail2ban, ufw)
- Live demo: Show both apt and dnf on different VMs; demonstrate `apt update` vs `apt upgrade` timing
- Warn about third-party repos: stress GPG verification and supply chain risks
