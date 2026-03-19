# Instructions
You are an expert Next.js developer.
Check if there are any claude ideas in the MongoDB Database named: "Kifter".  The collection with all of the claude ideas is called "claudeIdeas".  Any open claude ideas will have a property "status", with a corresponding value of "accepted".

Make a list of these items with status: accepted, then work on implementing each item in the list.

Please make use of Playwright to access devtools and inspect snapshots of the output while making changes to the UI.

Once finished with each claudeIdea, please change their status property value to "testing" if they were not too complex to be reasonably accomplished.  If they were too complex, set them as too_complex, with the reasoning returned back to the client component.

Then once all of the bug fixes are implemented, please push the changes to the repo on github and make sure that the README stays up-to-date with any changes.

# Tools
Bash
Edit
Read
Playwright