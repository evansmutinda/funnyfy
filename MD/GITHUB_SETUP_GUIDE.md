# How to Link Your Project to GitHub - Step by Step

## What is Git and GitHub?

**Git** = A tool on your computer that tracks changes to your files (like "save game" for your code)
**GitHub** = A website that stores your code online and lets you share it

Think of it like:
- Git = The filing system on your computer
- GitHub = Google Drive for your code files

---

## Step 1: Install Git on Your Computer

### For Windows:

1. **Download Git:**
   - Go to: https://git-scm.com/download/win
   - Click the download button (it auto-detects Windows)
   - Save the installer file

2. **Install Git:**
   - Double-click the downloaded file
   - Click "Next" through the installer
   - **Important options to keep:**
     - ✅ "Git from the command line and also from 3rd-party software"
     - ✅ "Checkout Windows-style, commit Unix-style line endings"
   - Click "Install"
   - Wait for installation to finish

3. **Verify Installation:**
   - Open PowerShell (Windows key, type "PowerShell", press Enter)
   - Type: `git --version`
   - You should see something like: `git version 2.42.0`

---

## Step 2: Create a GitHub Account (if you don't have one)

1. Go to: https://github.com
2. Click "Sign up"
3. Enter your email, create a password, choose a username
4. Verify your email address
5. Complete the setup

---

## Step 3: Create a Repository on GitHub

**Repository** = A folder on GitHub where your code lives

1. **Log into GitHub**
   - Go to github.com and log in

2. **Create New Repository:**
   - Click the "+" icon in the top right
   - Click "New repository"

3. **Repository Settings:**
   - **Repository name**: `funnyfy` (canonical repo: `evansmutinda/funnyfy`)
   - **Description**: "Funnyfy - Caricature generation app"
   - **Visibility**: 
     - 🔒 Private (recommended) - Only you can see it
     - 🌐 Public - Everyone can see it
   - **DO NOT** check "Add a README file" (we'll do that manually)
   - **DO NOT** add .gitignore or license yet
   - Click "Create repository"

4. **Copy the Repository URL:**
   - After creating, GitHub shows a page with instructions
   - Copy the URL shown (looks like: `https://github.com/evansmutinda/funnyfy.git`)
   - Keep this handy!

---

## Step 4: Initialize Git in Your Local Project

Now we'll connect your local project folder to Git.

### Open PowerShell in your project folder:

1. **Method 1 - Using File Explorer:**
   - Navigate to `d:\Claude\funnyfyapp` in File Explorer
   - In the address bar, type: `powershell` and press Enter
   - PowerShell opens in that folder

2. **Method 2 - Using PowerShell directly:**
   - Open PowerShell
   - Type: `cd d:\Claude\funnyfyapp`
   - Press Enter

### Initialize Git and connect to GitHub:

**Run these commands one at a time** (copy each, paste into PowerShell, press Enter):

```powershell
# 1. Initialize Git in your project folder
git init

# 2. Configure Git with your name (use your actual name)
git config user.name "Your Name"

# 3. Configure Git with your email (use your GitHub email)
git config user.email "your.email@example.com"

# 4. Check the status (see what files Git found)
git status

# 5. Add all files to Git's tracking
git add .

# 6. Create your first "commit" (save point)
git commit -m "Initial commit - Project setup"

# 7. Rename the default branch to 'main' (GitHub standard)
git branch -M main

# 8. Connect to your GitHub repository (replace URL with YOUR repository URL)
git remote add origin https://github.com/evansmutinda/funnyfy.git

# 9. Push your code to GitHub
git push -u origin main
```

**When you run `git push`, you'll be asked for:**
- Username: Your GitHub username
- Password: You need to use a **Personal Access Token** (see Step 5 below)

---

## Step 5: Create a Personal Access Token (Password)

GitHub requires a special password instead of your regular password:

1. **Go to GitHub Settings:**
   - Click your profile picture (top right)
   - Click "Settings"
   - Scroll down, click "Developer settings" (left sidebar)
   - Click "Personal access tokens"
   - Click "Tokens (classic)"
   - Click "Generate new token"
   - Click "Generate new token (classic)"

2. **Configure the Token:**
   - **Note**: `Funnyfy App Upload` (or any name you want)
   - **Expiration**: Choose how long it should work (90 days, 1 year, or no expiration)
   - **Select scopes**: Check the box next to `repo` (this gives full access to repositories)
   - Click "Generate token" at the bottom

3. **Copy the Token:**
   - **IMPORTANT**: Copy this token immediately - you can't see it again!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Use it as Password:**
   - When `git push` asks for password, paste this token
   - Username: Your GitHub username
   - Password: The token you just copied

---

## Step 6: Verify It Worked

1. Go to your GitHub repository page: `https://github.com/evansmutinda/funnyfy`
2. You should see all your files there!
3. You should see the `MD` folder with your documentation files

---

## Common Commands You'll Use

Once set up, here are the commands you'll use regularly:

### Check what files changed:
```powershell
git status
```

### Add files to be saved:
```powershell
git add .                    # Add all changed files
git add filename.txt         # Add specific file
```

### Save your changes (create a commit):
```powershell
git commit -m "Description of what you changed"
```

### Upload to GitHub:
```powershell
git push
```

### Download latest from GitHub:
```powershell
git pull
```

---

## Complete Example Workflow

Here's what you'll do every time you make changes:

```powershell
# 1. See what changed
git status

# 2. Add the changed files
git add .

# 3. Save with a message
git commit -m "Added server architecture documentation"

# 4. Upload to GitHub
git push
```

---

## Troubleshooting

### "git is not recognized"
- Git isn't installed or not in your PATH
- Reinstall Git and make sure to select "Git from the command line" option

### "Repository not found" or "Authentication failed"
- Check your repository URL is correct
- Make sure you're using the Personal Access Token as password
- Token might have expired - create a new one

### "Please tell me who you are"
- Run these commands:
```powershell
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### "Failed to push" or "Updates were rejected"
- Someone else (or you from another computer) pushed changes
- Run: `git pull` first, then `git push`

### Can't find PowerShell in File Explorer
- In File Explorer, go to your project folder
- Click in the address bar (where it shows the path)
- Type: `powershell` and press Enter

---

## What Gets Uploaded?

**Files that ARE uploaded:**
- All your code files (.js, .py, etc.)
- Documentation (.md files)
- Configuration files (package.json, etc.)

**Files that are NOT uploaded (if using .gitignore):**
- `.env` files (contain secrets - should never upload!)
- `node_modules/` folder (dependencies - too large)
- Build files and temporary files

**Important Security Note:**
- NEVER commit `.env` files (they contain API keys!)
- NEVER commit files with passwords or secrets
- Always check `git status` before committing

---

## Next Steps After Setup

1. **Create a .gitignore file** (tells Git what to ignore):
```
node_modules/
.env
.DS_Store
*.log
dist/
build/
```

2. **Create a README.md** (explains your project):
```markdown
# Funnyfy App

Caricature generation mobile app using Replicate API.

## Setup

[Instructions for setting up the project]
```

3. **Make your first change:**
   - Edit a file
   - Run `git add .`
   - Run `git commit -m "Updated documentation"`
   - Run `git push`
   - Check GitHub - your change should be there!

---

## Using GitHub in Cursor (Your Editor)

Cursor has built-in Git support:

1. **View changes:**
   - Left sidebar has a "Source Control" icon (looks like a branch)
   - Click it to see changed files

2. **Commit from Cursor:**
   - Make changes to files
   - Click "Source Control" sidebar
   - Type commit message
   - Click the checkmark (✓) to commit
   - Click "Sync" or the up arrow to push

3. **No command line needed!**
   - Cursor handles Git commands for you
   - Much easier for beginners

---

**Quick Start Summary:**
1. Install Git from git-scm.com
2. Create GitHub account and repository
3. Run `git init` in your project folder
4. Run `git add .` and `git commit -m "Initial commit"`
5. Run `git remote add origin [your-github-url]`
6. Run `git push -u origin main`
7. Use Personal Access Token as password

**Last Updated**: Current Date

