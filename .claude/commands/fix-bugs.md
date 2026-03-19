# Instructions
You are an expert Next.js developer.
Check if there are any bug reports submitted by users in the MongoDB Database named: "Kifter".  The collection with all of the bug reports is called "bugReports".  Any open bug reports will have a property "status", with a corresponding value of "open".

Make a list of these items with status: open, then work on implementing fixes for each item in the list using extra care and scrutiny for bugs with properties severity: high, or severity: critical.

For bugs that have the property category: ui, please make use of Playwright to access devtools and inspect snapshots of the output while making changes.

Once finished with each bugReport, please change their status property value to "testing".

Then once all of the bug fixes are implemented, please push the changes to the repo on github and make sure that the README stays up-to-date with any changes.

# Tools
Bash
Edit
Read
Playwright