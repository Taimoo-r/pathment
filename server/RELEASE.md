# Releasing to production (staging → main)

How we ship a release to prod. This is the repeatable checklist — follow it every
time. For first-time server/infra setup see `DEPLOY.md`; for the day-to-day deploy
commands see its "Day-2 operations" section.

---

## The one thing to understand first

The two environments handle the **database schema completely differently**:

| | How schema changes reach it | Auto-deploy trigger |
|---|---|---|
| **Staging** | `db:sync` runs on every deploy → schema is **auto-derived from the models**. No migration needed. | push to `staging` |
| **Production** | **Migrations only**, run **manually**. `db:sync` is NEVER run (it would alter/drop real user data). | push to `main` |

**The trap:** a feature works on staging because `db:sync` silently added the column.
On prod that column does **not** exist until you write and run a migration. If the new
code deploys before the migration runs, Sequelize `SELECT`s a missing column and those
endpoints 500. **Every model change needs a matching migration to reach prod.**

---

## 1. Before you promote — preflight

Run these from the repo root while on `staging`:

```bash
git fetch origin
# (a) Confirm staging is a clean fast-forward ahead of main:
git merge-base --is-ancestor origin/main origin/staging && echo "FF OK" || echo "DIVERGED — stop, ask for help"

# (b) THE IMPORTANT ONE — did any model change without a migration?
echo "Models changed since main:"
git diff --name-only origin/main origin/staging -- server/src/models/
echo "Migrations added since main:"
git diff --name-status origin/main origin/staging -- server/scripts/migrations/
```

If a model under `server/src/models/` changed (new column, new table, type change) and
there is **no** corresponding new migration in `server/scripts/migrations/`, **write the
migration before promoting.** Model up to date on staging via db:sync ≠ prod is ready.

Also sanity-check:
- [ ] Migrations are **additive / backward-compatible** (add nullable columns; don't drop
      or rename a column the still-running old code reads — see "Expand → contract" below).
- [ ] No secrets added to the repo (it's public).
- [ ] You're OK with prod redeploying: pushing `main` triggers it immediately.

---

## 2. Promote main → staging

```bash
cd /media/sheryar-ahmed/01DC5351630C77508/industry/os/pathment
git fetch origin
git checkout main
git reset --hard origin/main          # local main = remote
git merge --ff-only origin/staging    # clean fast-forward, no merge commit
git push origin main                  # ← auto-deploys prod (GitHub Action)
git checkout staging                  # back to the working branch
```

`--ff-only` refuses anything that isn't a clean fast-forward. If it errors, **stop** —
the branches have diverged and need a closer look, not a force.

The prod Action (`.github/workflows/deploy-prod.yml`) SSHes in, `git reset --hard
origin/main`, then `docker compose up -d --build`. It does **not** run migrations.

---

## 3. Run the release's migrations on prod

If preflight found new migrations, run each one **right after the Action finishes**.
SSH into the prod box, then:

```bash
cd ~/pathment/server 2>/dev/null || cd /root/pathment/server
docker compose run --rm api node scripts/migrations/<NNN>_<name>.js
```

Migrations here are idempotent (they skip columns/tables that already exist), so a
re-run is safe. Rollback for a migration that supports it:

```bash
docker compose run --rm api node scripts/migrations/<NNN>_<name>.js --rollback
```

### Zero broken-window variant (preferred for additive migrations)
Because additive (nullable) columns are invisible to the currently-running old code,
you can add them **before** switching to the new code — no window where code is ahead
of schema. Do this on the prod box instead of relying on timing:

```bash
cd ~/pathment && git fetch origin main && git reset --hard origin/main
cd server
docker compose build api                                       # build new image; old container keeps serving
docker compose run --rm api node scripts/migrations/<NNN>_*.js # add columns while old code still runs
docker compose up -d api                                       # now restart into the new code
```

> Don't use this for **destructive** migrations (drop/rename) — those must go in a
> *later* release after no code references the old shape (see Expand → contract).

---

## 4. Verify

```bash
# On the prod box:
docker compose ps                       # api healthy
docker compose logs --tail=50 api       # no boot errors / no "column does not exist"
curl -s https://<API_DOMAIN>/api/health # 200
```

Then in the app: hit the feature that shipped (e.g. assign a task with an override),
and skim `/admin/emails` if the release touched mail.

---

## 5. If something's wrong — roll back

Code rollback (redeploy the previous good commit):

```bash
# on prod box
cd ~/pathment && git reset --hard <previous-good-sha> && cd server
docker compose up -d --build
```

Then, if the bad release ran a migration and the previous code can't tolerate the new
schema, roll the migration back too (`--rollback`). Additive nullable columns usually
need no rollback — old code just ignores them.

To find the previous good sha: `git log --oneline origin/main`.

---

## Expand → contract (how to change schema without an outage)

Never drop/rename a column in the same release that stops using it — during the deploy,
old and new code briefly overlap.

1. **Expand** — release A: add the new (nullable) column + write code that handles both
   old and new shapes. Migration is additive only.
2. **Migrate data** if needed (backfill), still tolerant of both shapes.
3. **Contract** — release B (later, once all running code uses the new shape): drop the
   old column.

---

## Known caveat: brief deploy downtime

Today, `docker compose up -d --build` stops the old container and starts the new one,
and Caddy proxies to it during the ~10–25s cold boot → users see 502s for those seconds
on each prod deploy. We've chosen to live with this for now. The fix (blue-green +
graceful shutdown, zero downtime) is designed but deferred — pick it up when deploy
frequency makes the 502 window worth removing.

---

## Standing rules (project)

- Work on `staging`; `main` is prod. Never push straight to `main` without going through
  this checklist.
- **Never** run `db:sync` / `sequelize.sync({alter})` / reset against the **prod** DB —
  it has ~3,000 real users. Schema changes go through migrations only.
- The repo is **public** — no secrets in code or commits.
