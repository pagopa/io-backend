// remember to set up a GitHub token before running release-it
// ie. export GITHUB_TOKEN="deadbeef..."

module.exports = {
  git: {
    tagName: "v${version}",
    changelog:
      "npx auto-changelog --config .auto-changelog.json --stdout --commit-limit false --unreleased --template preview.hbs"
  },
  hooks: {
    // "after:bump": "npx auto-changelog --package",
    "before:release": [
      "npx auto-changelog --config .auto-changelog.json --package",
      "git add CHANGELOG.md"
    ]
  },
  github: {
    release: true
  },
  npm: {
    publish: false
  }
};
