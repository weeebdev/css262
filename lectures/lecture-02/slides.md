---
theme: default
background: https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 2
  Linux Administration & *nix Systems for Cybersecurity
  
  Users, Groups & Permissions
drawings:
  persist: false
transition: slide-left
title: 'Lecture 2: Users, Groups & Permissions'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Users, Groups & Permissions

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 2: Access Control Fundamentals
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon:edit />
  </button>
</div>

---
layout: default
---

# 📋 Today's Agenda

<div class="grid grid-cols-2 gap-6 text-sm">

<div>

### Part 1: Users & Groups
- Understanding multi-user systems
- User types and roles
- User management commands
- Group concepts
- System files (`/etc/passwd`, `/etc/shadow`)

</div>

<div>

### Part 2: File Permissions
- Permission model (rwx)
- Reading permission strings
- chmod, chown, chgrp
- Special permissions (SUID, SGID, sticky bit)
- Access Control Lists (ACLs)

</div>

</div>

<div class="mt-6 p-3 bg-blue-500 bg-opacity-20 rounded text-sm">
🎯 <strong>Learning Objective:</strong> Master Linux access control to secure systems and manage multi-user environments.
</div>

---
layout: default
---

# 🔄 Quick Recap: Week 1

<div class="text-sm">

### What We Covered
- The shell and command-line interface
- Basic navigation commands
- File system hierarchy
- Pipes and redirection
- Environment variables

### Key Takeaway
The shell is your primary interface for system administration.

</div>

<div class="mt-6 p-3 bg-green-500 bg-opacity-20 rounded text-sm">
✅ <strong>Assumption:</strong> You now have a working Linux VM and can navigate the file system.
</div>

---
layout: center
class: text-center
---

# Part 1: Users & Groups

<div class="text-6xl mb-4">
👥
</div>

Understanding multi-user systems

---
layout: default
---

# Why Multi-User Systems?

<div class="mb-6">

### Linux is Designed for Multiple Users
Linux inherited the multi-user concept from Unix (1970s) - multiple people sharing expensive mainframe computers.

</div>

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Benefits
- **Isolation:** Users can't interfere with each other
- **Security:** Limit access to sensitive data
- **Resource Control:** Manage CPU, memory, disk usage
- **Accountability:** Track who did what
- **Flexibility:** Different roles and permissions

</div>

<div>

### Use Cases
- Shared servers (web, database, etc.)
- Development environments
- University/corporate systems
- Cloud infrastructure
- Your VM (even with one human user!)

</div>

</div>

---
layout: default
---

# User Types in Linux

<div class="text-sm">

### 1. Root User (Superuser)
- **UID: 0** | Username: `root` | Home: `/root`
- Unlimited privileges - can do anything
- Dangerous - one wrong command can destroy system
- **Avoid direct login** - use `sudo` instead

### 2. Regular Users
- **UID: 1000+** | Home: `/home/username`
- Created by administrators
- Limited to their own files
- Can use `sudo` if granted

### 3. System Users
- **UID: 1-999** | Examples: `www-data`, `mysql`, `sshd`
- Run services and daemons
- No login shell (usually)
- Enhanced security through isolation

</div>

---
layout: default
---

# User Identifiers (UID)

<div class="mb-6 text-sm">

### Every User Has a Unique Number

```bash
id        # uid=1000(john) gid=1000(john) groups=1000(john),27(sudo)
id root   # uid=0(root) gid=0(root) groups=0(root)
```

</div>

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### UID Ranges
- **0** - Root user
- **1-999** - System users
- **1000+** - Regular users

</div>

<div>

### Why UIDs Matter
- Permissions based on UID, not username
- File ownership stored as UID
- Process ownership tracked by UID
- Usernames are just friendly labels

</div>

</div>

---
layout: default
---

# Understanding Groups

<div class="mb-4 text-sm">

### Groups Enable Shared Access
A **group** is a collection of users who need similar permissions.

```bash
groups                    # john adm cdrom sudo dip plugdev
cat /etc/group | head -3  # root:x:0:  daemon:x:1:  bin:x:2:
```

</div>

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Group Types
- **Primary group:** Every user has one
- **Supplementary:** Additional memberships
- **System groups:** For services

</div>

<div>

### Common Groups
- `sudo` - Can use sudo command
- `wheel` - Admin group (some distros)
- `docker` - Can run Docker
- `www-data` - Web server files

</div>

</div>

---
layout: default
---

# The /etc/passwd File

<div class="mb-4 text-sm">

### The User Database (world-readable)

```bash
cat /etc/passwd | grep john
# john:x:1000:1000:John Doe,,,:/home/john:/bin/bash
```

</div>

<div class="text-xs">

### 7 Fields (colon-separated)

| Field | Example | Description |
|-------|---------|-------------|
| 1. Username | `john` | Login name |
| 2. Password | `x` | Now in /etc/shadow |
| 3. UID | `1000` | User ID number |
| 4. GID | `1000` | Primary group ID |
| 5. GECOS | `John Doe` | Full name |
| 6. Home | `/home/john` | Home directory |
| 7. Shell | `/bin/bash` | Login shell |

</div>

---
layout: default
---

# The /etc/shadow File

<div class="mb-4 text-sm">

### Secure Password Storage (only root can read)

```bash
sudo cat /etc/shadow | grep john
# john:$6$rounds=656000$xyz...:19345:0:99999:7:::
```

</div>

<div class="text-xs">

| Field | Description |
|-------|-------------|
| 1. Username | Login name |
| 2. Password | Encrypted with SHA-512 (`$6$`) |
| 3. Last Changed | Days since 1970-01-01 |
| 4. Min Days | Min days between password changes |
| 5. Max Days | Max days before must change |
| 6. Warn Days | Days before expiry to warn |
| 7-9. | Inactivity, expiry, reserved |

</div>

---
layout: default
---

# Creating Users

<div class="text-sm">

### useradd Command

```bash
# Create with home directory and shell
sudo useradd -m -s /bin/bash john

# Create with specific UID and groups
sudo useradd -m -u 1500 -G sudo,docker john

# Set password
sudo passwd john
```

### Common Options
- `-m` - Create home directory
- `-s /bin/bash` - Set login shell
- `-G groups` - Add to supplementary groups
- `-u UID` - Specify UID
- `-c "Name"` - Set full name
- `-d /path` - Custom home directory

</div>

---
layout: default
---

# Modern User Creation: adduser

<div class="text-sm">

### Interactive Wrapper (Debian/Ubuntu)

```bash
sudo adduser jane    # Interactive, prompts for details
```

</div>

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### useradd (Low-level)
- Manual configuration needed
- More control
- Works on all distros

```bash
sudo useradd -m -s /bin/bash jane
sudo passwd jane
```

</div>

<div>

### adduser (High-level)
- Interactive and friendly
- Auto-creates home directory
- Debian/Ubuntu specific

```bash
sudo adduser jane
# That's it!
```

</div>

</div>

---
layout: default
---

# Managing Users

<div class="text-sm">

### Modify Existing Users

```bash
# Change user's shell
sudo usermod -s /bin/zsh john

# Add user to group
sudo usermod -aG sudo john     # -a = append, don't replace

# Change username
sudo usermod -l newname oldname

# Lock user account
sudo usermod -L john

# Unlock user account
sudo usermod -U john
```

### Delete Users

```bash
# Delete user (keep home directory)
sudo userdel john

# Delete user and home directory
sudo userdel -r john
```

</div>

---
layout: default
---

# Managing Groups

<div class="text-sm">

### Group Management Commands

```bash
# Create a group
sudo groupadd developers

# Create with specific GID
sudo groupadd -g 5000 developers

# Add user to group
sudo usermod -aG developers john

# Or use gpasswd
sudo gpasswd -a john developers

# Remove user from group
sudo gpasswd -d john developers

# Delete a group
sudo groupdel developers

# View group members
getent group developers
```

</div>

---
layout: default
---

# sudo: Superuser Do

<div class="mb-4 text-sm">

### Run Commands as Root

```bash
sudo apt update              # Run as root
sudo -u www-data ls /var/www # Run as another user
sudo visudo                  # Edit /etc/sudoers safely
```

</div>

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Why sudo?
- **Accountability:** Logs who ran what
- **Limited exposure:** Specific commands
- **No root password:** Don't share
- **Temporary:** Expires after 15 min

</div>

<div>

### Configuration
```bash
# /etc/sudoers
john ALL=(ALL:ALL) ALL
%sudo ALL=(ALL:ALL) ALL
```
- `john` can run anything
- `%sudo` group can run anything

</div>

</div>

---
layout: default
---

# su: Switch User

<div class="text-sm">

### Switch to Another User

```bash
# Switch to another user
su - john      # Login shell (loads environment)
su john        # Non-login shell (keeps current env)

# Switch to root (requires root password)
su -
su - root

# Run single command as another user
su -c "whoami" john
```

### su vs sudo

| Feature | su | sudo |
|---------|----|----- |
| Password | Target user's password | Your password |
| Logging | Minimal | Detailed audit trail |
| Privilege | Becomes that user | Runs as that user |
| Best Practice | ❌ Avoid for root | ✅ Preferred method |

</div>

---
layout: center
class: text-center
---

# Part 2: File Permissions

<div class="text-6xl mb-4">
🔒
</div>

Controlling access to files and directories

---
layout: default
---

# Linux Permission Model

<div class="mb-4">

### Every File Has Three Permission Sets

```bash
ls -l myfile.txt
-rw-r--r-- 1 john developers 1234 Jan 28 10:00 myfile.txt
```

</div>

<div class="text-xs">

### Permission Breakdown

```
-  rw-  r--  r--   1  john  developers  1234  Jan 28  myfile.txt
│  │    │    │     │   │        │         │      │       │
│  │    │    │     │   │        │         │      │       └─ Filename
│  │    │    │     │   │        │         │      └─ Date
│  │    │    │     │   │        │         └─ Size
│  │    │    │     │   │        └─ Group owner
│  │    │    │     │   └─ User owner
│  │    │    │     └─ Hard links
│  │    │    └─ Others permissions
│  │    └─ Group permissions
│  └─ Owner permissions
└─ File type
```

</div>

---
layout: default
---

# File Types

<div class="text-xs">

### First Character Indicates Type

| Symbol | Type | Example |
|--------|------|---------|
| `-` | Regular file | `-rw-r--r--` |
| `d` | Directory | `drwxr-xr-x` |
| `l` | Symbolic link | `lrwxrwxrwx` |
| `c` | Character device | `crw-rw----` (keyboard) |
| `b` | Block device | `brw-rw----` (disk) |
| `s` | Socket | `srwxrwxrwx` |
| `p` | Named pipe | `prw-r--r--` |

### Examples

```bash
ls -la /dev | head -4
# drwxr-xr-x  20 root root   3940 Jan 28 10:00 .
# crw-rw-rw-   1 root tty  5,   0 Jan 28 14:45 tty
# brw-rw----   1 root disk 8,   0 Jan 28 10:00 sda
```

</div>

---
layout: default
---

# Permission Bits

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### For Files
- **r (read)** - View contents
  - `cat`, `less`, `grep`
- **w (write)** - Modify contents
  - `vim`, `echo >`, `rm`
- **x (execute)** - Run as program
  - `./script.sh`

```bash
-rw-r--r--  document.txt
-rwxr-xr-x  script.sh
-rw-------  secret.key
```

</div>

<div>

### For Directories
- **r (read)** - List contents
  - `ls directory/`
- **w (write)** - Create/delete files
  - `touch`, `rm`, `mkdir`
- **x (execute)** - Enter directory
  - `cd directory/`

```bash
drwxr-xr-x  public/
drwx------  private/
drwxrwxrwx  tmp/
```

</div>

</div>

<div class="mt-4 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Important:</strong> Need execute (x) on directory to access files!
</div>

---
layout: default
---

# Reading Permissions

<div class="mb-6 text-sm">

### Practice Exercise

```bash
-rwxr-xr--  1  john  developers  4096  Jan 28  script.sh
```

</div>

<div class="grid grid-cols-3 gap-4 text-sm">

<div>

### Owner (john)
- **r** - Can read
- **w** - Can write
- **x** - Can execute

**Result:** Full access

</div>

<div>

### Group (developers)
- **r** - Can read
- **-** - Cannot write
- **x** - Can execute

**Result:** Read & execute only

</div>

<div>

### Others (everyone else)
- **r** - Can read
- **-** - Cannot write
- **-** - Cannot execute

**Result:** Read only

</div>

</div>

---
layout: default
---

# chmod: Change Mode

<div class="text-sm">

### Two Notations: Symbolic and Octal

</div>

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Symbolic (Human-friendly)

```bash
# Add execute for owner
chmod u+x script.sh

# Remove write for group
chmod g-w file.txt

# Set read-only for others
chmod o=r file.txt

# Add execute for all
chmod a+x script.sh

# Multiple changes
chmod u+x,g+x,o-r file.txt
```

**Symbols:** `u`=user, `g`=group, `o`=others, `a`=all

</div>

<div>

### Octal (Numeric)

```bash
# Read permissions as binary:
# r w x
# 4 2 1

# Examples:
chmod 755 script.sh   # rwxr-xr-x
chmod 644 file.txt    # rw-r--r--
chmod 600 secret.key  # rw-------
chmod 777 public.sh   # rwxrwxrwx (dangerous!)
```

**Common Values:**
- `755` - Standard executable
- `644` - Standard file
- `600` - Private file
- `700` - Private directory

</div>

</div>

---
layout: default
---

# chmod Examples

<div class="text-sm">

```bash
# Make script executable
chmod +x script.sh                    # Same as chmod a+x
chmod 755 script.sh

# Protect sensitive file
chmod 600 ~/.ssh/id_rsa              # Only owner can read/write

# Public readable file
chmod 644 document.txt               # Owner: rw, others: r

# Shared directory
chmod 770 /shared/project            # Owner+Group: full, Others: none

# Recursive permissions
chmod -R 755 /var/www/html           # Apply to all files/dirs

# Remove all permissions for others
chmod o-rwx file.txt

# Set specific permissions
chmod u=rwx,g=rx,o=r file.txt       # rwxr-xr--
```

</div>

---
layout: default
---

# Octal Permissions Cheat Sheet

<div class="text-xs">

### Binary to Octal Conversion

| Binary | Octal | Perms | Description |
|--------|-------|-------|-------------|
| 000 | 0 | `---` | No access |
| 001 | 1 | `--x` | Execute only |
| 010 | 2 | `-w-` | Write only |
| 011 | 3 | `-wx` | Write + Execute |
| 100 | 4 | `r--` | Read only |
| 101 | 5 | `r-x` | Read + Execute |
| 110 | 6 | `rw-` | Read + Write |
| 111 | 7 | `rwx` | Full access |

### Common Patterns
`644` → `rw-r--r--` (file) | `755` → `rwxr-xr-x` (executable) | `700` → `rwx------` (private) | `777` → ⚠️ dangerous!

</div>

---
layout: default
---

# chown: Change Owner

<div class="text-sm">

### Change File Ownership

```bash
# Change owner
sudo chown john file.txt

# Change owner and group
sudo chown john:developers file.txt

# Change only group (or use chgrp)
sudo chown :developers file.txt

# Recursive ownership change
sudo chown -R john:developers /var/www/mysite

# Copy ownership from another file
sudo chown --reference=file1.txt file2.txt
```

### Why Root Required?
Only root (or sudo) can change ownership - prevents users from giving away files to avoid quotas.

</div>

<div class="mt-4 p-3 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Tip:</strong> When deploying web apps, set ownership to `www-data:www-data` for web server access.
</div>

---
layout: default
---

# chgrp: Change Group

<div class="text-sm">

### Change File Group

```bash
# Change group ownership
chgrp developers file.txt

# Recursive group change
chgrp -R developers /shared/project

# Using chown (alternative)
chown :developers file.txt
```

### Practical Example: Shared Project

```bash
# Create shared directory for team
sudo mkdir /shared/project
sudo chgrp developers /shared/project
sudo chmod 770 /shared/project

# Now all users in 'developers' group can collaborate
# Owner: rwx
# Group: rwx (all developers)
# Others: --- (no access)
```

</div>

---
layout: default
---

# Default Permissions: umask

<div class="text-sm">

### umask Controls Default Permissions

```bash
umask      # Output: 0022
umask -S   # Output: u=rwx,g=rx,o=rx
```

### How umask Works
umask **subtracts** from maximum permissions:
- Files: `666` - umask
- Directories: `777` - umask

</div>

<div class="text-xs">

| umask | New Files | New Directories |
|-------|-----------|-----------------|
| 022 | `644` (rw-r--r--) | `755` (rwxr-xr-x) |
| 077 | `600` (rw-------) | `700` (rwx------) |
| 002 | `664` (rw-rw-r--) | `775` (rwxrwxr-x) |

</div>

---
layout: default
---

# Special Permissions (Part 1)

<div class="text-sm">

### SUID (Set User ID) - Bit 4000

Runs with the **owner's** privileges, not the user who runs it.

```bash
# Set SUID
chmod u+s /usr/bin/passwd
chmod 4755 /usr/bin/passwd

# Check SUID
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 passwd
#    ^  (s = SUID bit)
```

### Real Example: passwd Command
`passwd` needs to modify `/etc/shadow` (root-only), but regular users need to change passwords. SUID allows it to run as root.

</div>

<div class="mt-4 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Security Risk:</strong> SUID scripts are dangerous!
</div>

---
layout: default
---

# Special Permissions (Part 2)

<div class="text-sm">

### SGID (Set Group ID) - Bit 2000

**On files:** Runs with the group privileges  
**On directories:** New files inherit the directory's group

```bash
# Set SGID on directory
chmod g+s /shared/project
chmod 2770 /shared/project

ls -l /shared
# drwxrws--- 2 john developers 4096 project
#       ^  (s = SGID bit)
```

### Practical Use: Shared Directories
Without SGID: files get user's primary group  
With SGID: files get directory's group (developers)  
**Result:** All team members can access new files!

</div>

---
layout: default
---

# Special Permissions (Part 3)

<div class="text-sm">

### Sticky Bit - Bit 1000

On directories: Only owner can delete their files.

```bash
chmod +t /tmp
chmod 1777 /tmp

ls -ld /tmp
# drwxrwxrwt 20 root root 4096 /tmp
#         ^  (t = sticky bit)
```

### Real Example: /tmp Directory
Everyone can create files in `/tmp` (777 permissions), but you can't delete someone else's files (sticky bit). Prevents malicious deletion.

</div>

<div class="grid grid-cols-3 gap-2 mt-4 text-xs">
<div class="p-2 bg-red-500 bg-opacity-20 rounded">**SUID:** 4000 (u+s)</div>
<div class="p-2 bg-green-500 bg-opacity-20 rounded">**SGID:** 2000 (g+s)</div>
<div class="p-2 bg-blue-500 bg-opacity-20 rounded">**Sticky:** 1000 (+t)</div>
</div>

---
layout: default
---

# Access Control Lists (ACLs)

<div class="text-sm">

### Beyond Traditional Permissions
ACLs allow fine-grained permissions for multiple users/groups.

```bash
# Grant read access to specific user
setfacl -m u:alice:r file.txt

# Grant read+write to specific group
setfacl -m g:managers:rw file.txt

# Remove ACL / View ACLs
setfacl -x u:alice file.txt
getfacl file.txt

# View output
# user::rw-
# user:alice:r--
# group::r--
# group:managers:rw-
```

</div>

---
layout: default
---

# ACL Examples

<div class="text-sm">

### Scenario: Shared File with Exceptions

```bash
# Give alice (not in developers) read access
setfacl -m u:alice:r document.txt

# Check result
ls -l document.txt
# -rw-r--r--+ 1 john developers 1234 document.txt
#           ^  '+' indicates ACL is set
```

### Default ACLs for Directories

```bash
# Set default ACL (applies to new files)
setfacl -d -m g:developers:rwx /shared/project

# All new files inherit developers:rwx
```

</div>

---
layout: default
---

# Permission Troubleshooting

<div class="text-xs">

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Permission denied" reading | No read permission | `chmod +r file` |
| Can't enter directory | No execute permission | `chmod +x dir/` |
| Can't delete file | No write on directory | `chmod +w dir/` |
| Script won't execute | No execute bit | `chmod +x script.sh` |
| "Operation not permitted" | Not owner/not root | Use `sudo` |

### Debug Commands

```bash
id                    # Check your identity
ls -l file.txt        # Check file permissions
ls -ld directory/     # Check directory permissions
sudo cat /etc/shadow  # Test with sudo
```

</div>

---
layout: default
---

# Security Best Practices

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### DO ✅
- Use `chmod 600` for private keys
- Use `chmod 644` for regular files
- Use `chmod 755` for executables
- Use `sudo` instead of root login
- Set restrictive umask (022 or 027)
- Use groups for shared access
- Audit SUID/SGID files regularly
- Remove world-writable permissions

</div>

<div>

### DON'T ❌
- `chmod 777` (world-writable!)
- Run services as root
- Share root password
- Give SUID to scripts
- Leave default passwords
- Ignore permission errors
- Grant unnecessary sudo access
- Forget to revoke old accounts

</div>

</div>

<div class="mt-4 p-3 bg-purple-500 bg-opacity-20 rounded text-sm">
🛡️ <strong>Security Principle:</strong> Principle of Least Privilege - grant only the minimum permissions needed.
</div>

---
layout: default
---

# Finding Files by Permission

<div class="text-sm">

### Security Audit Commands

```bash
# Find all SUID files (security risk)
find / -perm -4000 -type f 2>/dev/null

# Find all SGID files
find / -perm -2000 -type f 2>/dev/null

# Find world-writable files
find / -perm -002 -type f 2>/dev/null

# Find files owned by user
find / -user john 2>/dev/null

# Find orphaned files (no owner)
find / -nouser 2>/dev/null

# Find recent modifications
find / -mtime -7 -type f 2>/dev/null
```

</div>

---
layout: default
---

# Lab 2 Preview: User Management

<div class="text-sm">

### What You'll Do
1. 👤 Create multiple user accounts
2. 👥 Create groups and manage membership
3. 🔒 Set appropriate file permissions
4. 🔑 Configure sudo access
5. 📁 Set up shared directory with SGID
6. 🔍 Audit permission issues

### Deliverables
- Screenshot of user creation
- Output of `id`, `groups` commands
- Properly configured shared directory
- Fixed permission problems
- Working sudo configuration

**Time Estimate:** 2 hours

</div>

---
layout: default
---

# Practical Scenarios

<div class="text-sm">

### Scenario 1: Web Application
```bash
sudo mkdir -p /var/www/myapp
sudo chown www-data:www-data /var/www/myapp
sudo chmod 755 /var/www/myapp
```

### Scenario 2: Shared Development
```bash
sudo groupadd devteam
sudo mkdir /projects/webapp
sudo chown :devteam /projects/webapp
sudo chmod 2775 /projects/webapp  # SGID + rwxrwxr-x
```

### Scenario 3: Secure Backup
```bash
chmod 600 backup.tar.gz
chown backup-user:backup-group backup.tar.gz
```

</div>

---
layout: default
---

# Quick Reference Card

<div class="text-xs">

| Command | Purpose | Example |
|---------|---------|---------|
| `useradd` | Create user | `sudo useradd -m john` |
| `passwd` | Set password | `sudo passwd john` |
| `usermod` | Modify user | `sudo usermod -aG sudo john` |
| `userdel` | Delete user | `sudo userdel -r john` |
| `groupadd` | Create group | `sudo groupadd devs` |
| `chmod` | Change permissions | `chmod 755 file.sh` |
| `chown` | Change owner | `sudo chown john:devs file` |
| `chgrp` | Change group | `chgrp devs file` |
| `umask` | Default permissions | `umask 022` |
| `id` | Show user info | `id john` |
| `groups` | Show groups | `groups john` |
| `getfacl` | Show ACLs | `getfacl file.txt` |
| `setfacl` | Set ACLs | `setfacl -m u:alice:r file` |

</div>

---
layout: default
---

# Important Files Summary

<div class="text-sm">

| File | Purpose | Permissions |
|------|---------|-------------|
| `/etc/passwd` | User account info | `-rw-r--r--` (644) |
| `/etc/shadow` | Encrypted passwords | `-rw-r-----` (640) |
| `/etc/group` | Group definitions | `-rw-r--r--` (644) |
| `/etc/gshadow` | Group passwords | `-rw-r-----` (640) |
| `/etc/sudoers` | Sudo configuration | `-r--r-----` (440) |
| `/home/*` | User home directories | `drwx------` (700) |
| `~/.ssh/` | SSH keys | `drwx------` (700) |
| `~/.ssh/id_rsa` | Private SSH key | `-rw-------` (600) |

</div>

<div class="mt-4 p-3 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Never manually edit /etc/passwd or /etc/shadow!</strong> Use proper commands.
</div>

---
layout: default
---

# Common Mistakes to Avoid

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Permission Mistakes
- `chmod 777` on everything
- Forgetting execute bit on directories
- Wrong ownership on web files
- SUID on shell scripts
- World-readable private keys
- Overly permissive sudo access

</div>

<div>

### User Management Mistakes
- Sharing root password
- Not using `sudo`
- Forgetting to delete old users
- Wrong primary group
- No password policy
- Not locking unused accounts
- Hardcoding UIDs in scripts

</div>

</div>

---
layout: default
---

# Week 2 Action Items

<div class="text-sm">

### ✅ Before Next Lecture
1. Read **Chapter 6** of "The Linux Command Line" (Permissions)
2. Practice permission commands on your VM
3. Create test users and groups
4. Experiment with SUID, SGID, sticky bit

### ✅ For Lab This Week
1. Complete **Lab 2: User Management**
2. Set up multi-user environment
3. Configure shared directories
4. Test permission scenarios
5. Debug permission issues

### 📝 Practice Exercises
- Find all SUID files on your system
- Create a shared project directory with proper permissions
- Set up sudo access for a new user

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="text-8xl mb-8">
❓
</div>

Understanding permissions is crucial for system security!

<div class="mt-8">

**Next Week:** Process Management & Systemd ⚙️

</div>

---
layout: end
class: text-center
---

# Thank You!

<div class="text-6xl mb-8">
🔐
</div>

**Remember:** Proper permissions = Secure systems

<div class="mt-8 text-sm opacity-75">
CSS 262 - Linux Administration & *nix Systems for Cybersecurity
</div>
