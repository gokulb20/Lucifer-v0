# Cron Setup for Railway

Railway doesn't have built-in cron like Vercel. Here are your options:

---

## Option 1: External Cron Service (Recommended)

Use a free service like [cron-job.org](https://cron-job.org) or [EasyCron](https://easycron.com):

1. Sign up for free account
2. Create jobs to hit your endpoints:

| Job Name | URL | Schedule |
|----------|-----|----------|
| Check Patterns | `https://your-app.railway.app/api/cron/check-patterns` | Every hour (`0 * * * *`) |
| Check Calendar | `https://your-app.railway.app/api/cron/check-calendar` | Every 15 min (`*/15 * * * *`) |
| Morning Check-in | `https://your-app.railway.app/api/cron/morning-checkin` | Daily 9am (`0 9 * * *`) |

3. Set the Authorization header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

4. Add `CRON_SECRET` to your Railway environment variables

---

## Option 2: Railway Cron Service

Railway now supports [cron jobs](https://docs.railway.app/reference/cron-jobs) as separate services:

1. Create a new service in your Railway project
2. Set it as a cron job with the schedule
3. Have it call your API endpoints

Example cron service (create as separate folder):

```javascript
// cron/index.js
const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL;
const CRON_SECRET = process.env.CRON_SECRET;

async function callEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

// Determine which job to run based on env var
const job = process.env.CRON_JOB;

if (job === 'patterns') {
  callEndpoint('/api/cron/check-patterns').then(console.log);
} else if (job === 'calendar') {
  callEndpoint('/api/cron/check-calendar').then(console.log);
} else if (job === 'morning') {
  callEndpoint('/api/cron/morning-checkin').then(console.log);
}
```

---

## Option 3: GitHub Actions (Free)

Use GitHub Actions as a free cron runner:

Create `.github/workflows/cron.yml`:

```yaml
name: Lucifer Cron Jobs

on:
  schedule:
    # Check patterns every hour
    - cron: '0 * * * *'
    # Morning check-in at 9am UTC (adjust for your timezone)
    - cron: '0 9 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  check-patterns:
    if: github.event.schedule == '0 * * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Check Patterns
        run: |
          curl -X POST "${{ secrets.BACKEND_URL }}/api/cron/check-patterns" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  morning-checkin:
    if: github.event.schedule == '0 9 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Morning Check-in
        run: |
          curl -X POST "${{ secrets.BACKEND_URL }}/api/cron/morning-checkin" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add secrets to your GitHub repo:
- `BACKEND_URL`: Your Railway app URL
- `CRON_SECRET`: Same as in Railway env

---

## Required Environment Variables

Add these to Railway:

```
CRON_SECRET=your-secure-random-string
```

The cron endpoints check for this secret in the Authorization header.

---

## Testing Cron Endpoints

Test manually with curl:

```bash
# Check patterns
curl -X POST https://your-app.railway.app/api/cron/check-patterns \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Morning check-in
curl -X POST https://your-app.railway.app/api/cron/morning-checkin \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Force a trigger (for testing)
curl -X POST https://your-app.railway.app/api/test/simulate \
  -H "Content-Type: application/json" \
  -d '{"action": "force_trigger", "data": {"triggerId": "morning_checkin"}}'
```
