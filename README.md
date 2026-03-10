# Linux Administration & *nix Systems for Cybersecurity

**Course Code:** CSS 262
**Duration:** 15 Weeks  
**Level:** Undergraduate (Bachelor's)  
**Credits:** 5-6 ECTS (Estimated)  

---

## 📖 Course Description

This course provides a comprehensive foundation in the administration, architecture, and security of Linux-based operating systems. Designed for future cybersecurity professionals, the curriculum moves beyond basic usage to focus on the "why" and "how" of system internals. Students will gain practical experience in command-line proficiency, service management, process control, and bash scripting.

Crucially, the course adopts a **"security-first"** approach. Key topics include system hardening, perimeter defense (firewalls), Mandatory Access Control (SELinux/AppArmor), and intrusion detection via audit logging. By the end of the semester, students will be capable of deploying, maintaining, and securing Linux environments against common threats, preparing them for roles in DevSecOps and Security Operations.

---

## 🎯 Course Learning Outcomes (CLOs)


| Order | Active Verb    | What will be done/produced                                                                                        | How this learning outcome will be achieved                        |
| ----- | -------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **1** | **Administer** | The fundamental components of Linux: user accounts, file permissions, storage volumes, and system initialization. | Lectures (Weeks 1-4), Lab 2 (User Mgmt), Assignment 1.            |
| **2** | **Develop**    | Automated solutions for system maintenance and log processing using Bash shell scripting.                         | Scripting workshops (Week 5), Lab 5, Assignment 2 (Backup Tools). |
| **3** | **Configure**  | Robust network settings (Static IP, DNS) and package repositories to ensure reliable connectivity.                | Network troubleshooting (Week 6), Lab 7, Quiz 1.                  |
| **4** | **Harden**     | The security posture of servers by implementing SSH keys, firewall rules (UFW/iptables), and disabling services.  | SSH Audits (Week 8), Lab 9 (Firewalls), Mid-semester Project.     |
| **5** | **Analyze**    | System logs and audit trails to detect unauthorized access and troubleshoot SELinux violations.                   | Forensic analysis (Week 11), Lab 11 (Auditd), Quiz 2.             |
| **6** | **Construct**  | A fully secured, production-ready Linux infrastructure utilizing "Infrastructure as Code" principles.             | Final Capstone Project (Week 15) involving automated deployment.  |


---

## 🧠 Skills Acquired

### Academic Skills

1. **Problem-Solving:** Troubleshooting complex system failures.
2. **Critical Thinking:** Root cause analysis of errors.
3. **Research Skills:** Navigating technical documentation and Man pages.
4. **Practical Coding:** Bash/Shell automation.
5. **Self-Directed Learning:** Solving CTF-style challenges.
6. **Security Mindset:** Adopting defensive administration practices.
7. **Technical Documentation:** Reporting on system configurations.
8. **Analytical Reasoning:** Log parsing and audit analysis.

### Subject-Specific Skills

1. Management of Linux filesystems, users, and advanced permissions (ACLs, SUID).
2. Developing robust Bash scripts for security auditing.
3. Designing network defense strategies using firewalls (iptables/nftables).
4. Configuring Mandatory Access Control (SELinux) for service isolation.
5. Analyzing system logs (`journalctl`, `auditd`) for security incidents.
6. Managing system initialization (`systemd`) and LVM storage.
7. Deploying hardened web services using automated provisioning.

---

## 📅 Weekly Course Plan


| Week   | Topics                                 | Activity                                                         |
| ------ | -------------------------------------- | ---------------------------------------------------------------- |
| **1**  | **Course Introduction & The Shell**    | Lab 1: VM Setup & Shell Navigation                               |
| **2**  | **Users, Groups & Permissions**        | Lab 2: User Management                                          |
| **3**  | **Process Management & Systemd**       | Lab 3: Systemd Services, **Submit: Homework 1**                  |
| **4**  | **Storage, Filesystems & LVM**         | Lab 4: Disk Partitioning                                        |
| **5**  | **Bash Scripting & Automation**        | Lab 5: Scripting Basics                                         |
| **6**  | **Linux Networking Basics**            | Lab 6: IP & DNS Config, **Submit: Homework 2**                   |
| **7**  | **Package Management & Repositories**  | Lab 7: Software Compilation, **Quiz 1**                          |
| **8**  | **SSH Hardening & Remote Access**      | Lab 8: SSH Config                                                |
| **9**  | **Firewalls & Packet Filtering**       | Lab 9: UFW/Iptables Setup, **Submit: Homework 3**                |
| **10** | **Mandatory Access Control (SELinux)** | Lab 10: SELinux Contexts                                         |
| **11** | **Logging, Auditing & Cron**           | Lab 11: Auditd & Logrotate, **Quiz 2**                           |
| **12** | **Containerization (Docker)**          | Lab 12: Docker Security, **Mid-semester Project Assigned**       |
| **13** | **Vulnerability Scanning & Patching**  | Lab 13: Lynis Audit, **Submit: Homework 4**                      |
| **14** | **Project Work & Review**              | **Mid-semester Project Due**, **Quiz 3**                         |
| **15** | **Capstone Project & Wrap-Up**         | **Capstone Project Defense & Final Report**                      |


---

## 📊 Assessment & Grading

**Grading Policy:** This course utilizes **Automated Grading** via GitHub Actions.

- **Green Checkmark ✅:** Full Points.
- **Red Cross ❌:** Zero Points (Resubmission allowed until deadline).
- *Note:* Code must work on the standard grading environment, not just "on your machine."

### Assessment Breakdown


| Assessment              | Description                                         | Quantity | Weight (%) |
| ----------------------- | --------------------------------------------------- | -------- | ---------- |
| **Homework**            | Auto-graded Bash scripting assignments.             | 4        | **30%**    |
| **Quiz**                | Theory checks on LMS.                               | 3        | **10%**    |
| **Mid-semester Project** | Server Hardening Practical (auto-graded).           | 1        | **20%**    |
| **Capstone Project**    | Final Capstone: Hardened Infrastructure Deployment. | 1        | **40%**    |
| **Total**               |                                                     |          | **100%**   |


### Workload Estimation


| Activity                    | Quantity | Hours/Item | Total Hours    |
| --------------------------- | -------- | ---------- | -------------- |
| **Seminar (Lecture)**       | 15       | 1          | 15             |
| **Practice (Lab)**          | 15       | 2          | 30             |
| **Self-study**              | 15       | 3          | 45             |
| **Homework Assignment**     | 4        | 4          | 16             |
| **Quiz**                    | 3        | 1          | 3              |
| **Mid-semester Project**    | 1        | 10         | 10             |
| **Capstone Project**        | 1        | 25         | 25             |
| **Total**                   |          |            | **~144 Hours** |


---

## 📚 Reading List & Resources

### Required Textbooks

1. **The Linux Command Line (2nd Edition)** – William Shotts
  *Primary text for Modules 1 & 2.*
2. **UNIX and Linux System Administration Handbook (5th Edition)** – Evi Nemeth et al.
  *Primary text for Internals & Docker.*
3. **PicoCTF Learning Primer** – PicoCTF Team
  *Guide for CTF-style assessments (Labs/Projects).*

### Required Tools

- **Laptop:** Minimum 8GB RAM, capable of running VirtualBox/VMware.
- **Software:** VirtualBox, Git, VS Code.
- **Accounts:** GitHub (Free Educational Account recommended).

---

## ⚙️ Technical Requirements (Anti-Cheat Policy)

All graded scripts (Homework/Projects) run in a CI/CD pipeline.

1. **Dynamic Inputs:** Scripts must handle random filenames/users passed as variables. Hardcoding values will result in failure.
2. **Identity Verification:** Project paths and configs are derived from your GitHub username. Sharing code will result in mismatch and failure.

