# CSS 262 Assignments

## Overview

| Assignment | Topic | Due Week | Weight | Status |
|------------|-------|----------|--------|--------|
| **Homework 1** | Linux Fundamentals & User Management | Week 3 | 7.5% | ✅ Ready |
| **Homework 2** | Bash Scripting & Backup Tools | Week 6 | 7.5% | ✅ Ready |
| **Homework 3** | SSH Hardening & Firewall Rules | Week 9 | 7.5% | ✅ Ready |
| **Homework 4** | Vulnerability Scanning | Week 13 | 7.5% | 🔜 Coming |

## Homework 1: Linux Fundamentals

**Topics:** Shell basics, Users/Groups, Permissions, Processes, Systemd  
**Points:** 100 (7.5% of course grade)  
**Due:** Week 3

### Quick Deploy:
```bash
cd homework-1
gh repo create SDU-CSS262-2026/homework-1-template --private --source=. --push
gh repo edit SDU-CSS262-2026/homework-1-template --enable-template
```

Then: Create assignment in GitHub Classroom → Add 7 tests from `homework-1/GITHUB_CLASSROOM_SETUP.md`

**Full guide:** `INSTRUCTOR_QUICK_REFERENCE.md`

## Homework 2: Bash Scripting & Backup Tools

**Topics:** Env vars, tar backups, log parsing, rotation  
**Points:** 100 (7.5% of course grade)  
**Due:** Week 6  
**Anti-copy:** Uses `GITHUB_ACTOR` for student-specific paths

### Quick Deploy:
```bash
cd homework-2
gh repo create SDU-CSS262-2026/homework-2-template --private --source=. --push
gh repo edit SDU-CSS262-2026/homework-2-template --enable-template
```

**Important:** Do NOT add tests via Classroom UI. Template includes custom `.github/workflows/classroom.yml`. See `homework-2/GITHUB_CLASSROOM_SETUP.md`.

## Homework 3: SSH Hardening & Firewall Rules

**Topics:** sshd_config hardening, SSH auditing, iptables firewall generation  
**Points:** 100 (7.5% of course grade)  
**Due:** Week 9  
**Anti-copy:** Uses `GITHUB_ACTOR` for student-specific paths and network config

### Quick Deploy:
```bash
cd homework-3
rsync -av --exclude='SOLUTION.sh' . ../hw3-template-build/
cd ../hw3-template-build
git init && git add . && git commit -m "Template"
gh repo create SDU-CSS262-2026/homework-3-template --private --source=. --push
gh repo edit SDU-CSS262-2026/homework-3-template --enable-template
rm -rf ../hw3-template-build
```

**Important:** Do NOT add tests via Classroom UI. Template includes custom `.github/workflows/classroom.yml`. See `homework-3/GITHUB_CLASSROOM_SETUP.md`.
