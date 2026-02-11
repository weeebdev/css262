# Lecture 4: Storage, Filesystems & LVM

## Overview

This lecture covers the Linux storage stack, from physical disks to filesystems and logical volume management. Students will learn how to manage storage effectively, create flexible volume layouts with LVM, and apply security best practices.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Understand the Linux storage hierarchy (disks → partitions → filesystems)
2. Differentiate between MBR and GPT partition tables
3. Create and manage partitions using `fdisk`, `gdisk`, and `parted`
4. Choose appropriate filesystems for different use cases
5. Create, format, and mount filesystems
6. Configure persistent mounts using `/etc/fstab`
7. Explain LVM architecture and benefits
8. Create and manage Physical Volumes, Volume Groups, and Logical Volumes
9. Resize logical volumes online
10. Create and use LVM snapshots for backups
11. Apply security best practices to storage management

## Topics Covered

### Part 1: Storage Fundamentals

#### 1.1 Storage Hierarchy
- Physical disks (HDD, SSD, NVMe)
- Partitions as logical divisions
- Filesystems for data organization
- LVM abstraction layer

#### 1.2 Block Devices
- Device naming conventions (`/dev/sd*`, `/dev/nvme*`, `/dev/vd*`)
- Viewing block devices with `lsblk`
- Understanding device files in `/dev/`

#### 1.3 Partition Tables
- **MBR (Master Boot Record)**
  - Legacy standard from 1983
  - Maximum 4 primary partitions
  - 2 TB disk size limit
  - Extended partitions for more logical partitions
- **GPT (GUID Partition Table)**
  - Modern standard (UEFI)
  - Up to 128 partitions
  - 9.4 ZB disk size support
  - Redundant partition table with CRC checksums

#### 1.4 Partitioning Tools
- `fdisk` - Classic partition editor (best for MBR)
- `gdisk` - GPT-focused partitioner
- `parted` - Advanced partitioner supporting both MBR and GPT

### Part 2: Filesystems

#### 2.1 Filesystem Concepts
- Purpose and functions of filesystems
- Components: superblock, inodes, data blocks, directory entries
- Journaling for crash recovery

#### 2.2 Common Linux Filesystems

| Filesystem | Key Features | Best For |
|------------|--------------|----------|
| **ext4** | Mature, stable, widely supported, journaling | General purpose, root partition, default choice |
| **XFS** | High performance, large files, excellent scalability | Databases, media servers, large files |
| **Btrfs** | Copy-on-write, built-in snapshots, compression, RAID | Advanced features, snapshots, modern systems |
| **F2FS** | Flash-optimized, log-structured | SSDs, flash storage, embedded systems |
| **ZFS** | Enterprise features, data integrity, snapshots | High-end storage, NAS, data centers |
| **FAT32/exFAT** | Universal compatibility, simple | USB drives, SD cards, cross-platform |

#### 2.3 Creating Filesystems

```bash
# ext4 - Most common
sudo mkfs.ext4 /dev/sdb1
sudo mkfs.ext4 -L mydata /dev/sdb1  # With label

# XFS - High performance
sudo mkfs.xfs /dev/sdb1
sudo mkfs.xfs -L backup /dev/sdb1

# Btrfs - Advanced features
sudo mkfs.btrfs /dev/sdb1
```

#### 2.4 Mounting Filesystems

**Manual Mounting:**
```bash
sudo mkdir -p /mnt/mydata
sudo mount /dev/sdb1 /mnt/mydata
sudo umount /mnt/mydata
```

**Persistent Mounting** (`/etc/fstab`):
```
# <device>                      <mount point>  <type>  <options>      <dump> <pass>
UUID=xxxx-xxxx-xxxx-xxxx        /mnt/data      ext4    defaults       0      2
/dev/mapper/vg0-lv_home         /home          xfs     defaults       0      2
```

**Important Mount Options:**
- `defaults` - Standard options (rw, suid, dev, exec, auto, nouser, async)
- `noexec` - Prevent binary execution (security)
- `nosuid` - Ignore setuid/setgid bits (security)
- `nodev` - Don't interpret block/char devices (security)
- `noatime` - Don't update access time (performance)
- `nofail` - Don't fail boot if device missing (removable media)

#### 2.5 UUID Best Practices

Always use UUIDs in `/etc/fstab` instead of device names:
- Device names (`/dev/sda1`) can change between reboots
- UUIDs are persistent and unique
- Find UUIDs: `sudo blkid` or `lsblk -f`

### Part 3: Logical Volume Management (LVM)

#### 3.1 Why LVM?

**Traditional Partitioning Problems:**
- Fixed partition sizes
- Difficult to resize
- Cannot easily span multiple disks
- No snapshot capability

**LVM Benefits:**
- ✅ Dynamic volume resizing (online!)
- ✅ Combine multiple disks into single volume
- ✅ Easy snapshots for backups
- ✅ Volume migration between disks
- ✅ Thin provisioning
- ✅ Industry standard in enterprise

#### 3.2 LVM Architecture

Three-layer model:

1. **Physical Volumes (PV)**
   - Physical disks or partitions prepared for LVM
   - Divided into Physical Extents (PE) - typically 4 MB chunks
   - Commands: `pvcreate`, `pvdisplay`, `pvs`, `pvremove`

2. **Volume Groups (VG)**
   - Pool of one or more physical volumes
   - Provides shared storage pool
   - Commands: `vgcreate`, `vgextend`, `vgdisplay`, `vgs`

3. **Logical Volumes (LV)**
   - Virtual partitions carved from VG
   - Can span multiple PVs
   - Can be resized, moved, snapshotted
   - Commands: `lvcreate`, `lvextend`, `lvreduce`, `lvdisplay`, `lvs`

#### 3.3 Creating LVM Setup

**Complete Example:**

```bash
# 1. Create Physical Volumes
sudo pvcreate /dev/sdb1
sudo pvcreate /dev/sdc1

# 2. Create Volume Group
sudo vgcreate vg_data /dev/sdb1 /dev/sdc1

# 3. Create Logical Volumes
sudo lvcreate -L 50G -n lv_database vg_data      # Fixed size
sudo lvcreate -l 100%FREE -n lv_backups vg_data  # Use all remaining space

# 4. Create Filesystem
sudo mkfs.ext4 /dev/vg_data/lv_database

# 5. Mount
sudo mkdir -p /mnt/database
sudo mount /dev/vg_data/lv_database /mnt/database

# 6. Add to /etc/fstab
echo "/dev/vg_data/lv_database /mnt/database ext4 defaults 0 2" | sudo tee -a /etc/fstab
```

#### 3.4 Resizing Logical Volumes

**Extending (Growing):**
```bash
# Extend LV by 10 GB
sudo lvextend -L +10G /dev/vg_data/lv_database

# Resize filesystem (ext4)
sudo resize2fs /dev/vg_data/lv_database

# For XFS
sudo xfs_growfs /mnt/database

# Combined (extend LV and resize filesystem)
sudo lvextend -r -L +10G /dev/vg_data/lv_database
```

**Requirements for extending:**
- Volume group must have free space
- Can be done online (while mounted) for ext4 and XFS

**Reducing (Shrinking):**
```bash
# MUST unmount first!
sudo umount /mnt/database

# Check filesystem
sudo e2fsck -f /dev/vg_data/lv_database

# Resize filesystem FIRST
sudo resize2fs /dev/vg_data/lv_database 40G

# Then reduce LV
sudo lvreduce -L 40G /dev/vg_data/lv_database

# Remount
sudo mount /dev/vg_data/lv_database /mnt/database
```

**⚠️ Warning:** XFS does NOT support shrinking!

#### 3.5 LVM Snapshots

Snapshots create point-in-time copies for backups:

```bash
# Create snapshot (allocate space for changes)
sudo lvcreate -L 5G -s -n lv_database_snap /dev/vg_data/lv_database

# Mount snapshot
sudo mkdir -p /mnt/snapshot
sudo mount /dev/vg_data/lv_database_snap /mnt/snapshot

# Backup from snapshot
sudo tar czf /backup/database_backup.tar.gz -C /mnt/snapshot .

# Remove snapshot when done
sudo umount /mnt/snapshot
sudo lvremove /dev/vg_data/lv_database_snap
```

**Snapshot Benefits:**
- Consistent backups without downtime
- Quick creation (copy-on-write)
- Can test changes safely

#### 3.6 Advanced LVM Operations

**Extending Volume Groups:**
```bash
# Add new disk to VG
sudo pvcreate /dev/sdd1
sudo vgextend vg_data /dev/sdd1
```

**Moving Data Between Disks:**
```bash
# Move extents from old to new disk
sudo pvmove /dev/sdb1 /dev/sdd1

# Remove old disk from VG
sudo vgreduce vg_data /dev/sdb1
sudo pvremove /dev/sdb1
```

**Renaming:**
```bash
# Rename LV
sudo lvrename vg_data old_name new_name

# Rename VG
sudo vgrename old_vg new_vg
```

### Part 4: Security Best Practices

#### 4.1 Secure Mount Options

```bash
# Web uploads directory - prevent execution
/dev/vg_web/lv_uploads /var/www/uploads ext4 noexec,nosuid,nodev 0 2

# User home directories
/dev/vg_data/lv_home /home xfs nosuid,nodev 0 2

# Temporary directory
tmpfs /tmp tmpfs noexec,nosuid,nodev,size=2G 0 0
```

#### 4.2 Encryption with LUKS

```bash
# Encrypt partition
sudo cryptsetup luksFormat /dev/sdb1

# Open encrypted partition
sudo cryptsetup open /dev/sdb1 encrypted_disk

# Use with LVM
sudo pvcreate /dev/mapper/encrypted_disk
sudo vgcreate vg_secure /dev/mapper/encrypted_disk
```

#### 4.3 Monitoring and Maintenance

```bash
# Monitor disk space
df -h
sudo lvs
sudo vgs

# Check for filesystem errors
dmesg | grep -i error
sudo smartctl -a /dev/sda  # SMART monitoring

# I/O statistics
iostat -x 1
iotop
```

## Practical Exercises

### Exercise 1: Basic LVM Setup

Set up a three-volume system for a web server:

1. Create PV from `/dev/sdb1` and `/dev/sdc1`
2. Create VG named `vg_webserver`
3. Create three LVs:
   - `lv_www` (20 GB) for web content
   - `lv_mysql` (30 GB) for database
   - `lv_logs` (10 GB) for logs
4. Format all with ext4
5. Mount at appropriate locations
6. Add to `/etc/fstab` with security options

### Exercise 2: LVM Snapshots

1. Create a test LV with some data
2. Create a snapshot
3. Modify data on original LV
4. Mount snapshot and verify original data intact
5. Practice restoring from snapshot

### Exercise 3: Volume Resizing

1. Create an LV that's "too small"
2. Fill it with data
3. Extend it online
4. Verify filesystem is accessible throughout

## Troubleshooting Guide

### Common Issues and Solutions

**Problem:** Mount fails at boot
```bash
# Check fstab syntax
sudo mount -a

# Add nofail option for non-critical mounts
# UUID=xxx /mnt/backup ext4 defaults,nofail 0 2
```

**Problem:** LVM volumes not detected
```bash
# Scan for LVM components
sudo pvscan
sudo vgscan
sudo lvscan

# Activate volume group
sudo vgchange -ay vg_name
```

**Problem:** Disk full
```bash
# Find largest files
sudo du -sh /* | sort -rh | head -10
find / -type f -size +100M 2>/dev/null

# Clean journal logs
sudo journalctl --vacuum-size=100M

# Clean package cache (Debian/Ubuntu)
sudo apt clean
```

**Problem:** Filesystem corruption
```bash
# Unmount first!
sudo umount /dev/sdb1

# Check and repair
sudo fsck /dev/sdb1

# Force check on next boot
sudo touch /forcefsck
sudo reboot
```

## Key Commands Reference

### Disk and Partition Management
```bash
lsblk                    # List block devices
lsblk -f                 # Show filesystems
fdisk -l                 # List all partitions
fdisk /dev/sdb           # Partition disk (interactive)
parted /dev/sdb print    # Show partition table
partprobe                # Update kernel partition table
```

### Filesystem Operations
```bash
mkfs.ext4 /dev/sdb1              # Create ext4 filesystem
mkfs.xfs /dev/sdb1               # Create XFS filesystem
mount /dev/sdb1 /mnt/data        # Mount filesystem
umount /mnt/data                 # Unmount filesystem
mount -a                         # Mount all in fstab
blkid                            # Show UUIDs
tune2fs -l /dev/sdb1             # Show ext4 info
xfs_info /dev/sdb1               # Show XFS info
```

### LVM Commands
```bash
# Physical Volumes
pvcreate /dev/sdb1
pvdisplay
pvs
pvremove /dev/sdb1

# Volume Groups
vgcreate vg_name /dev/sdb1 /dev/sdc1
vgextend vg_name /dev/sdd1
vgreduce vg_name /dev/sdb1
vgdisplay
vgs

# Logical Volumes
lvcreate -L 10G -n lv_name vg_name
lvextend -L +5G /dev/vg_name/lv_name
lvreduce -L 10G /dev/vg_name/lv_name
lvdisplay
lvs
lvremove /dev/vg_name/lv_name

# Snapshots
lvcreate -L 5G -s -n snap_name /dev/vg_name/lv_name

# Filesystem Resize
resize2fs /dev/vg_name/lv_name   # ext4
xfs_growfs /mount/point          # XFS
```

## Additional Resources

### Official Documentation
- [LVM HOWTO](https://tldp.org/HOWTO/LVM-HOWTO/) - Comprehensive LVM guide
- [Red Hat Storage Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/managing_storage_devices/)
- [Arch Wiki: LVM](https://wiki.archlinux.org/title/LVM)
- [Ubuntu LVM Guide](https://ubuntu.com/server/docs/logical-volume-management)

### Filesystem Documentation
- [ext4 Wiki](https://ext4.wiki.kernel.org/)
- [XFS FAQ](https://xfs.wiki.kernel.org/)
- [Btrfs Wiki](https://btrfs.wiki.kernel.org/)

### Books
- *"Linux Administration Handbook"* by Evi Nemeth et al. - Chapter on Storage
- *"UNIX and Linux System Administration Handbook"* - Storage management section
- *"Linux Bible"* by Christopher Negus - Storage chapters

### Online Tutorials
- [Digital Ocean: LVM Tutorial](https://www.digitalocean.com/community/tutorials/an-introduction-to-lvm-concepts-terminology-and-operations)
- [Linux.com: LVM Administration](https://www.linux.com/training-tutorials/how-manage-lvm-logical-volume-management/)
- [Red Hat: Storage Management](https://www.redhat.com/sysadmin/topics/storage)

### Practice Labs
- Use VirtualBox/VMware with multiple virtual disks
- Try GNS3 for complex storage scenarios
- Practice on cloud instances (AWS EBS, Azure Disks)

## Questions for Review

1. What are the advantages of GPT over MBR partition tables?
2. Why should you use UUIDs instead of device names in `/etc/fstab`?
3. What filesystem would you choose for a database server and why?
4. Explain the three layers of LVM architecture.
5. How do you safely shrink a logical volume?
6. What mount options would you use for a user upload directory?
7. How do LVM snapshots work, and when would you use them?
8. What's the difference between `lvextend` with and without the `-r` flag?
9. How can you add a new disk to an existing volume group?
10. Why is it important to run `fsck` on an unmounted filesystem?

## Lab Assignment Ideas

1. **Storage Setup**: Configure a multi-tier storage system with LVM
2. **Backup Script**: Create a script using LVM snapshots for consistent backups
3. **Performance Comparison**: Compare ext4, XFS, and Btrfs performance
4. **Disaster Recovery**: Practice recovering from various storage failures
5. **Security Hardening**: Implement secure mount options across a system

---

**Instructor Notes:**
- Emphasize the importance of backups before any storage operations
- Demonstrate live resizing to show LVM's power
- Use real-world scenarios (database growth, log management)
- Warn about XFS not supporting shrinking
- Show recovery procedures for common mistakes
- Discuss enterprise use cases (VMware datastores, cloud storage)
