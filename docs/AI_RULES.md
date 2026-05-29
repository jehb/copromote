# AI Agent Rules & Guidelines

This file contains persistent instructions for any AI coding agent working on this repository.

# Best Practices

* Always write command output to a temporary file for debugging. These files should not be tracked by git.
* Assume that I want temporary files cleaned up, documentation updated, and tests run succesfully before any git commit.
* Unless I specify otherwise, please assume you should run `git commit` after any `git push` command.
* Unless I specify otherwise, please assume you should rebuild and relaunch local containers after a successful git push.

## Documentation Maintenance

> **Rule:** After every feature implementation, UI change, or functionality update, you MUST update the corresponding documentation.

1.  **Contextual Help**: Update the markdown files in `public/docs/help/` if the change affects:
    *   Contacts (`public/docs/help/contacts.md`)
    *   Events (`public/docs/help/events.md`)
    *   Social Media (`public/docs/help/social.md`)
    *   Projects (`public/docs/help/projects.md`)
    *   Settings (`public/docs/help/settings.md`)
    *   General App Info (`public/docs/help/general.md`)

2.  **Implementation Plans**: Ensure `docs/` or `implementation_plan.md` reflects the current state.

3.  **Code Comments**: Update JSDoc/comments if logic changes.
