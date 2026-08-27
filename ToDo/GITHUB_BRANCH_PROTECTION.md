# GitHub branch protection (manual setup)

**Status:** Not applied from code — requires GitHub UI (or `gh` CLI on a machine that has it).

Protect `main` so changes go through a pull request and CI must pass.

## Steps

1. Open the repo on GitHub → **Settings** → **Branches**
2. **Add branch protection rule** for `main`
3. Enable:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging** → select **CI / api** (from `.github/workflows/ci.yml`)
4. Optional but recommended:
   - **Do not allow bypassing the above settings**
   - **Require branches to be up to date before merging**

Repeat for `staging` / `Staging` if those are long-lived deploy branches.

## CLI (if you install GitHub CLI later)

```bash
gh api repos/OWNER/REPO/branches/main/protection -X PUT \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=api \
  -f enforce_admins=true \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f restrictions=null
```

Replace `OWNER/REPO` with your repository.
