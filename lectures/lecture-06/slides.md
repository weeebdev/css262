---
theme: default
background: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## CSS 262 - Lecture 6
  Linux Administration & *nix Systems for Cybersecurity

  Linux Networking Basics
drawings:
  persist: false
transition: slide-left
title: 'Lecture 6: Linux Networking Basics'
mdc: true
css: unocss
---

<style src="../style.css"></style>

# CSS 262: Linux Administration
## Linux Networking Basics

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Lecture 6: IP, DNS & Network Configuration
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

### Part 1: Networking Fundamentals
- TCP/IP stack overview
- Network interfaces & naming
- IP addressing (IPv4 & IPv6)
- Subnets & CIDR notation

</div>

<div>

### Part 2: Configuration & Tools
- Static IP configuration
- NetworkManager & nmcli
- Netplan (Ubuntu)
- DNS configuration

</div>

</div>

<div class="grid grid-cols-2 gap-6 text-sm mt-2">

<div>

### Part 3: Troubleshooting
- Connectivity testing
- Routing & ARP
- Network diagnostics
- Security considerations

</div>

<div>

### Part 4: Lab Focus
- Lab 6: IP & DNS Config
- Homework 2 submission
- Reliable connectivity setup

</div>

</div>

<div class="mt-2 p-2 bg-blue-500 bg-opacity-20 rounded text-sm">
🎯 <strong>Learning Objective:</strong> Configure robust network settings (Static IP, DNS) to ensure reliable connectivity.
</div>

---
layout: default
---

# 🔄 Quick Recap: Week 5

<v-clicks>

### Bash Scripting & Automation

- **Scripts**: Shebang, variables, control flow, functions
- **Text Processing**: `grep`, `sed`, `awk`, pipelines
- **Automation**: Cron jobs, systemd timers
- **Best Practices**: Strict mode, quoting, security
- **Real-world**: Log analysis, backups, health checks

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
✅ You should now be able to automate system tasks with Bash scripts!
</div>

---
layout: section
---

# Part 1: Networking Fundamentals
## Understanding the TCP/IP Stack

---
layout: default
---

# 🌐 The TCP/IP Model

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

**Layers (top → bottom):**
1. Application — HTTP, SSH, DNS, SMTP
2. Transport — TCP/UDP, ports (22, 80, 443)
3. Internet — IP addresses, routing
4. Network Access — MAC, Ethernet/WiFi

</div>

<div class="flex items-center">

```mermaid
graph LR
    A[App] --> B[Transport]
    B --> C[IP]
    C --> D[Link]
```

</div>

</div>

---
layout: default
---

# 🔌 Network Interfaces

<div class="text-sm">

<v-clicks>

### Interface Naming Conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| `eth` | Ethernet (legacy) | `eth0`, `eth1` |
| `en` | Ethernet (predictable) | `enp0s3`, `ens33` |
| `wlan` | Wireless | `wlan0` |
| `lo` | Loopback | `lo` (127.0.0.1) |
| `virbr` | Virtual bridge | `virbr0` |

### View Interfaces

```bash
ip link show
ip addr show
# Legacy (deprecated)
ifconfig
```

</v-clicks>

</div>

---
layout: default
---

# 📍 IP Addressing Basics

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### IPv4 (32-bit)

```text
192.168.1.100
   │   │   │ └── Host
   │   │   └──── Subnet
   │   └──────── Network
   └──────────── Class/Region
```

### Private Ranges (RFC 1918)

| Range | Use |
|-------|-----|
| 10.0.0.0/8 | Large networks |
| 172.16.0.0/12 | Medium networks |
| 192.168.0.0/16 | Home/Small |

</div>

<div>

### IPv6 (128-bit)

```text
2001:0db8:85a3::8a2e:0370:7334
```

### CIDR Notation

```text
192.168.1.0/24  → 256 addresses
192.168.1.0/25  → 128 addresses
10.0.0.0/8      → 16M addresses
```

### Key Addresses

- **Gateway**: Router (e.g., 192.168.1.1)
- **Broadcast**: 192.168.1.255 (for /24)
- **Loopback**: 127.0.0.1 (localhost)

</div>

</div>

---
layout: default
---

# 🔀 Subnets & CIDR

<div class="text-sm">

<v-clicks>

### Subnet Mask → CIDR

| Mask | CIDR | Hosts |
|------|------|-------|
| 255.255.255.0 | /24 | 254 |
| 255.255.255.128 | /25 | 126 |
| 255.255.0.0 | /16 | 65,534 |
| 255.0.0.0 | /8 | 16M |

### Example: 192.168.1.100/24

- **Network**: 192.168.1.0 · **Broadcast**: 192.168.1.255
- **Usable**: 192.168.1.1 - 192.168.1.254 · **Gateway**: 192.168.1.1

</v-clicks>

</div>

---
layout: section
---

# Part 2: Configuration & Tools
## Static IP, DNS & NetworkManager

---
layout: default
---

# ⚙️ The `ip` Command (Modern)

<div class="text-sm">

<v-clicks>

### View & Manage Interfaces

```bash
# List all interfaces
ip link show
ip addr show
ip a

# Add/remove IP address
sudo ip addr add 192.168.1.100/24 dev eth0
sudo ip addr del 192.168.1.100/24 dev eth0

# Bring interface up/down
sudo ip link set eth0 up
sudo ip link set eth0 down
```

### Routing

```bash
ip route show
ip route add default via 192.168.1.1
```

</v-clicks>

</div>

<div v-click class="mt-2 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm">
⚠️ <strong>Note:</strong> <code>ip</code> changes are temporary — they reset on reboot. Use config files for persistence.
</div>

---
layout: default
---

# 📡 NetworkManager & nmcli

<div class="text-sm">

<v-clicks>

### NetworkManager

- Default on most modern Linux (Ubuntu, Fedora, RHEL)
- Handles wired, wireless, VPN
- Persistent configuration

### nmcli — Command-Line Interface

```bash
# List connections
nmcli connection show

# Show device status
nmcli device status

# Add static IP connection
nmcli connection add type ethernet con-name "Static-LAN" \
  ifname eth0 ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 ipv4.dns "8.8.8.8 8.8.4.4" \
  ipv4.method manual
```

</v-clicks>

</div>

---
layout: default
---

# 📡 nmcli: Modify & Activate

<div class="text-sm">

<v-clicks>

### Modify Existing Connection

```bash
# Change to static IP
nmcli connection modify "Static-LAN" ipv4.addresses 192.168.1.100/24
nmcli connection modify "Static-LAN" ipv4.gateway 192.168.1.1
nmcli connection modify "Static-LAN" ipv4.dns "8.8.8.8 8.8.4.4"
nmcli connection modify "Static-LAN" ipv4.method manual

# Or DHCP
nmcli connection modify "Static-LAN" ipv4.method auto
```

### Activate Connection

```bash
nmcli connection up "Static-LAN"
nmcli connection down "Static-LAN"
```

### Interactive TUI

```bash
nmtui
```

</v-clicks>

</div>

---
layout: default
---

# 📄 Netplan (Ubuntu 18.04+)

<div class="text-sm">

<v-clicks>

### YAML Configuration

Netplan reads `/etc/netplan/*.yaml` and generates config for NetworkManager or systemd-networkd.

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

### Apply Changes

```bash
sudo netplan apply
sudo netplan try   # Rollback if connection lost
```

</v-clicks>

</div>

---
layout: default
---

# 📄 Netplan: DHCP Example

<div class="text-sm">

### DHCP Configuration

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
      dhcp4-overrides:
        use-dns: true
        use-routes: true
```

### Multiple Interfaces

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      addresses:
        - 10.0.0.10/24
      gateway4: 10.0.0.1
```

</div>

---
layout: default
---

# 🌐 DNS Configuration

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### What is DNS?

- **Domain Name System**: Resolves hostnames → IP
- **Example**: `google.com` → `142.250.185.46`

### Configuration Files

```bash
# Primary config
/etc/resolv.conf

# Example content:
nameserver 8.8.8.8
nameserver 8.8.4.4
search example.local
```

### systemd-resolved (Modern)

```bash
# Often manages resolv.conf
ls -l /etc/resolv.conf   # May be symlink
resolvectl status
```

</div>

<div>

### Testing DNS

```bash
# Resolve hostname
nslookup google.com
dig google.com
host google.com

# Using getent
getent hosts google.com
```

### Common Public DNS

| Provider | Primary | Secondary |
|----------|---------|-----------|
| Google | 8.8.8.8 | 8.8.4.4 |
| Cloudflare | 1.1.1.1 | 1.0.0.1 |
| Quad9 | 9.9.9.9 | 149.112.112.112 |

</div>

</div>

---
layout: default
---

# 📝 Traditional Config: Debian/Ubuntu

<div class="text-sm">

### `/etc/network/interfaces` (legacy, ifupdown)

```text
# Loopback
auto lo
iface lo inet loopback

# Static IP
auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4

# DHCP
iface eth0 inet dhcp
```

### Apply

```bash
sudo systemctl restart networking
# Or
sudo ifup eth0
sudo ifdown eth0
```

</div>

---
layout: section
---

# Part 3: Troubleshooting
## Connectivity & Diagnostics

---
layout: default
---

# 🔍 Connectivity Testing

<div class="text-sm">

<v-clicks>

### ping — Test Reachability

```bash
ping -c 4 8.8.8.8
ping -c 4 google.com
ping -c 4 192.168.1.1
```

### traceroute — Path Discovery

```bash
traceroute google.com
traceroute -n 8.8.8.8   # No DNS lookup
# Or
tracepath google.com
```

### Check Port Connectivity

```bash
nc -zv 192.168.1.1 22    # Test SSH port
telnet 192.168.1.1 80    # Test HTTP (if installed)
curl -v http://example.com
```

</v-clicks>

</div>

---
layout: default
---

# 📊 Network Diagnostics

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### View Current Config

```bash
ip addr show
ip route show
ip link show
```

### ARP Table

```bash
ip neigh show
arp -a
```

### Listening Ports

```bash
ss -tuln
netstat -tuln
```

</div>

<div>

### DNS Resolution

```bash
dig google.com
dig @8.8.8.8 google.com
nslookup google.com
```

### Packet Capture (Advanced)

```bash
sudo tcpdump -i eth0 -c 10
sudo tcpdump -i eth0 port 22
```

### Network Speed Test

```bash
iperf3 -s    # Server
iperf3 -c server_ip  # Client
```

</div>

</div>

---
layout: default
---

# 🛣️ Routing

<div class="text-sm">

<v-clicks>

### Default Route

```bash
# Show default gateway
ip route show default
route -n

# Add default route (temporary)
sudo ip route add default via 192.168.1.1
```

### Static Routes

```bash
# Add route to specific network
sudo ip route add 10.0.0.0/8 via 192.168.1.254

# Delete route
sudo ip route del 10.0.0.0/8
```

### Routing Table

```bash
ip route show
# default via 192.168.1.1 dev eth0
# 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100
```

</v-clicks>

</div>

---
layout: default
---

# 🔧 Troubleshooting Flowchart

<div class="text-sm">

**Decision flow:**
1. Can't reach internet → Can you `ping` gateway?
2. No → Check IP config, cable, interface
3. Yes → Can you `ping 8.8.8.8`?
4. No → Check routing, firewall
5. Yes → Can you resolve `google.com`?
6. No → Check DNS config
7. Yes → Connectivity OK ✓

</div>

---
layout: default
---

# 🔧 Troubleshooting: Quick Checks

<div class="text-sm">

1. `ip addr` — Do I have an IP?
2. `ping <gateway>` — Is gateway reachable?
3. `ping 8.8.8.8` — Is internet reachable?
4. `ping google.com` — Is DNS working?

</div>

---
layout: default
---

# 🛡️ Network Security Basics

<div class="text-sm grid grid-cols-2 gap-4">

<div>

<v-clicks>

### Server Hardening

- **Minimize listening services**: `ss -tuln`
- **Disable unused interfaces**
- **Use static IPs** for servers (predictable)
- **Restrict SSH** to specific IPs (later weeks)

### DNS Security

- Use trusted DNS (avoid MITM)
- Consider DNS over HTTPS (DoH)
- Validate certificates: `openssl s_client`

</v-clicks>

</div>

<div>

<v-clicks>

### Information Disclosure

```bash
# Don't expose internal hostnames
# Use /etc/hosts for internal resolution
echo "192.168.1.10  internal-db" >> /etc/hosts
```

### Network Namespaces (Advanced)

- Isolate network per process
- Used by containers (Docker)

</v-clicks>

</div>

</div>

---
layout: default
---

# 📊 Summary: Linux Networking

<div class="grid grid-cols-2 gap-4 text-sm">

<div>

### Key Concepts Covered

1. **TCP/IP Stack**: Layers, ports, IPs
2. **Interfaces**: Naming, `ip link`, `ip addr`
3. **IP Addressing**: IPv4, CIDR, private ranges
4. **Configuration**: nmcli, Netplan, interfaces
5. **DNS**: resolv.conf, resolution tools
6. **Troubleshooting**: ping, traceroute, ss
7. **Routing**: Default gateway, static routes

</div>

<div>

### Configuration Tools by Distro

| Distro | Tool |
|--------|------|
| Ubuntu 18+ | Netplan |
| Fedora/RHEL | nmcli / NetworkManager |
| Debian (legacy) | /etc/network/interfaces |
| Arch | systemd-networkd / NetworkManager |

</div>

</div>

---
layout: default
---

# 🎯 Learning Objectives: Did We Achieve?

<v-clicks>

### By now, you should be able to:

- ✅ Explain the TCP/IP stack and interface naming
- ✅ Configure static IP addresses
- ✅ Use nmcli and Netplan for network config
- ✅ Configure DNS resolution
- ✅ Troubleshoot connectivity (ping, traceroute)
- ✅ View routing tables and ARP
- ✅ Apply basic network security practices

</v-clicks>

<div v-click class="mt-4 p-2 bg-green-500 bg-opacity-20 rounded text-sm">
🎓 <strong>Next Week:</strong> Package Management & Repositories — Software compilation, Lab 7, Quiz 1!
</div>

---
layout: default
---

# 🧪 Lab Practice: IP & DNS Config

<div class="text-sm">

### Exercise 1: Static IP
Configure VM with static IP (192.168.1.100/24), gateway, DNS. Verify with `ip addr`, `ping`, `nslookup`.

### Exercise 2: Dual interface
Add second interface (NAT + Host-only). Configure one DHCP, one static. Test both.

### Exercise 3: DNS troubleshooting
Break DNS (wrong nameserver), diagnose with `dig`/`nslookup`, fix and verify.

### Exercise 4: Connectivity script
Script checks: interface, route, ping gateway, ping 8.8.8.8, DNS. Output one-line status per check.

</div>

---
layout: default
---

# 🔗 Additional Resources

<div class="text-sm">

### Documentation
- [ip(8) man page](https://man7.org/linux/man-pages/man8/ip.8.html) - Full ip command reference
- [Netplan documentation](https://netplan.io/) - Ubuntu network config
- [NetworkManager nmcli](https://networkmanager.dev/docs/api/latest/nmcli.html) - nmcli reference

### Books & Guides
- *"UNIX and Linux System Administration Handbook"* - Networking chapter
- [Arch Wiki: Network configuration](https://wiki.archlinux.org/title/Network_configuration)
- [Red Hat: Configuring network connections](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_and_managing_networking/)

### Practice
- Set up a lab with multiple VMs and static IPs
- Practice netplan/nmcli on different distros

</div>

---
layout: center
class: text-center
---

# Questions?

<div class="pt-12 text-xl">
Next: Package Management & Repositories
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/yourusername/css262" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>
