# Lecture 3: Process Management & Systemd

CSS 262 - Linux Administration & *nix Systems for Cybersecurity

## 📝 Topics Covered

### Part 1: Process Management
- Understanding processes and the process hierarchy
- Viewing processes (ps, top, htop)
- Process states and lifecycle
- Sending signals (kill, killall, pkill)
- Job control (foreground/background)
- Process priority (nice, renice)
- The /proc filesystem

### Part 2: Systemd
- Introduction to systemd and unit types
- Service management with systemctl
- Creating custom service files
- Understanding systemd targets (runlevels)
- Systemd timers as cron replacement
- Log management with journalctl
- Boot analysis and optimization
- Resource control and dependencies

## 🚀 Running the Slides

All lectures are managed from the parent `lectures/` directory.

### First Time Setup

```bash
cd lectures
bun install
```

### Development Mode (Live Preview)

```bash
bun run dev lecture-03/slides.md
```

This will start a local server (usually at http://localhost:3030) with hot-reload.

### Build for Production

```bash
bun run build lecture-03/slides.md -- -o dist/lecture-03
```

This creates a static build in the `dist/lecture-03/` folder.

### Export to PDF

```bash
bun run export lecture-03/slides.md -- --output exports/lecture-03.pdf
```

This exports the slides to `exports/lecture-03.pdf`.

## 📚 Related Materials

- **Reading:** The Linux Command Line, Chapter 10 (Processes)
- **Reading:** UNIX and Linux System Administration Handbook, Chapter 2 (Booting & System Management)
- **Lab:** Lab 3 - Process Management & Systemd
- **Week:** Week 3 of 15

## 🎯 Learning Objectives

After this lecture, students should be able to:

1. Monitor and analyze running processes using various tools
2. Control processes using signals and job control
3. Understand process states and the process hierarchy
4. Manage system services using systemctl
5. Create and deploy custom systemd service files
6. Configure systemd timers for scheduled tasks
7. Analyze system logs with journalctl
8. Troubleshoot failed services and optimize boot time
9. Apply resource limits to services

## 💡 Key Commands Introduced

### Process Management
- `ps aux` - View all processes
- `top` / `htop` - Interactive process monitoring
- `pgrep`, `pidof` - Find process IDs
- `kill`, `killall`, `pkill` - Send signals to processes
- `nice`, `renice` - Adjust process priority
- `jobs`, `fg`, `bg` - Job control
- `lsof` - List open files

### Systemd
- `systemctl start/stop/restart/reload SERVICE`
- `systemctl enable/disable SERVICE`
- `systemctl status SERVICE`
- `systemctl list-units --type=service`
- `systemctl daemon-reload`
- `journalctl -u SERVICE -f`
- `systemd-analyze blame`

## 🔗 Resources

- [Systemd Documentation](https://systemd.io/)
- [Understanding Systemd Units and Unit Files](https://www.digitalocean.com/community/tutorials/understanding-systemd-units-and-unit-files)
- [systemd.service Man Page](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Understanding the Linux Boot Process](https://opensource.com/article/17/2/linux-boot-and-startup)
- [Process Management in Linux](https://www.geeksforgeeks.org/process-management-in-linux/)

## 🎓 Practice Exercises

1. Find all processes consuming more than 5% CPU
2. Create a custom systemd service for a Python application
3. Set up a systemd timer to run a backup script daily at 3 AM
4. Debug a failing service using journalctl
5. Optimize boot time by analyzing and disabling unnecessary services
6. Use nice to run a CPU-intensive task with low priority
7. Find and kill all processes owned by a specific user
8. Monitor a specific service in real-time using journalctl

## 🔍 Security Considerations

- Run services with minimal privileges (dedicated users/groups)
- Set resource limits to prevent DoS
- Regularly audit running processes for anomalies
- Monitor failed services for security incidents
- Use systemd's security features (sandboxing, capabilities)
- Review logs regularly with journalctl
- Disable unnecessary services to reduce attack surface
