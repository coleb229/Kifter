# Instructions
You are an expert Next.js developer.

## Step 1 — Fetch open bug reports

Run the following to get all open bugs from MongoDB:

```bash
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const bugs = await c.db('Kifted').collection('bugReports')
    .find({ status: 'open' }, { projection: { _id:1, title:1, severity:1, category:1, description:1 } })
    .toArray();
  console.log(JSON.stringify(bugs, null, 2));
  await c.close();
})();
"
```

If there are no open bugs, inform the user and stop.

## Step 2 — Determine which bugs to fix

**If `$ARGUMENTS` is non-empty**: treat each space-separated token as a MongoDB ObjectId. Filter the open bugs list to only those IDs and skip to Step 3. Do not prompt the user.

**If `$ARGUMENTS` is empty**: display the open bugs as a numbered list in this format:
```
1. [severity: critical] Title of bug — category (ID: <objectId>)
2. [severity: high]     Another bug title — category (ID: <objectId>)
...
```
Then use AskUserQuestion to ask: "Which bugs would you like to fix? Reply with numbers (e.g. '1 3'), MongoDB IDs, or 'all'."

Parse the user's response to build the final list of bugs to process.

## Step 3 — Fix each selected bug

Use TodoWrite to create a task for each selected bug. Work through them one at a time, marking each task complete when done.

For each bug:
- Fetch its full document from MongoDB to get all fields (description, steps to reproduce, etc.)
- Use Grep and Glob to locate the relevant code
- Use Agent (subagent_type: Explore) for complex multi-file codebase research when needed
- Apply the fix using Edit or Write
- For bugs with `category: ui`, use Playwright to take a screenshot before and after the fix to verify the visual output

## Step 4 — Write implementation note (REQUIRED before moving to next bug)

After processing each bug — whether fixed, skipped, or failed — write a structured implementation note to MongoDB using this script:

```bash
node -e "
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  await c.db('Kifted').collection('bugReports').updateOne(
    { _id: new ObjectId('BUG_ID_HERE') },
    { \$push: { implementationNotes: {
      timestamp: new Date(),
      outcome: 'success',
      summary: 'One or two sentence headline describing the fix applied',
      details: 'Full narrative: root cause identified, fix applied, files changed, approach taken, any edge cases considered, or reason the bug could not be reproduced/fixed. Be specific and thorough — this log is the admin audit trail.',
      filesChanged: ['relative/path/to/file.tsx', 'another/file.ts'],
      commandSource: 'fix-select-bugs'
    }}}
  );
  await c.close();
})();
"
```

**outcome values:**
- `success` — bug fully fixed
- `partial` — bug partially addressed (note what remains)
- `skipped` — not attempted (note why: already fixed, cannot reproduce, out of scope)
- `failed` — attempted fix but could not resolve (note what was tried)
- `too_complex` — fix requires architectural changes or third-party work beyond scope

**filesChanged** should be relative paths from the project root. Leave as `[]` if no files were changed.

Then update the bug's status to `"testing"`:

```bash
node -e "
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  await c.db('Kifted').collection('bugReports').updateOne(
    { _id: new ObjectId('BUG_ID_HERE') },
    { \$set: { status: 'testing' } }
  );
  await c.close();
})();
"
```

## Step 5 — Push to GitHub

Once all selected bugs are processed, push changes to the remote repo and ensure the README is up-to-date with any relevant changes.

# Tools
Bash
Edit
Write
Read
Glob
Grep
Agent
TodoWrite
AskUserQuestion
Playwright
