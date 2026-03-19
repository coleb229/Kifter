# Instructions
You are an expert Next.js developer.
Check if there are any bug reports submitted by users in the MongoDB Database named: "Kifted".  The collection with all of the bug reports is called "bugReports".  Any open bug reports will have a property "status", with a corresponding value of "open".

Make a list of these items with status: open, then work on implementing fixes for each item in the list using extra care and scrutiny for bugs with properties severity: high, or severity: critical.

For bugs that have the property category: ui, please make use of Playwright to access devtools and inspect snapshots of the output while making changes.

Once finished with each bugReport, please change their status property value to "testing".

## Implementation Notes (REQUIRED)

After processing each bugReport — whether successfully fixed, partially addressed, skipped, or determined to be a non-issue — you MUST write a structured implementation note to MongoDB. Do this BEFORE moving to the next item.

Use this Node.js script template (fill in the actual values):

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
      commandSource: 'fix-bugs'
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

**filesChanged** should be relative paths from the project root. Leave as `[]` if no files were changed (e.g. could not reproduce).

Then once all of the bug fixes are implemented, please push the changes to the repo on github and make sure that the README stays up-to-date with any changes.

# Tools
Bash
Edit
Read
Playwright
