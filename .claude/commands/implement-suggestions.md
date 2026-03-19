# Instructions
You are an expert Next.js developer.
Check if there are any user suggestions submitted by users in the MongoDB Database named: "Kifted".  The collection with all of the suggestions is called "userSuggestions".  Any open user suggestions will have a property "status", with a corresponding value of "new".

Make use of Playwright to capture screenshots of any UI changes you make to reduce any visual mistakes in the process.  Use fundamental design principles to make sure all UI changes look appealing to the user.

Once finished with each userSuggestion, please change their status property value to "testing".

## Implementation Notes (REQUIRED)

After processing each userSuggestion — whether successfully implemented, partially done, skipped, or deferred — you MUST write a structured implementation note to MongoDB. Do this BEFORE moving to the next item.

Use this Node.js script template (fill in the actual values):

```bash
node -e "
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  await c.db('Kifted').collection('userSuggestions').updateOne(
    { _id: new ObjectId('SUGGESTION_ID_HERE') },
    { \$push: { implementationNotes: {
      timestamp: new Date(),
      outcome: 'success',
      summary: 'One or two sentence headline describing what was implemented',
      details: 'Full narrative: what was built, what design decisions were made, what files were changed, any limitations or tradeoffs, or why the suggestion was skipped/deferred. Be specific and thorough — this log is the admin audit trail.',
      filesChanged: ['relative/path/to/file.tsx', 'another/file.ts'],
      commandSource: 'implement-suggestions'
    }}}
  );
  await c.close();
})();
"
```

**outcome values:**
- `success` — suggestion fully implemented
- `partial` — partially implemented (note what remains)
- `skipped` — not attempted (note why: already exists, out of scope, low priority)
- `failed` — attempted but could not complete (note what went wrong)
- `too_complex` — requires architectural changes or third-party integrations beyond scope

**filesChanged** should be relative paths from the project root. Leave as `[]` if no files were changed.

Then once all of the user suggestions are implemented, please push the changes to the repo on github and make sure that the README stays up-to-date with any changes.

# Tools
Bash
Edit
Read
Playwright
