# CSS 262 Lecture Slides

This directory contains all lecture slides for the CSS 262 course: Linux Administration & *nix Systems for Cybersecurity.

All lectures are managed through a **single Slidev project** to avoid duplicate dependencies and streamline development.

## 📚 Available Lectures

| Week | Topic | Status |
|------|-------|--------|
| 1 | Course Introduction & The Shell | ✅ Complete |
| 2 | Users, Groups & Permissions | 🚧 Coming soon |
| 3 | Process Management & Systemd | 🚧 Coming soon |
| 4 | Storage, Filesystems & LVM | 🚧 Coming soon |
| 5 | Bash Scripting & Automation | 🚧 Coming soon |
| 6 | Linux Networking Basics | 🚧 Coming soon |
| 7 | Package Management & Repositories | 🚧 Coming soon |
| 8 | Midterm Assessment | N/A |
| 9 | SSH Hardening & Remote Access | 🚧 Coming soon |
| 10 | Firewalls & Packet Filtering | 🚧 Coming soon |
| 11 | Mandatory Access Control (SELinux) | 🚧 Coming soon |
| 12 | Logging, Auditing & Cron | 🚧 Coming soon |
| 13 | Containerization (Docker) | 🚧 Coming soon |
| 14 | Vulnerability Scanning & Patching | 🚧 Coming soon |
| 15 | Capstone Project & Wrap-Up | 🚧 Coming soon |

## 🛠️ Technology Stack

All lectures are created using [Slidev](https://sli.dev/), a presentation framework for developers featuring:

- 📝 Markdown-based slides
- 🎨 Customizable themes
- 💻 Code syntax highlighting
- 🎭 Interactive components
- 📊 Diagrams with Mermaid
- 📤 Export to PDF/PNG
- 🔥 Hot reload in development

## 🚀 Quick Start

### First Time Setup

```bash
cd lectures
bun install
```

### Development Mode (Run a specific lecture)

```bash
# Run any lecture by specifying the path
bun run dev lecture-01/slides.md

# Or use slidev directly
bunx slidev lecture-01/slides.md

# With specific port
bun run dev lecture-01/slides.md -- --port 3031
```

This will start a local server (usually at http://localhost:3030) with hot-reload.

### Build for Production

```bash
# Build a specific lecture
bun run build lecture-01/slides.md -- -o dist/lecture-01

# Build all lectures automatically
bun run build:all
```

Static builds will be created in the `dist/` folder.

### Export to PDF

```bash
# Export a specific lecture
bun run export lecture-01/slides.md -- --output exports/lecture-01.pdf

# Export all lectures automatically
bun run export:all
```

PDFs will be saved in the `exports/` folder.

## 📁 Project Structure

```
lectures/
├── package.json          # Single package file for all lectures
├── .gitignore           # Shared ignore rules
├── README.md            # This file
├── lecture-01/
│   ├── slides.md        # Lecture 1 slides
│   └── README.md        # Lecture 1 notes
├── lecture-02/
│   ├── slides.md        # Lecture 2 slides
│   └── README.md        # Lecture 2 notes
└── ...
```

## 📖 Creating New Lectures

To create a new lecture:

1. Create a new directory: `mkdir lecture-XX`
2. Create `slides.md` with the Slidev frontmatter
3. Add corresponding scripts to `package.json`
4. Run with `npm run dev:XX`

Each lecture directory should contain:
- `slides.md` - Main slide content (required)
- `README.md` - Lecture notes and resources (optional)
- Any additional assets (images, diagrams, etc.)

## 🎨 Shared Configuration

All lectures share:
- Dependencies (installed once)
- Slidev configuration
- Themes and styling
- Build tools

This approach:
- ✅ Reduces disk space usage
- ✅ Simplifies dependency management
- ✅ Ensures consistency across lectures
- ✅ Faster installation and updates

## 🔗 Useful Resources

- [Slidev Documentation](https://sli.dev/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Mermaid Diagrams](https://mermaid.js.org/)
- [Slidev Theme Gallery](https://sli.dev/themes/gallery.html)
