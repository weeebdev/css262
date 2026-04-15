# Lecture 12: Containerization (Docker)

## Overview

This lecture introduces Linux containers and the Docker toolchain. Students learn the kernel mechanisms that make containers possible (namespaces, cgroups), how to build and manage Docker images, run and orchestrate containers, and — critically — how to evaluate and harden the container attack surface. The security angle is woven throughout: every feature is paired with its corresponding risk and mitigation.

## Learning Objectives

By the end of this lecture, students should be able to:

1. Explain how Linux namespaces provide process isolation for containers
2. Explain how cgroups enforce CPU and memory limits on containers
3. Distinguish containers from virtual machines in terms of isolation model and performance
4. Write a Dockerfile using security best practices (non-root user, pinned base image, multi-stage build)
5. Build, tag, push, and pull Docker images
6. Run containers with resource limits, capability restrictions, and read-only filesystems
7. Use Docker volumes for persistent storage
8. Define multi-container applications with Docker Compose
9. Scan images for known CVEs using Trivy
10. Identify and mitigate common container security risks (Docker socket, secrets in images, privileged mode)

## Topics Covered

### Part 1: Container Fundamentals

#### 1.1 VMs vs Containers

| Dimension | Virtual Machine | Container |
|-----------|----------------|-----------|
| Kernel | Own kernel per VM | Shares host kernel |
| Startup | Minutes | Milliseconds |
| Size | GBs | MBs |
| Isolation | Strong (separate kernel) | Weaker (same kernel) |
| Overhead | High | Low |

**Security implication:** A kernel vulnerability affects all containers on the host simultaneously. VMs are safer for workloads that require strong isolation boundaries.

#### 1.2 Linux Namespaces

Namespaces are the kernel feature that gives each container its own isolated view of the system:

| Namespace | What It Isolates |
|-----------|-----------------|
| `pid` | Process IDs — PID 1 inside is not init on the host |
| `net` | Network interfaces, routing tables, firewall rules |
| `mnt` | Filesystem mount points |
| `uts` | Hostname and NIS domain name |
| `ipc` | SysV IPC and POSIX message queues |
| `user` | UID/GID mappings (enables rootless containers) |
| `cgroup` | cgroup root view |

```bash
# List all namespaces on the host
lsns

# See which namespaces a container process is in
ls -la /proc/$(docker inspect --format '{{.State.Pid}}' mycontainer)/ns/
```

#### 1.3 Control Groups (cgroups)

cgroups limit the resources a process group can consume. Docker creates a cgroup per container.

```bash
# Limit memory and CPU at runtime
docker run -m 512m --cpus="1.0" myapp

# View container cgroups
ls /sys/fs/cgroup/memory/docker/
```

**Always set resource limits in production.** Without them, a runaway or compromised container can exhaust host resources and crash all services.

---

### Part 2: Docker Images & Registry

#### 2.1 Images and Layers

A Docker image is a read-only, layered filesystem built from a Dockerfile. Each instruction (`RUN`, `COPY`, `ADD`) adds a layer. Layers are cached and shared between images — this is why layer ordering matters for build performance.

**Image naming:**
```
registry/repository:tag

docker.io/library/nginx:1.25.3
ghcr.io/myorg/myapp:v2.1.0
192.168.1.100:5000/internal/api:staging
```

**Never rely on `latest` in production.** It is just a tag, not a guarantee of recency or stability.

#### 2.2 Dockerfile

```dockerfile
# Always pin to a specific tag
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies first — maximize cache hits
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create and switch to non-root user
RUN useradd -r -u 1001 appuser
USER appuser

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key best practices:**
- Pin base image versions
- Copy `requirements.txt` before source code (cache optimization)
- Run as a non-root user
- Use `--no-cache-dir` to reduce image size

#### 2.3 Multi-Stage Builds

Multi-stage builds produce a lean final image by separating the build environment from the runtime environment:

```dockerfile
# Stage 1: Build (has compiler, dev tools, large)
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN go build -o server .

# Stage 2: Runtime (minimal, no compiler)
FROM gcr.io/distroless/base
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

Benefits:
- Final image is 10–100x smaller
- Build tools (compilers, package managers) are not present in the final image
- Smaller attack surface and faster vulnerability scans

#### 2.4 Image Commands

```bash
docker build -t myapp:v1.0 .              # Build image
docker build -f Dockerfile.prod -t myapp:prod .   # Alternate Dockerfile
docker images                              # List local images
docker pull nginx:1.25                     # Pull from registry
docker push myorg/myapp:v1.0              # Push to registry
docker history myapp:v1.0 --no-trunc     # View layers (check for secrets!)
docker inspect myapp:v1.0                # Full metadata
docker image rm myapp:v1.0               # Remove image
```

---

### Part 3: Running & Managing Containers

#### 3.1 `docker run` Options

```bash
docker run -d nginx                         # Detached (background)
docker run -d --name webserver nginx        # Named container
docker run -d -p 8080:80 nginx             # Port mapping host:container
docker run -d -e MYSQL_ROOT_PASSWORD=s mysql:8   # Environment variable
docker run -it ubuntu bash                  # Interactive shell
docker run --rm ubuntu echo "hello"         # Remove when done
docker run -d -v mydata:/app/data nginx     # Named volume
docker run -d -v /host/path:/container/path nginx  # Bind mount
```

#### 3.2 Container Lifecycle

```bash
docker ps                   # Running containers
docker ps -a                # All containers (including stopped)
docker stop webserver       # Graceful stop (SIGTERM)
docker start webserver      # Start stopped container
docker restart webserver    # Stop + start
docker rm webserver         # Remove stopped container
docker rm -f webserver      # Force remove running container
docker logs -f webserver    # Follow logs
docker exec -it webserver bash   # Shell inside container
docker stats                # Live resource usage
docker top webserver        # Processes inside container
docker diff webserver       # Changes from image baseline
```

#### 3.3 Volumes

| Type | Command | Use Case |
|------|---------|----------|
| Named volume | `-v mydata:/path` | Databases, persistent state |
| Bind mount | `-v /host/path:/path` | Config files, dev code |
| tmpfs | `--tmpfs /tmp` | Secrets in RAM (ephemeral) |

```bash
docker volume create mydata
docker volume ls
docker volume inspect mydata
docker volume prune          # Remove unused volumes
```

#### 3.4 Networking

```bash
docker network ls                               # List networks
docker network create mynet                     # Custom bridge network
docker run -d --name db --network mynet postgres:15
docker run -d --name app --network mynet myapp  # Resolves 'db' by name!
docker network inspect mynet
```

Containers on the same user-defined network resolve each other by container name via Docker's built-in DNS. The default bridge network does NOT support DNS resolution by name.

#### 3.5 Docker Compose

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secret
    restart: unless-stopped
  app:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:secret@db/appdb
    restart: unless-stopped
volumes:
  pgdata:
```

```bash
docker compose up -d          # Start all services
docker compose down           # Stop and remove containers (keep volumes)
docker compose down -v        # Also remove volumes
docker compose logs -f app    # Follow service logs
docker compose ps             # Status of services
```

---

### Part 4: Container Security

#### 4.1 Threat Model

| Threat | Description |
|--------|-------------|
| Vulnerable base image | Unpatched CVEs in OS packages |
| Root inside container | UID 0 maps to host root without user namespaces |
| Privileged containers | `--privileged` disables almost all isolation |
| Docker socket exposure | Mounting `/var/run/docker.sock` = root on host |
| Secrets in images | Env vars, `RUN` commands visible in `docker history` |
| Excess capabilities | Linux capabilities retained unnecessarily |

#### 4.2 Hardened `docker run`

```bash
docker run -d \
  --user 1001:1001 \              # Non-root UID
  --read-only \                    # Immutable root filesystem
  --tmpfs /tmp \                   # Writable RAM-backed /tmp
  --cap-drop ALL \                 # Drop all capabilities
  --cap-add NET_BIND_SERVICE \     # Add back only what's needed
  --security-opt no-new-privileges \  # Block SUID escalation
  -m 256m --cpus="0.5" \          # Resource limits
  myapp
```

#### 4.3 The Docker Socket

```bash
ls -la /var/run/docker.sock
# srw-rw---- 1 root docker 0 ...
```

The Docker daemon socket is owned by root. Members of the `docker` group can use it — **this is equivalent to passwordless sudo**. Never mount the socket inside a container. Never add untrusted users to the `docker` group.

#### 4.4 Rootless Docker

Rootless mode runs the Docker daemon as an unprivileged user. Container root maps to the user's UID on the host via user namespaces:

```bash
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
systemctl --user enable --now docker
```

#### 4.5 Image Scanning with Trivy

```bash
# Scan an image for CVEs
trivy image nginx:latest
trivy image --severity HIGH,CRITICAL python:3.10

# Scan Dockerfile for misconfigurations
trivy config Dockerfile

# JSON output for CI/CD integration
trivy image -f json -o results.json myapp:v1.0
```

Integrate Trivy in CI pipelines and fail the build on HIGH/CRITICAL findings.

#### 4.6 Secrets Management

**Never:**
- Hardcode secrets in Dockerfiles (`ENV DB_PASSWORD=...`)
- Pass secrets in `RUN` commands (visible in `docker history`)

**Instead:**
- Pass at runtime: `docker run -e DB_PASSWORD="$DB_PASSWORD" myapp`
- Use Docker secrets (Swarm): `docker secret create` + `--secret` flag
- Mount a secrets file: `-v /run/secrets:/run/secrets:ro`
- Use a dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager)

---

## Key Commands Reference

```bash
# Images
docker build -t name:tag .
docker pull image:tag
docker push image:tag
docker images
docker history image:tag --no-trunc
docker inspect image:tag

# Containers
docker run -d -p host:container --name name image
docker ps [-a]
docker logs [-f] name
docker exec -it name bash
docker stop / start / restart / rm name
docker stats
docker inspect name

# Volumes & Networks
docker volume create / ls / inspect / prune
docker network create / ls / inspect

# Compose
docker compose up -d / down / logs / ps

# Security
trivy image name:tag
docker run --cap-drop ALL --read-only --user 1001 --security-opt no-new-privileges name
```

---

## Practical Exercises

### Exercise 1: Build & Run a Container
1. Write a Dockerfile for a Python Flask app (or use the provided skeleton).
2. Build the image: `docker build -t myflask:v1 .`
3. Run it: `docker run -d -p 5000:5000 --name flask myflask:v1`
4. Verify: `curl localhost:5000`
5. View logs: `docker logs flask`

### Exercise 2: Security Hardening
1. Modify the container from Ex 1 to run with: `--user 1001`, `--read-only`, `--cap-drop ALL`, `-m 256m`.
2. If the app writes to disk, add `--tmpfs /tmp`.
3. Confirm the app still responds correctly.

### Exercise 3: Image Scanning
1. Pull `python:3.10` and `python:3.11-slim`.
2. Scan both with Trivy: `trivy image --severity HIGH,CRITICAL python:3.10`
3. Compare CVE counts. Which base image is safer? Why?
4. Scan your own Dockerfile with `trivy config Dockerfile`.

### Exercise 4: Docker Compose
1. Write `docker-compose.yml` with a web service and a `postgres:15` database on a custom network.
2. The DB should use a named volume.
3. Start with `docker compose up -d`.
4. Verify with `docker compose ps` and `docker compose logs`.
5. Stop and verify the volume persists: `docker compose down && docker compose up -d`.

### Exercise 5: Rootless Docker
1. Install rootless Docker on your VM.
2. Set `DOCKER_HOST` and run `docker run hello-world`.
3. Verify the daemon process is running as your user (not root) with `ps aux | grep dockerd`.

---

## Troubleshooting Guide

**Container exits immediately:**
```bash
docker logs mycontainer    # Check for error output
docker run -it myimage sh  # Override entrypoint for debugging
```

**Port already in use:**
```bash
ss -tlnp | grep 8080       # Find what's using the port
docker ps                  # Check if another container has that port
```

**Permission denied in container:**
```bash
# If running as non-root, check file ownership in the image
docker run --rm myimage ls -la /app
# Fix by setting correct ownership in Dockerfile
RUN chown -R 1001:1001 /app
```

**Volume data not persisting:**
```bash
# Named volumes persist; make sure you're using -v myname:/path not -v ./path:/path
docker volume ls           # Confirm the named volume exists
docker inspect mycontainer # Check "Mounts" section
```

---

## Questions for Review

1. What is the difference between a Docker image and a container?
2. Which Linux kernel features underpin container isolation?
3. Why does the order of instructions in a Dockerfile affect build speed?
4. What security risk does `--privileged` introduce?
5. Why is adding a user to the `docker` group equivalent to giving them sudo?
6. What is a multi-stage build and why is it useful for security?
7. What does `--cap-drop ALL` do to a container?
8. How does Docker Compose service discovery work?
9. Name three wrong ways and three right ways to handle secrets in Docker.
10. What does Trivy scan for, and where should it run in a development workflow?

---

**Instructor Notes:**
- **CLO 4:** Implement security hardening measures — container hardening is a direct application
- **CLO 5:** Analyze system logs — connect Docker logging to the journald forwarding from Week 11
- **Lab 12: Docker Hardening** — focus on Ex 2 (hardened run flags) and Ex 3 (image scanning)
- **Live demo:** Show `docker history --no-trunc` on an image that had a secret baked in during build
- **Live demo:** Mount `/var/run/docker.sock` into a container and show `docker run` from inside it escaping to root
- **Common student mistake:** Using `latest` tag in Dockerfiles — show how that breaks reproducibility
- **Common student mistake:** Running `docker run -d myimage` without `-p` and wondering why they can't connect
- **Connect to Week 13:** Trivy is used again for system-level CVE scanning in the next lecture
