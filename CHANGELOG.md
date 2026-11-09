# Changelog

## [5.0.5] - 2026-11-09

- fix flaky `swup validate --parallel` under load

## [5.0.4] - 2026-11-09

- Many fixes for `swup validate`. Make the advertised commands actually do what's advertised:
  - Implement `--sitemap` (also supports absolute sitemap paths)
  - Fail on an empty sitemap or a non-OK sitemap response
  - Fix `--crawl` (migrate to crawler v2 API)
  - Fix `--animation` and `--parallel` flags being ignored
  - Fix animation duration checks not waiting long enough
  - Pass transition-styles check if any expected style changes
  - Mark failed pages as failed in the task list 😅

## [5.0.3] - 2024-03-25

- Optimize `swup package:format` and `swup package:lint` for usage in `lint-staged`

## [5.0.2] - 2023-10-02

- Fix command links in readme

## [5.0.1] - 2023-09-26

- Make TypeScript 5 available to plugins

## [5.0.0] - 2023-09-19

- Add `build` and `lint` commands for bundling packages
- Simplify `validate` command args (possibly breaking change)
- Use interactive listers for multi-step commands
- Update CLI framework and tooling
- Switch to TypeScript and ESM modules
- Load config file from multiple locations

## [4.0.3] - 2022-06-01

- Fix error on non-TTY terminals

## [4.0.2] - 2020-06-29

- Support `asynchronous`, `baseUrl`, `runTests` and `testUrl` options in project config
- Rename option `findUrls` to `baseUrl`
- Rename shortcuts to `-t` (`runTests`) and `-u` (`testUrl`)
- Fix log level

## [4.0.1] - 2020-06-28

- Run async tests sequentially

## [4.0.0] - 2020-06-28

- Run tests asynchronously
- Make all options available from the CLI, with default values
- Support relative URLs
- Remove the `against` option
- Rename option `swupOptions` to `swup`

## [0.3.4] - 2020-06-28

- Add option to crawl the website before validating

## [0.3.3] - 2020-06-28

- Add option to run tests for a single URL
- Add option to run only one of the test cases
- Improve validation logging

## [0.3.2] - 2020-06-28

- Initial release

[5.0.5]: https://github.com/swup/cli/releases/tag/5.0.5
[5.0.4]: https://github.com/swup/cli/releases/tag/5.0.4
[5.0.3]: https://github.com/swup/cli/releases/tag/5.0.3
[5.0.2]: https://github.com/swup/cli/releases/tag/5.0.2
[5.0.1]: https://github.com/swup/cli/releases/tag/5.0.1
[5.0.0]: https://github.com/swup/cli/releases/tag/5.0.0
[4.0.3]: https://github.com/swup/cli/releases/tag/4.0.3
[4.0.2]: https://github.com/swup/cli/releases/tag/4.0.2
[4.0.1]: https://github.com/swup/cli/releases/tag/4.0.1
[4.0.0]: https://github.com/swup/cli/releases/tag/4.0.0
[0.3.4]: https://github.com/swup/cli/releases/tag/0.3.4
[0.3.3]: https://github.com/swup/cli/releases/tag/0.3.3
[0.3.2]: https://github.com/swup/cli/releases/tag/0.3.2
