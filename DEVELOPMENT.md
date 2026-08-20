# Testing

Testing public exports can be done using the bundle, as the example d3-plugin
does, but this does not let you test internal functions.

[reify](https://github.com/benjamn/reify) lets you use ES6 modules in nodejs.

Run the tests using `npm test`.

# Releasing a new version

Check the tests run: `npm test`.

Edit the changelog in the README.md *first*: move the "Unreleased" items into
a new `### vX.Y.Z` section (leaving an empty `### Unreleased` heading above
it for next time).

Bump the version *without* committing or tagging yet, so the changelog edit
and the version bump can land in a single commit:

```
npm version {major | minor | patch} --no-git-tag-version
```

Commit everything and tag it, in that order:

```
git add package.json package-lock.json README.md
git commit -m "X.Y.Z"
git tag -a vX.Y.Z -m "X.Y.Z"
```

Do *not* use `npm version` on its own for this (it commits and tags in one
step) and then `git commit --amend` to fold in the changelog - amending
creates a new commit, but the tag `npm version` created still points at the
old, now-orphaned one. This has happened several times in this repo's history
(e.g. `v0.4.0`, `v0.6.0`, `v0.9.2` all pointed at dangling commits missing
their changelog entry until this was fixed) - tag *after* the final commit
exists, not before.

Push the commit and tag, then publish:

```
git push --follow-tags
npm publish
```
