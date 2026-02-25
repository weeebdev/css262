# Changelog

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
