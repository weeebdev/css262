# Changelog

## 2026-03-10

### Changed: Course plan — replaced Midterm with Mid-semester Project

- **README.md**: Restructured weekly plan (Weeks 7–15):
  - Removed Week 8 Midterm Exam ("Broken VM Challenge")
  - Shifted all topics forward by one week to fill the gap
  - Added Week 14 "Project Work & Review" as buffer/project week
  - Redistributed assessments: Quiz 1 (Wk 7), Quiz 2 (Wk 11), Quiz 3 (Wk 14)
  - Mid-semester Project assigned Week 12, due Week 14
  - Homework 3 moved to Week 9, Homework 4 to Week 13
- **Assessment breakdown**: Replaced "Midterm (20%)" with "Mid-semester Project (20%)" — Server Hardening Practical, auto-graded
- **Workload estimation**: Replaced Midterm (4h) with Mid-semester Project (10h), total ~144h
- **CLOs updated**: References to Midterm replaced with Mid-semester Project and Quiz
- **Anti-cheat policy**: Updated terminology from Midterm to Projects

### Added: Lecture 7 — Package Management & Repositories

- **lecture-07/slides.md**: Slidev presentation (28 slides) covering:
  - Part 1: Package management fundamentals (why, ecosystems, formats, lifecycle)
  - Part 2: APT deep dive (update, upgrade, install, search, dpkg, pinning)
  - Part 3: DNF deep dive (install, update, rpm, groups, modules)
  - Part 4: Repository management (sources.list, PPA, COPR, GPG keys, security)
  - Part 5: Building from source (configure, make, checkinstall)
- **lecture-07/README.md**: Detailed lecture notes, commands reference, exercises, troubleshooting guide
- Updated **lectures/README.md**: Lecture 7 status set to ✅ Complete

### Added: Lecture 8 — SSH Hardening & Remote Access

- **lecture-08/slides.md**: Slidev presentation (28 slides) covering:
  - Part 1: SSH fundamentals (protocol, client/server, encryption, SCP/SFTP)
  - Part 2: Key-based authentication (Ed25519, ssh-keygen, deployment, permissions)
  - Part 3: Hardening sshd_config (PermitRootLogin, PasswordAuthentication, port, rate limiting)
  - Part 4: Advanced SSH (client config, port forwarding, Fail2Ban, audit tools, 2FA)
  - Security checklist and attack vector mitigation table
- **lecture-08/README.md**: Detailed lecture notes, commands reference, exercises, troubleshooting guide
- Updated **lectures/README.md**: Lecture 8 status set to ✅ Complete

First lecture in the security block (Weeks 8–11). Supports CLO 4: Harden security posture with SSH keys, firewall rules, and disabling services.

## 2025-02-25

### Added: Homework 2 — Bash Scripting & Backup Tools

- **assignments/homework-2/**: New assignment with anti-copy design
  - `backup_tool.sh`: Template for backup, rotate, log analysis, run_all
  - `README.md`: Tasks, env var requirements, testing instructions
  - `SOLUTION.sh`: Instructor reference implementation
  - `.github/workflows/classroom.yml`: Custom workflow using `GITHUB_ACTOR` for student-specific paths
  - `GITHUB_CLASSROOM_SETUP.md`: Deployment guide (do not add tests via UI)
  - `STUDENT_QUICKSTART.md`: Quick start for students
- **Anti-copy mechanism:** All paths (SOURCE_DIR, BACKUP_DIR, ARCHIVE_PREFIX) derived from `github.actor`; hardcoded values fail
- Updated **assignments/README.md**: Homework 2 status set to ✅ Ready

## 2025-02-25

### Added: Lecture 6 — Linux Networking Basics

- **lecture-06/slides.md**: Slidev presentation covering:
  - Part 1: TCP/IP stack, network interfaces, IP addressing, CIDR
  - Part 2: `ip` command, NetworkManager/nmcli, Netplan, DNS config
  - Part 3: Troubleshooting (ping, traceroute, routing, diagnostics)
  - Part 4: Security basics, lab exercises
- **lecture-06/README.md**: Detailed lecture notes, commands reference, exercises, troubleshooting guide
- Updated **lectures/README.md**: Lecture 6 status set to ✅ Complete

Aligns with README.md course plan: Week 6 (Linux Networking Basics), Lab 6 (IP & DNS Config), Homework 2 submission. Supports CLO 3: Configure robust network settings for reliable connectivity.

### Fixed: export-all.js skip unchanged

- **lectures/scripts/export-all.js**: Skip export when PDF exists and slides.md is unchanged (compare mtime)

### Fixed: Lecture 6 Slidev overflow

- **Slide 5 (TCP/IP Model)**: Replaced tall mermaid + grid with compact two-column layout (list + small LR diagram)
- **Slide 8 (Subnets & CIDR)**: Condensed example bullets, removed Quick Calculation block
- **Slide 21 (Troubleshooting)**: Replaced large mermaid flowchart with compact numbered list; split Quick Checks to separate slide
- **Slide 25 (Lab Practice)**: Condensed exercise descriptions to single lines
