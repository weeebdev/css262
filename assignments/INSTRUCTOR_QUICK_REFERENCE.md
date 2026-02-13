# Homework 1 - Deployment Guide

## Deploy (5 minutes)

### 1. Push template to GitHub
```bash
cd assignments/homework-1
gh repo create SDU-CSS262-2026/homework-1-template --private --source=. --push
gh repo edit SDU-CSS262-2026/homework-1-template --enable-template
```

### 2. Create assignment in GitHub Classroom
1. Go to [classroom.github.com](https://classroom.github.com)
2. New Assignment → Individual
3. **Title:** Homework 1: Linux Fundamentals
4. **Deadline:** Week 3 (e.g., March 7, 23:59)
5. **Template:** `homework-1-template`
6. **Add 7 autograding tests** (copy from `homework-1/GITHUB_CLASSROOM_SETUP.md`):
   - Click "Add test" → "Run command"
   - Paste each test configuration
   - Set to run "Every time a student submits"
   - **Total: 100 points**
7. **Settings:** ❌ Uncheck "Admin access" (Write is enough), ✅ Multiple submissions
8. **Copy invitation link**

### 3. Share with students
- Post link on LMS
- Share `STUDENT_QUICKSTART.md` for Git beginners
- Schedule Git tutorial in Week 1

---

## Monitor

- **Dashboard:** classroom.github.com → Assignment → See all submissions (✅/❌, points, timestamps)
- **Export:** Click "Download" button → CSV with grades
- **Command line:** `gh classroom grades --assignment homework-1`

---

## Common Student Issues

| Issue | Fix |
|-------|-----|
| Permission denied | `chmod +x system_admin.sh` |
| Authentication failed | Use [GitHub PAT](https://github.com/settings/tokens) |
| Tests fail locally but work | Test in Ubuntu 22.04: `docker run -it ubuntu:22.04` |
| How to check grade? | Repo → Actions tab → See ✅/❌ |
| Can I resubmit? | Yes, unlimited until deadline |

---

## Test Solution (Optional)

```bash
cd homework-1
sudo ./SOLUTION.sh all
# Should create users, dirs, and 3 report files
```
