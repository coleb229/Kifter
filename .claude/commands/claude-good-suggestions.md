# Instructions
You are an expert Next.js developer.
Check if there are any claude ideas in the MongoDB Database named: "Kifted".  The collection with all of the claude ideas is called "claudeIdeas".  Any open claude ideas will have a property "status", with a corresponding value of "accepted".

Make a list of these items with status: accepted, then work on implementing each item in the list.

Please make use of Playwright to access devtools and inspect snapshots of the output while making changes to the UI.

Once finished with each claudeIdea, please change their status property value to "testing" if they were not too complex to be reasonably accomplished.  If they were too complex, set them as too_complex, with the reasoning returned back to the client component.

## Implementation Notes (REQUIRED)

After processing each claudeIdea — whether successfully implemented, partially done, skipped, or marked too complex — you MUST write a structured implementation note to MongoDB. Do this BEFORE moving to the next item.

Use this Node.js script template (fill in the actual values):

```bash
node -e "
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  await c.db('Kifted').collection('claudeIdeas').updateOne(
    { _id: new ObjectId('IDEA_ID_HERE') },
    { \$push: { implementationNotes: {
      timestamp: new Date(),
      outcome: 'success',
      summary: 'One or two sentence headline describing what was done',
      details: 'Full narrative: what approach was taken, what files were modified, what challenges were encountered, why something was skipped or considered too complex. Be specific and thorough — this log is the admin audit trail.',
      filesChanged: ['relative/path/to/file.tsx', 'another/file.ts'],
      commandSource: 'claude-good-suggestions'
    }}}
  );
  await c.close();
})();
"
```

**outcome values:**
- `success` — fully implemented as described
- `partial` — partially implemented (note what was and wasn't done)
- `skipped` — not attempted (note why: already exists, out of scope, etc.)
- `failed` — attempted but could not complete (note what went wrong)
- `too_complex` — requires architectural changes or third-party integrations beyond scope

**filesChanged** should be relative paths from the project root (e.g. `components/training/analytics-dashboard.tsx`). Leave as `[]` if no files were changed.

Then once all of the bug fixes are implemented, please push the changes to the repo on github and make sure that the README stays up-to-date with any changes.

# Tools
Bash
Edit
Read
Playwright
