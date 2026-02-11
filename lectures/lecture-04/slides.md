---
theme: default
background: https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 4
  Linux Administration & *nix Systems for Cybersecurity
  
  Storage, Filesystems & LVM
drawings:
  persist: false
transition: slide-left
title: 'Lecture 4: Storage, Filesystems & LVM'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Storage, Filesystems & LVM

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 4: Mastering Storage & Filesystems
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

### Part 1: Storage Fundamentals
- Storage hierarchy overview
- Block devices & partitions
- Partition tables (MBR vs GPT)
- Disk management tools
- Device naming conventions

</div>

<div>

### Part 2: Filesystems & LVM
- Filesystem types & features
- Creating & mounting filesystems
- `/etc/fstab` configuration
- LVM architecture & benefits
- LVM operations & best practices

</div>

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🎯 <strong>Learning Objective:</strong> Understand Linux storage stack and implement flexible storage management with LVM.
</div>

---
layout: default
---

# 🔄 Quick Recap: Week 3

<v-clicks>

### Process Management & Systemd

- **Processes**: Fundamental execution units, managed via signals & priorities
- **Process States**: Running, sleeping, stopped, zombie
- **Key Tools**: `ps`, `top`, `htop`, `kill`, `nice`, `renice`
- **Systemd**: Modern init system and service manager
- **Unit Files**: Service definitions with dependencies & restart policies
- **journalctl**: Centralized logging system

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ You should now be comfortable managing processes and creating systemd services!
</div>

---
layout: section
---

# Part 1: Storage Fundamentals
## Understanding the Linux Storage Stack

---
layout: default
---

# 🗄️ The Storage Hierarchy

<div class="text-sm">

```mermaid
graph TD
    A[Physical Disk /dev/sda] --> B[Partition Table]
    B --> C1[/dev/sda1]
    B --> C2[/dev/sda2]
    C1 --> D1[Filesystem ext4]
    C2 --> D2[LVM PV]
    D2 --> E[Volume Group vg0]
    E --> F1[LV lv_root]
    E --> F2[LV lv_home]
    F1 --> G1[ext4 /]
    F2 --> G2[xfs /home]
```

</div>

---
layout: default
---

# 🔍 Block Devices

<div class="text-sm">

Block devices are accessed in fixed-size blocks and allow random access.

### Device Naming Conventions

| Type | Naming | Example |
|------|--------|---------|
| SATA/SCSI | `/dev/sd[a-z]` | `/dev/sda` |
| NVMe | `/dev/nvme[0-9]n[0-9]` | `/dev/nvme0n1` |
| Virtual | `/dev/vd[a-z]` | `/dev/vda` |
| LVM | `/dev/mapper/` | `/dev/mapper/vg0-lv` |

### View Block Devices

```bash
lsblk        # Tree view
lsblk -f     # Show filesystems
```

</div>

---
layout: default
---

# 💾 Partition Tables: MBR vs GPT

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### MBR (Master Boot Record)
**Legacy (1983)**

<v-clicks>

**Characteristics:**
- Maximum 4 primary partitions
- Extended partitions for more logical partitions
- Max disk size: 2 TB
- 32-bit sector addressing
- Boot code in first sector

**Limitations:**
- ❌ Small partition table
- ❌ No redundancy
- ❌ Limited disk size
- ❌ No partition names

</v-clicks>

</div>

<div>

### GPT (GUID Partition Table)
**Modern (2000s)**

<v-clicks>

**Characteristics:**
- Up to 128 partitions (standard)
- Max disk size: 9.4 ZB
- 64-bit sector addressing
- CRC32 checksums for integrity
- Backup partition table at end

**Advantages:**
- ✅ Large disk support
- ✅ Redundant partition table
- ✅ Partition names & GUIDs
- ✅ Future-proof design

</v-clicks>

</div>

</div>

---
layout: default
---

# 🛠️ Partitioning Tools

<div class="text-sm">

### Command-Line Tools

<v-clicks>

#### `fdisk` - Classic partition editor (MBR focus)
```bash
fdisk /dev/sda          # Interactive mode
fdisk -l                # List all partitions
fdisk -l /dev/sda       # List partitions on specific disk
```

#### `gdisk` - GPT disk partitioner
```bash
gdisk /dev/sda          # Interactive GPT mode
```

#### `parted` - Advanced partitioner (MBR & GPT)
```bash
parted /dev/sda print   # Show partition table
parted /dev/sda mklabel gpt              # Create GPT table
parted /dev/sda mkpart primary ext4 1MiB 100%  # Create partition
```

</v-clicks>

</div>

<div v-click class="mt-4 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Warning:</strong> Partitioning operations can destroy data! Always backup before making changes.
</div>

---
layout: default
---

# 📝 Practical: Creating Partitions

<div class="text-sm">

### Example: Create a new partition with `fdisk`

```bash
# Start fdisk
sudo fdisk /dev/sdb

# Commands within fdisk:
Command: n      # New partition
Partition: 1
First sector: [Enter]
Last sector: +10G

Command: t      # Change type
Hex code: 8e    # Linux LVM

Command: w      # Write changes
```

### After Creating Partition

```bash
sudo partprobe /dev/sdb  # Inform kernel
lsblk /dev/sdb           # Verify
```

</div>

---
layout: section
---

# Part 2: Filesystems
## Organizing Data on Storage

---
layout: default
---

# 🗂️ What is a Filesystem?

<v-clicks>

A filesystem is a method of organizing and storing files on storage devices.

### Key Functions:
- **Data Organization**: Files, directories, metadata
- **Space Management**: Track free and used blocks
- **Access Control**: Permissions and ownership
- **Integrity**: Journaling, checksums, error detection
- **Performance**: Caching, buffering, optimization

### Filesystem Components:
- **Superblock**: Filesystem metadata (size, type, state)
- **Inodes**: File metadata (owner, permissions, timestamps)
- **Data Blocks**: Actual file content
- **Directory Entries**: Filename to inode mapping

</v-clicks>

---
layout: default
---

# 📊 Linux Filesystem Types

<div class="text-sm">

| Filesystem | Type | Key Features | Use Cases |
|------------|------|--------------|-----------|
| **ext4** | Journaling | Mature, stable, widely supported | General purpose, root partition |
| **XFS** | Journaling | High performance, large files | Databases, media servers |
| **Btrfs** | Copy-on-Write | Snapshots, compression, RAID | Advanced features, snapshots |
| **F2FS** | Log-structured | Flash-optimized | SSDs, embedded systems |
| **NTFS** | Proprietary | Windows compatibility | Cross-platform storage |
| **FAT32/exFAT** | Simple | Universal compatibility | USB drives, SD cards |
| **ZFS** | Copy-on-Write | Enterprise features, integrity | High-end storage, NAS |

</div>

<div class="mt-4 grid grid-cols-2 gap-4 text-xs">

<div v-click class="p-2 bg-green-500 bg-opacity-20 rounded">
✅ <strong>Most Common:</strong> ext4 (default), XFS (performance), Btrfs (features)
</div>

<div v-click class="p-2 bg-blue-500 bg-opacity-20 rounded">
💡 <strong>Tip:</strong> Choose based on workload: ext4 for general, XFS for large files, Btrfs for snapshots
</div>

</div>

---
layout: default
---

# 🏗️ Creating Filesystems

<div class="text-sm">

### General Syntax: `mkfs.<type>`

<v-clicks>

```bash
# Create ext4 filesystem
sudo mkfs.ext4 /dev/sdb1

# Create ext4 with custom options
sudo mkfs.ext4 -L mydata -N 1000000 /dev/sdb1
# -L: Set volume label
# -N: Number of inodes

# Create XFS filesystem
sudo mkfs.xfs /dev/sdb1

# Create XFS with label
sudo mkfs.xfs -L backup /dev/sdb1

# Create Btrfs filesystem
sudo mkfs.btrfs /dev/sdb1

# Check filesystem after creation
sudo file -s /dev/sdb1
sudo blkid /dev/sdb1
```

</v-clicks>

</div>

<div v-click class="mt-4 p-2 bg-red-500 bg-opacity-20 rounded text-sm">
🚨 <strong>Caution:</strong> <code>mkfs</code> destroys all data on the partition! Double-check the device name!
</div>

---
layout: default
---

# 🔗 Mounting Filesystems

<div class="text-sm">

**Mounting** attaches a filesystem to the directory tree.

### Manual Mounting

```bash
sudo mkdir -p /mnt/mydata
sudo mount /dev/sdb1 /mnt/mydata
df -h /mnt/mydata
sudo umount /mnt/mydata
```

### Mount Options

```bash
# Read-only
sudo mount -o ro /dev/sdb1 /mnt/mydata

# Security options
sudo mount -o noexec,nosuid /dev/sdb1 /mnt/mydata
```

</div>

---
layout: default
class: compact-slide
---

# ⚙️ `/etc/fstab`

<div class="text-xs mt--4">

```text
# <device>    <mount> <type> <options> <dump> <pass>
UUID=xxx-yyy  /       ext4   defaults  0      1
```

</div>

---
layout: default
---

# 🔑 UUID vs Device Names

<div class="text-sm">

<v-clicks>

### Why Use UUIDs?

**Device names** (`/dev/sda1`) can change between reboots!
- Adding/removing drives
- Different boot order
- Driver load sequence

**UUIDs** (Universally Unique Identifiers) are persistent and unique.

### Finding UUIDs

```bash
# Method 1: blkid command
sudo blkid

# Method 2: lsblk with filesystem info
lsblk -f

# Method 3: By UUID directory
ls -l /dev/disk/by-uuid/

# Get specific device UUID
sudo blkid -s UUID -o value /dev/sdb1
```

</v-clicks>

</div>

---
layout: default
---

# 📝 Practical: Setting Up `/etc/fstab`

<div class="text-sm">

### Step-by-Step Example

```bash
# Get UUID
UUID=$(sudo blkid -s UUID -o value /dev/sdb1)

# Create mount point
sudo mkdir -p /mnt/mydata

# Add to /etc/fstab
echo "UUID=$UUID /mnt/mydata ext4 defaults 0 2" | \
  sudo tee -a /etc/fstab

# Test without rebooting
sudo mount -a

# Verify
df -h /mnt/mydata
```

</div>

<div class="mt-4 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Important:</strong> Always test with <code>mount -a</code> before rebooting! Errors in fstab can prevent boot.
</div>

---
layout: default
---

# 🔧 Common Mount Options

<div class="text-sm grid grid-cols-2 gap-4">

<div>

### General Options
- `defaults`: Standard options (rw, suid, dev, exec, auto, nouser, async)
- `ro` / `rw`: Read-only / Read-write
- `auto` / `noauto`: Mount at boot / Don't mount automatically
- `user` / `nouser`: Allow user mounts / Root only
- `nofail`: Don't fail boot if device missing

### Security Options
- `noexec`: Prevent binary execution
- `nosuid`: Ignore setuid/setgid bits
- `nodev`: Don't interpret block/char devices

</div>

<div>

### Performance Options
- `noatime`: Don't update access time (faster)
- `nodiratime`: Don't update directory access time
- `relatime`: Update atime only if older than mtime
- `async` / `sync`: Async I/O / Sync I/O

### Example Combinations
```text
# Web server data
defaults,noatime,noexec,nosuid

# User home directories
defaults,nodev,nosuid

# Backup drive (optional)
defaults,nofail,noatime
```

</div>

</div>

---
layout: section
---

# Part 3: Logical Volume Management (LVM)
## Flexible Storage Management

---
layout: default
---

# 🎯 What is LVM?

<v-clicks>

**LVM (Logical Volume Manager)** provides an abstraction layer between physical storage and filesystems.

### Traditional Partitioning Problems:
- ❌ Fixed partition sizes
- ❌ Difficult to resize
- ❌ Can't span multiple disks easily
- ❌ No snapshots

### LVM Benefits:
- ✅ Dynamic volume resizing (online!)
- ✅ Combine multiple disks into one volume
- ✅ Easy snapshots for backups
- ✅ Volume migration between disks
- ✅ Thin provisioning

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
💡 <strong>Real World:</strong> LVM is standard in enterprise environments and modern Linux distributions.
</div>

---
layout: default
---

# 🏗️ LVM Architecture

<div class="text-xs">

```mermaid
graph TD
    A[/dev/sda] --> PV1[PV sda2]
    B[/dev/sdb] --> PV2[PV sdb1]
    PV1 --> VG[VG vg0]
    PV2 --> VG
    VG --> LV1[lv_root 20G]
    VG --> LV2[lv_home 50G]
    LV1 --> FS1[ext4 /]
    LV2 --> FS2[xfs /home]
```

</div>

---
layout: default
---

# 📦 LVM Components Explained

<div class="text-sm">

### Physical Volumes (PV)
- Physical disk/partition prepared for LVM
- Divided into **Physical Extents (PE)** (4 MB chunks)
- Commands: `pvcreate`, `pvs`

### Volume Groups (VG)
- Pool of physical volumes
- Commands: `vgcreate`, `vgs`

### Logical Volumes (LV)
- Virtual partitions from VG
- Can span PVs, resize, snapshot
- Commands: `lvcreate`, `lvs`

</div>

---
layout: default
---

# 🔨 Creating LVM: Step-by-Step

<div class="text-sm">

### 1. Create Physical Volumes

```bash
# Prepare partitions or disks for LVM
sudo pvcreate /dev/sdb1
sudo pvcreate /dev/sdc1

# Verify
sudo pvs
sudo pvdisplay
```

### 2. Create Volume Group

```bash
# Create VG from multiple PVs
sudo vgcreate vg_data /dev/sdb1 /dev/sdc1

# Verify
sudo vgs
sudo vgdisplay vg_data
```

</div>

---
layout: default
---

# 🔨 Creating LVM: Step-by-Step (cont.)

<div class="text-sm">

### 3. Create Logical Volumes

```bash
# Create LV with specific size
sudo lvcreate -L 50G -n lv_database vg_data

# Create LV with percentage of VG
sudo lvcreate -l 100%FREE -n lv_backups vg_data

# Verify
sudo lvs
sudo lvdisplay vg_data/lv_database
```

### 4. Create Filesystem and Mount

```bash
# Create filesystem on LV
sudo mkfs.ext4 /dev/vg_data/lv_database

# Mount it
sudo mkdir -p /mnt/database
sudo mount /dev/vg_data/lv_database /mnt/database

# Add to /etc/fstab for persistence
echo "/dev/vg_data/lv_database /mnt/database ext4 defaults 0 2" | sudo tee -a /etc/fstab
```

</div>

---
layout: default
---

# 📏 Resizing Logical Volumes

<div class="text-sm">

### Extending a Logical Volume (Growing)

```bash
# Extend LV by 10 GB
sudo lvextend -L +10G /dev/vg_data/lv_database

# Resize filesystem (ext4)
sudo resize2fs /dev/vg_data/lv_database

# For XFS
sudo xfs_growfs /mnt/database

# Combined: extend + resize
sudo lvextend -r -L +10G /dev/vg_data/lv_database
```

### Requirements:
- ✅ VG must have free space
- ✅ Can be done while mounted!

</div>

---
layout: default
---

# 📉 Shrinking Logical Volumes

<div class="text-sm">

### Reducing a Logical Volume (Shrinking)

```bash
sudo umount /mnt/database
sudo e2fsck -f /dev/vg_data/lv_database
sudo resize2fs /dev/vg_data/lv_database 40G
sudo lvreduce -L 40G /dev/vg_data/lv_database
sudo mount /dev/vg_data/lv_database /mnt/database
```

</div>

<div class="mt-2 p-2 bg-red-500 bg-opacity-20 rounded text-xs">
🚨 <strong>Warning:</strong> Shrinking is dangerous! Backup first, unmount, check filesystem, shrink filesystem before LV. XFS does NOT support shrinking!
</div>

---
layout: default
---

# 📸 LVM Snapshots

<div class="text-sm">

Snapshots create point-in-time copies of logical volumes.

### Creating & Using Snapshots

```bash
# Create snapshot
sudo lvcreate -L 5G -s -n lv_db_snap /dev/vg_data/lv_database

# Mount and backup
sudo mkdir -p /mnt/snapshot
sudo mount /dev/vg_data/lv_db_snap /mnt/snapshot
sudo tar czf backup.tar.gz -C /mnt/snapshot .

# Cleanup
sudo umount /mnt/snapshot
sudo lvremove /dev/vg_data/lv_db_snap
```

</div>

---
layout: default
---

# 📊 LVM Information Commands

<div class="text-sm grid grid-cols-2 gap-4">

<div>

### Quick Status Commands
```bash
# Physical Volumes
pvs                 # Summary
pvdisplay          # Detailed
pvdisplay /dev/sdb1  # Specific PV

# Volume Groups
vgs                 # Summary
vgdisplay          # Detailed
vgdisplay vg_data  # Specific VG

# Logical Volumes
lvs                 # Summary
lvdisplay          # Detailed
lvdisplay vg_data/lv_database
```

</div>

<div>

### Advanced Information
```bash
# Show LV with more details
lvs -o +lv_size,lv_path,devices

# Show VG free space
vgs -o +vg_free,vg_size

# Show PV allocation
pvs -o +pv_used,pv_free

# Full system overview
sudo lsblk
sudo lsblk -f
```

</div>

</div>

<div class="mt-4 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
💡 <strong>Tip:</strong> Add these to aliases: <code>alias lvss='sudo lvs -o +lv_size,devices'</code>
</div>

---
layout: default
---

# 🔧 Advanced LVM Operations

<div class="text-sm">

### Extending Volume Groups

```bash
sudo pvcreate /dev/sdd1
sudo vgextend vg_data /dev/sdd1
sudo vgs vg_data
```

### Moving Data Between PVs

```bash
sudo pvmove /dev/sdb1 /dev/sdd1
sudo vgreduce vg_data /dev/sdb1
sudo pvremove /dev/sdb1
```

### Renaming Volumes

```bash
sudo lvrename vg_data old_name new_name
sudo vgrename old_vg new_vg
```

</div>

---
layout: default
---

# 🛡️ Storage Security Best Practices

<div class="text-sm">

### Mount Options for Security
```bash
# Uploads directory
/dev/vg_web/lv_uploads /var/www/uploads ext4 noexec,nosuid 0 2
```

### Encryption with LUKS
```bash
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup open /dev/sdb1 encrypted_disk
sudo pvcreate /dev/mapper/encrypted_disk
```

### Regular Backups & Monitoring
- Use LVM snapshots for consistent backups
- Monitor: `df -h`, `lvs`, `vgs`
- Check errors: `dmesg | grep -i error`

</div>

---
layout: default
---

# 🏗️ Practical Lab Exercise

<div class="text-sm">

### Scenario: Set up LVM for a web server

```bash
# Prepare disks
sudo pvcreate /dev/sdb1 /dev/sdc1
sudo vgcreate vg_webserver /dev/sdb1 /dev/sdc1

# Create logical volumes
sudo lvcreate -L 20G -n lv_www vg_webserver
sudo lvcreate -L 30G -n lv_mysql vg_webserver
sudo lvcreate -L 10G -n lv_logs vg_webserver

# Create filesystems
sudo mkfs.ext4 /dev/vg_webserver/lv_www
sudo mkfs.ext4 /dev/vg_webserver/lv_mysql
sudo mkfs.ext4 /dev/vg_webserver/lv_logs

# Mount
sudo mkdir -p /var/www /var/lib/mysql /var/log/apps
sudo mount /dev/vg_webserver/lv_www /var/www
sudo mount /dev/vg_webserver/lv_mysql /var/lib/mysql
sudo mount /dev/vg_webserver/lv_logs /var/log/apps
```

</div>

---
layout: default
---

# 🔍 Troubleshooting Storage Issues

<div class="text-sm grid grid-cols-2 gap-4">

<div>

### Common Issues

**Disk Full**
```bash
sudo du -sh /* | sort -rh | head
sudo journalctl --vacuum-size=100M
```

**Mount Failures**
```bash
sudo mount -a
sudo fsck /dev/sdb1
```

</div>

<div>

**LVM Issues**
```bash
sudo vgchange -ay vg_data
sudo pvscan
sudo vgscan
sudo lvscan
```

**Performance**
```bash
iostat -x 1 5
iotop
```

</div>

</div>

---
layout: default
---

# 📚 Summary: Storage & Filesystems

<div class="text-sm">

<v-clicks>

### Key Concepts Covered

1. **Storage Hierarchy**: Physical disks → Partitions → Filesystems
2. **Partition Tables**: MBR (legacy) vs GPT (modern)
3. **Tools**: `fdisk`, `gdisk`, `parted`, `lsblk`
4. **Filesystems**: ext4, XFS, Btrfs - choose based on use case
5. **Mounting**: Manual (`mount`) and persistent (`/etc/fstab`)
6. **UUIDs**: Preferred over device names for stability

### LVM Benefits

- ✅ Flexible volume sizing (grow/shrink)
- ✅ Combine multiple disks
- ✅ Snapshots for backups
- ✅ Online operations
- ✅ Industry standard

</v-clicks>

</div>

---
layout: default
---

# 🎯 Learning Objectives: Did We Achieve?

<v-clicks>

### By now, you should be able to:

- ✅ Understand Linux storage stack architecture
- ✅ Create and manage partitions with various tools
- ✅ Choose appropriate filesystem for different use cases
- ✅ Create filesystems and configure persistent mounts
- ✅ Explain LVM architecture (PV, VG, LV)
- ✅ Create and manage logical volumes
- ✅ Resize volumes and create snapshots
- ✅ Apply security best practices to storage
- ✅ Troubleshoot common storage issues

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
🎓 <strong>Next Week:</strong> Bash Scripting & Automation - Automate all the things!
</div>

---
layout: default
---

# 🔗 Additional Resources

<div class="text-sm">

### Documentation
- [LVM HOWTO](https://tldp.org/HOWTO/LVM-HOWTO/) - Comprehensive guide
- [Red Hat Storage Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/managing_storage_devices/)
- [Arch Wiki: LVM](https://wiki.archlinux.org/title/LVM)

### Books & Tools
- *"Linux Administration Handbook"* - Storage chapter
- `man lvm`, `man fstab`, `man mkfs`

### Practice
- Set up VMs with multiple disks
- Experiment with LVM resizing

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="pt-12 text-xl">
Next: Bash Scripting & Automation
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/yourusername/css262" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>
