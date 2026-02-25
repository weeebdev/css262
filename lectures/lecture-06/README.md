# Lecture 6: Linux Networking Basics

## Overview

This lecture introduces Linux networking fundamentals, focusing on configuring robust network settings for reliable connectivity. Students learn the TCP/IP stack, interface management, static IP and DNS configuration, and essential troubleshooting techniques. By the end, students can configure and diagnose network connectivity on Linux servers—a critical skill for cybersecurity and system administration.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain the TCP/IP model and its layers
2. Identify network interfaces and understand naming conventions
3. Understand IPv4 addressing, subnets, and CIDR notation
4. Configure static IP addresses using nmcli, Netplan, or traditional config files
5. Configure DNS resolution
6. Use the `ip` command for interface and routing management
7. Troubleshoot connectivity with ping, traceroute, and diagnostic tools
8. View and interpret routing tables and ARP cache
9. Apply basic network security practices
10. Set up reliable connectivity for Lab 6 and Homework 2

## Topics Covered

### Part 1: Networking Fundamentals

#### 1.1 The TCP/IP Model

- **Application Layer**: HTTP, SSH, DNS, SMTP
- **Transport Layer**: TCP (reliable) and UDP (connectionless); ports (22=SSH, 80=HTTP, 443=HTTPS)
- **Internet Layer**: IP addresses, routing
- **Network Access Layer**: MAC addresses, Ethernet frames

#### 1.2 Network Interfaces

**Naming Conventions (systemd/predictable):**

| Prefix | Meaning | Example |
|--------|---------|---------|
| `eth` | Ethernet (legacy) | `eth0`, `eth1` |
| `en` | Ethernet | `enp0s3`, `ens33` |
| `wlan` | Wireless | `wlan0` |
| `lo` | Loopback | `lo` (127.0.0.1) |
| `virbr` | Virtual bridge | `virbr0` |

**Viewing Interfaces:**
```bash
ip link show
ip addr show
ip a
# Legacy (deprecated)
ifconfig
```

#### 1.3 IP Addressing

**IPv4 (32-bit):**
- Format: `A.B.C.D` (e.g., 192.168.1.100)
- Private ranges (RFC 1918):
  - 10.0.0.0/8 — Large networks
  - 172.16.0.0/12 — Medium networks
  - 192.168.0.0/16 — Home/small networks

**IPv6 (128-bit):**
- Format: `2001:0db8:85a3::8a2e:0370:7334`

**CIDR Notation:**
- `/24` = 255.255.255.0 → 256 addresses (254 usable)
- `/25` = 128 addresses
- `/16` = 65,536 addresses

**Key Addresses:**
- **Gateway**: Router (e.g., 192.168.1.1)
- **Broadcast**: 192.168.1.255 (for /24)
- **Loopback**: 127.0.0.1

### Part 2: Configuration & Tools

#### 2.1 The `ip` Command (Modern Replacement for ifconfig)

```bash
# List interfaces
ip link show
ip addr show

# Add/remove IP (temporary)
sudo ip addr add 192.168.1.100/24 dev eth0
sudo ip addr del 192.168.1.100/24 dev eth0

# Bring interface up/down
sudo ip link set eth0 up
sudo ip link set eth0 down

# Routing
ip route show
sudo ip route add default via 192.168.1.1
```

**Note:** `ip` changes are temporary—they reset on reboot. Use configuration files for persistence.

#### 2.2 NetworkManager & nmcli

NetworkManager is the default on Ubuntu, Fedora, RHEL, and most modern distros.

**Add static connection:**
```bash
nmcli connection add type ethernet con-name "Static-LAN" \
  ifname eth0 ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 ipv4.dns "8.8.8.8 8.8.4.4" \
  ipv4.method manual
```

**Modify connection:**
```bash
nmcli connection modify "Static-LAN" ipv4.addresses 192.168.1.100/24
nmcli connection modify "Static-LAN" ipv4.gateway 192.168.1.1
nmcli connection modify "Static-LAN" ipv4.dns "8.8.8.8 8.8.4.4"
nmcli connection modify "Static-LAN" ipv4.method manual

# Or switch to DHCP
nmcli connection modify "Static-LAN" ipv4.method auto
```

**Activate:**
```bash
nmcli connection up "Static-LAN"
nmcli connection down "Static-LAN"
```

**Interactive TUI:**
```bash
nmtui
```

#### 2.3 Netplan (Ubuntu 18.04+)

Netplan reads `/etc/netplan/*.yaml` and generates config for NetworkManager or systemd-networkd.

**Static IP:**
```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    enp0s3:
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

**DHCP:**
```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
```

**Apply:**
```bash
sudo netplan apply
sudo netplan try   # Rollback if connection lost (useful over SSH)
```

#### 2.4 Traditional Config: /etc/network/interfaces (Debian/Ubuntu legacy)

```text
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

```bash
sudo systemctl restart networking
# Or: sudo ifup eth0
```

#### 2.5 DNS Configuration

**Primary config:** `/etc/resolv.conf`
```text
nameserver 8.8.8.8
nameserver 8.8.4.4
search example.local
```

**Note:** On systems using systemd-resolved, `/etc/resolv.conf` may be a symlink. Use `resolvectl status` to inspect.

**Testing DNS:**
```bash
nslookup google.com
dig google.com
host google.com
getent hosts google.com
```

**Common Public DNS:**
| Provider | Primary | Secondary |
|----------|---------|-----------|
| Google | 8.8.8.8 | 8.8.4.4 |
| Cloudflare | 1.1.1.1 | 1.0.0.1 |
| Quad9 | 9.9.9.9 | 149.112.112.112 |

### Part 3: Troubleshooting

#### 3.1 Connectivity Testing

```bash
# Test reachability
ping -c 4 8.8.8.8
ping -c 4 google.com
ping -c 4 192.168.1.1

# Path discovery
traceroute google.com
tracepath google.com

# Port connectivity
nc -zv 192.168.1.1 22
curl -v http://example.com
```

#### 3.2 Diagnostic Commands

```bash
# Current config
ip addr show
ip route show
ip link show

# ARP table
ip neigh show
arp -a

# Listening ports
ss -tuln
netstat -tuln

# DNS
dig google.com
dig @8.8.8.8 google.com

# Packet capture (advanced)
sudo tcpdump -i eth0 -c 10
sudo tcpdump -i eth0 port 22
```

#### 3.3 Troubleshooting Flow

1. **Do I have an IP?** → `ip addr`
2. **Is gateway reachable?** → `ping <gateway>`
3. **Is internet reachable?** → `ping 8.8.8.8`
4. **Is DNS working?** → `ping google.com` or `nslookup google.com`

#### 3.4 Routing

```bash
# Show default gateway
ip route show default
route -n

# Add default route (temporary)
sudo ip route add default via 192.168.1.1

# Add static route
sudo ip route add 10.0.0.0/8 via 192.168.1.254

# Delete route
sudo ip route del 10.0.0.0/8
```

### Part 4: Security Considerations

- **Minimize listening services**: Use `ss -tuln` to audit
- **Use static IPs for servers**: Predictable, easier to firewall
- **Trusted DNS**: Avoid MITM; consider DNS over HTTPS
- **Internal resolution**: Use `/etc/hosts` for internal hostnames
- **Restrict SSH**: Will be covered in Week 9 (SSH Hardening)

## Practical Exercises

### Exercise 1: Static IP Configuration

1. Identify your primary network interface (`ip link`)
2. Configure a static IP (e.g., 192.168.1.100/24) using nmcli or Netplan
3. Set gateway (192.168.1.1) and DNS (8.8.8.8)
4. Verify with `ip addr`, `ping 8.8.8.8`, `nslookup google.com`

### Exercise 2: Dual Interface Setup

1. Add a second network adapter to your VM (e.g., Host-only)
2. Configure one interface for DHCP (NAT), one for static (Host-only)
3. Test connectivity on both networks
4. Document which interface serves which network

### Exercise 3: DNS Troubleshooting

1. Temporarily set a wrong nameserver in resolv.conf or Netplan
2. Use `dig`, `nslookup` to diagnose
3. Restore correct DNS and verify

### Exercise 4: Connectivity Report Script

Write a Bash script that:
1. Lists interface status (up/down, IP)
2. Shows default route
3. Pings gateway
4. Pings 8.8.8.8
5. Resolves google.com via DNS
6. Outputs a one-line status (OK/FAIL) for each check

## Troubleshooting Guide

### Common Issues and Solutions

**Problem:** No IP address after config change
```bash
# Check interface is up
ip link set eth0 up

# Restart NetworkManager
sudo systemctl restart NetworkManager

# For Netplan
sudo netplan apply
```

**Problem:** Can ping IP but not hostname
```bash
# Check DNS
cat /etc/resolv.conf
dig google.com

# Fix DNS in your config (nmcli, Netplan, or interfaces)
```

**Problem:** Netplan apply breaks SSH connection
```bash
# Use netplan try instead — it rolls back if you don't confirm
sudo netplan try
# You have ~120 seconds to verify; press Enter to keep, Ctrl+C to rollback
```

**Problem:** Interface name changed after reboot
```bash
# Use predictable naming; check with:
ip link show
# Or use MAC address in Netplan for stable binding
```

## Key Commands Reference

### Interface Management
```bash
ip link show
ip addr show
ip addr add 192.168.1.100/24 dev eth0
ip link set eth0 up
```

### NetworkManager
```bash
nmcli connection show
nmcli device status
nmcli connection up "Static-LAN"
nmtui
```

### Netplan
```bash
sudo netplan apply
sudo netplan try
```

### Troubleshooting
```bash
ping -c 4 8.8.8.8
traceroute google.com
ip route show
ip neigh show
ss -tuln
dig google.com
```

## Additional Resources

### Official Documentation
- [ip(8) man page](https://man7.org/linux/man-pages/man8/ip.8.html)
- [Netplan documentation](https://netplan.io/)
- [NetworkManager nmcli](https://networkmanager.dev/docs/api/latest/nmcli.html)

### Books & Guides
- *"UNIX and Linux System Administration Handbook"* — Networking chapter
- [Arch Wiki: Network configuration](https://wiki.archlinux.org/title/Network_configuration)
- [Red Hat: Configuring network connections](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_and_managing_networking/)

### Practice
- Set up a lab with multiple VMs and static IPs
- Practice Netplan and nmcli on Ubuntu and Fedora

## Questions for Review

1. What is the difference between `ip` and `ifconfig`? Why prefer `ip`?
2. Explain CIDR notation. What does /24 mean?
3. How do you make network configuration persistent across reboots?
4. What is the purpose of the default gateway?
5. How would you troubleshoot "can ping 8.8.8.8 but not google.com"?
6. What are the private IPv4 ranges (RFC 1918)?
7. How does Netplan differ from /etc/network/interfaces?
8. What does `nmcli connection modify` do vs `nmcli connection up`?
9. How do you add a static route?
10. Why use static IPs for servers instead of DHCP?

## Lab Assignment Ideas

1. **Static IP Setup**: Configure a server with static IP, gateway, and DNS; document the process
2. **Multi-Network VM**: Configure a VM with two interfaces (NAT + Host-only) for different purposes
3. **Connectivity Script**: Bash script that generates a network health report
4. **DNS Comparison**: Compare resolution times for different DNS providers (dig with timing)
5. **Troubleshooting Scenario**: Instructor breaks network config; students diagnose and fix

---

**Instructor Notes:**
- Emphasize CLO 3: Configure robust network settings for reliable connectivity
- Lab 6: IP & DNS Config — align exercises with lab requirements
- Homework 2 is due this week — ensure students understand static IP and DNS for automated grading
- Use live demos: nmcli, Netplan, and troubleshooting flow
- Warn about `netplan apply` over SSH — prefer `netplan try` when possible
- Connect to future topics: firewall (Week 10) will need predictable network config
