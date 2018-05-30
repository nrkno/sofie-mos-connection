
# All changes introduced

These are all the major changes introduced by thin new revision. This is kept here for reference for the other repositories.

1. CircleCI config changes (see diff)
2. Some minor changes to package.json
3. Some code changes to make docs-commands work
4. Setup project on CircleCI
5. Added NPM_TOKEN to CircleCI
6. Set up ssh-key with write permissions on CircleCI and GitHub (`ssh-keygen -t rsa -b 4096 -C "your_email@example.com"`, upload .pub to github, and private to CircleCI)
7. Adding protected branch, master, to github ("Protect this branch" => "Require status checks to pass before merging" => "Require branches to be up to date before merging" => Don't select anything here )
8. Fixed coverage-reports, and set required line-coverage++ to 0%. This way the coverage reports are generated without blocking a release.
9. Set up codecov for project
10. Adding CODECOV_TOKEN to circleci.
11. Add circleCI badge top of readme
12. Rename library to reflect github name
13. Update .npmignore. Make sure to include all the needed files, and nothing more. Minimal release etc. etc.
14. Update .gitignore. Remove things like coverage, docs, and so forth.
15. Remove travis
