# Lecture 1: Course Introduction & The Shell

CSS 262 - Linux Administration & *nix Systems for Cybersecurity

## 📝 Topics Covered

- Course overview and structure
- Learning outcomes and assessment
- Introduction to the shell
- Basic Linux commands and navigation
- File system hierarchy
- Command syntax and structure
- Environment variables
- Pipes and redirection
- Lab 1 preview: VM setup

## 🚀 Running the Slides

All lectures are managed from the parent `lectures/` directory.

### First Time Setup

```bash
cd lectures
bun install
```

### Development Mode (Live Preview)

```bash
bun run dev lecture-01/slides.md
```

This will start a local server (usually at http://localhost:3030) with hot-reload.

### Build for Production

```bash
bun run build lecture-01/slides.md -- -o dist/lecture-01
```

This creates a static build in the `dist/lecture-01/` folder.

### Export to PDF

```bash
bun run export lecture-01/slides.md -- --output exports/lecture-01.pdf
```

This exports the slides to `exports/lecture-01.pdf`.

## 📚 Related Materials

- **Reading:** The Linux Command Line, Chapters 1-3
- **Lab:** Lab 1 - VM Setup & Shell Navigation
- **Week:** Week 1 of 15

## 🎯 Learning Objectives

After this lecture, students should be able to:

1. Understand the course structure and expectations
2. Explain what a shell is and why it's important
3. Navigate the Linux file system using basic commands
4. Use pipes and redirection to combine commands
5. Understand the concept of environment variables
6. Set up a Linux VM for hands-on practice

## 🔗 Resources

- [Slidev Documentation](https://sli.dev/)
- [The Linux Command Line Book](http://linuxcommand.org/tlcl.php)
- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/)
