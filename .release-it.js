// remember to set up a GitHub token before running release-it
// ie. export GITHUB_TOKEN="deadbeef..."

module.exports = {
  git: {
    tagName: "v${version}",
    commitMessage: "chore: release ${version}",
    changelog:
      "npx auto-changelog --config .auto-changelog.json --stdout --commit-limit false --unreleased --template preview.hbs"
  },
  hooks: {
    "before:release": [
      "npx auto-changelog --config .auto-changelog.json --package",
      "git add CHANGELOG.md package.json"
    ]
  },
  github: {
    release: true
  },
  npm: {
    publish: false
  }
};
