# Third-Party Notices

Supratim is licensed under the MIT License (see [LICENSE](LICENSE)).
This file documents third-party software used by the project and attribution requirements.

Runtime dependencies are installed via `npm install` and are **not** vendored in this repository.
To regenerate a full production dependency license report:

```bash
npm run licenses:report
```

## Direct dependencies

| Package | License | Copyright / author |
|---------|---------|-------------------|
| [@earendil-works/pi-coding-agent](https://github.com/earendil-works/pi) | MIT | Mario Zechner / Earendil Works |
| [@earendil-works/pi-ai](https://github.com/earendil-works/pi) | MIT | Mario Zechner / Earendil Works |
| [@earendil-works/pi-agent-core](https://github.com/earendil-works/pi) | MIT | Mario Zechner / Earendil Works |
| [@earendil-works/pi-tui](https://github.com/earendil-works/pi) | MIT | Mario Zechner / Earendil Works |
| [chalk](https://github.com/chalk/chalk) | MIT | Sindre Sorhus |
| [keytar](https://github.com/atom/node-keytar) | MIT | GitHub Inc. |

Supratim is built on the **Pi** agent toolkit. Pi source and packages are MIT-licensed:
https://github.com/earendil-works/pi

## Transitive dependencies (summary)

A production install (`npm install --omit=dev`) currently pulls in **permissive licenses only**.
No GPL, LGPL, or AGPL packages were found in the dependency tree (audited June 2026).

| License | Approx. count | Notes |
|---------|---------------|-------|
| MIT | 81 | Majority of packages |
| Apache-2.0 | 47 | Mostly AWS SDK / Smithy (via `pi-ai` optional providers) |
| BSD-3-Clause | 14 | Various utilities |
| ISC | 11 | Various utilities |
| BlueOak-1.0.0 | 5 | `minimatch`, `glob` family |
| 0BSD / dual-license | 3 | Permissive |

### Apache-2.0 notice

Packages under the Apache License 2.0 include transitive AWS SDK components used by
`@earendil-works/pi-ai` (e.g. Amazon Bedrock support). When distributing a build that
**bundles** `node_modules` or binaries, you must:

1. Include a copy of the Apache License 2.0
2. Preserve any `NOTICE` files from those packages
3. State significant changes if you modify Apache-licensed code

Source-only distribution (this repository + `npm install` by end users) typically satisfies
these obligations because each user receives upstream packages directly from npm.

## External services (not shipped code)

| Service | Relationship |
|---------|--------------|
| [Sarvam AI API](https://www.sarvam.ai) | Default LLM provider; requires user API key; governed by Sarvam terms |
| [Pi](https://pi.dev) | Upstream toolkit documentation and packages |

## Web assets (`index.html`)

The project overview page loads these CDN resources (not npm dependencies):

| Asset | License | Attribution |
|-------|---------|-------------|
| [DM Sans](https://fonts.google.com/specimen/DM+Sans), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) | See Google Fonts |
| [Font Awesome 6](https://fontawesome.com) (CDN) | [Font Awesome Free License](https://fontawesome.com/license/free) | Icons by Font Awesome |

## BSD-3-Clause and ISC

Packages under BSD-3-Clause and ISC require copyright and license notices to be retained
in distributions that include those packages. npm-installed dependencies include license
metadata in each package's `package.json` and `LICENSE` file.

## Disclaimer

This notice is provided for convenience and may not list every transitive dependency.
Run `npm run licenses:report` for a machine-generated full report before publishing
binaries or bundled installers.