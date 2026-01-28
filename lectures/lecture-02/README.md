# Lecture 2: Users, Groups & Permissions

CSS 262 - Linux Administration & *nix Systems for Cybersecurity

## 📝 Topics Covered

### Part 1: Users & Groups
- Multi-user system concepts
- User types (root, regular, system)
- User identifiers (UID/GID)
- Group management
- System files (`/etc/passwd`, `/etc/shadow`, `/etc/group`)
- User management commands (useradd, usermod, userdel)
- Group management commands (groupadd, groupmod, groupdel)
- sudo and su commands

### Part 2: File Permissions
- Linux permission model (rwx)
- Reading and understanding permission strings
- File types in Linux
- chmod (symbolic and octal notation)
- chown and chgrp commands
- umask (default permissions)
- Special permissions (SUID, SGID, sticky bit)
- Access Control Lists (ACLs)
- Permission troubleshooting
- Security best practices

## 🚀 Running the Slides

All lectures are managed from the parent `lectures/` directory.

### First Time Setup

```bash
cd lectures
bun install
```

### Development Mode (Live Preview)

```bash
bun run dev lecture-02/slides.md
```

This will start a local server (usually at http://localhost:3030) with hot-reload.

### Build for Production

```bash
bun run build lecture-02/slides.md -- -o dist/lecture-02
```

This creates a static build in the `dist/lecture-02/` folder.

### Export to PDF

```bash
bun run export lecture-02/slides.md -- --output exports/lecture-02.pdf
```

This exports the slides to `exports/lecture-02.pdf`.

## 📚 Related Materials

- **Reading:** The Linux Command Line, Chapter 6 (Permissions)
- **Lab:** Lab 2 - User Management
- **Week:** Week 2 of 15

## 🎯 Learning Objectives

After this lecture, students should be able to:

1. Create and manage user accounts and groups
2. Understand Linux permission model and file ownership
3. Use chmod, chown, and chgrp effectively
4. Work with special permissions (SUID, SGID, sticky bit)
5. Configure and use sudo for privilege escalation
6. Apply security best practices for access control
7. Troubleshoot permission-related issues
8. Use ACLs for fine-grained access control

## 💡 Key Concepts

### Permission Notation
- **Symbolic:** `rwxr-xr--` (read, write, execute)
- **Octal:** `754` (binary conversion: 111 101 100)

### Common Permission Values
- `644` (`rw-r--r--`) - Standard file
- `755` (`rwxr-xr-x`) - Standard executable/directory
- `600` (`rw-------`) - Private file (SSH keys)
- `700` (`rwx------`) - Private directory

### Special Permissions
- **SUID (4000):** Runs with owner privileges
- **SGID (2000):** Runs with group privileges / inherits group
- **Sticky (1000):** Only owner can delete files

## 🔧 Essential Commands

```bash
# User Management
sudo useradd -m -s /bin/bash username
sudo passwd username
sudo usermod -aG groupname username
sudo userdel -r username

# Group Management
sudo groupadd groupname
sudo gpasswd -a username groupname
sudo groupdel groupname

# Permissions
chmod 755 file.sh
chmod u+x,g+x file.sh
chown user:group file
chgrp group file

# Special Permissions
chmod u+s executable    # SUID
chmod g+s directory     # SGID
chmod +t directory      # Sticky bit

# ACLs
setfacl -m u:username:rwx file
getfacl file
```

## 🔒 Security Tips

1. **Never use `chmod 777`** - It's almost always wrong
2. **Protect SSH keys** with `chmod 600`
3. **Use sudo** instead of logging in as root
4. **Apply least privilege** - grant minimum necessary permissions
5. **Audit SUID files** regularly with `find / -perm -4000`
6. **Set restrictive umask** - typically 022 or 027
7. **Remove unused accounts** - security hygiene
8. **Use groups** for shared access instead of opening permissions

## 🔗 Resources

- [Linux File Permissions Explained](https://www.linux.com/training-tutorials/understanding-linux-file-permissions/)
- [chmod Calculator](https://chmod-calculator.com/)
- [sudo Manual](https://www.sudo.ws/man/1.8.15/sudo.man.html)
- [ACL Documentation](https://linux.die.net/man/1/setfacl)

## 🧪 Practice Exercises

Try these on your VM:

1. Create 3 users: alice, bob, charlie
2. Create a group called "developers" and add alice and bob
3. Create a shared directory `/projects` with SGID bit set
4. Set up sudo access for alice
5. Find all SUID files on your system
6. Create a file only readable by the owner
7. Use ACLs to grant charlie read access to alice's file

## ⚠️ Common Pitfalls

- Forgetting the `-m` flag with `useradd` (no home directory created)
- Using `usermod -G` instead of `usermod -aG` (replaces all groups!)
- Changing permissions on system files (can break the system)
- Not understanding that directory execute bit is required to access contents
- Confusing owner permissions with group permissions
- Setting SUID on shell scripts (security risk and doesn't work properly)
