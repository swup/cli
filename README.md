@swup/cli
=========

Create swup plugins and themes in seconds, or validate your website.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![License](https://img.shields.io/npm/l/@swup/cli.svg)](https://github.com/gmrchk/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @swup/cli
$ swup COMMAND
running command...
$ swup (-v|--version|version)
@swup/cli/4.0.2 darwin-x64 node-v10.15.3
$ swup --help [COMMAND]
USAGE
  $ swup COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`swup create`](#swup-create)
* [`swup help [COMMAND]`](#swup-help-command)
* [`swup validate`](#swup-validate)

## `swup create`

Create new swup plugin and themes in seconds.

```
USAGE
  $ swup create

OPTIONS
  -n, --name=name          (required) Defines name of plugin (Swup[YourName]Plugin).
  -r, --repo=repo          Defines git repository url of plugin.
  -t, --type=plugin|theme  [default: plugin] Can choose to create theme instead.
```

_See code: [src/commands/create.js](https://github.com/swup/cli/blob/v4.0.2/src/commands/create.js)_

## `swup help [COMMAND]`

display help for swup

```
USAGE
  $ swup help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.6/src/commands/help.ts)_

## `swup validate`

Validate your site pages.

```
USAGE
  $ swup validate

OPTIONS
  -a, --asynchronous                                                   Execute all tests asynchronously at once (around
                                                                       5x faster, but might cause problems)

  -b, --baseUrl=baseUrl                                                Crawl site based on defined base URL and find
                                                                       URLs to check automatically (pages that are not
                                                                       linked from other pages, like 404, won't be
                                                                       checked)

  -c, --config=config                                                  [default: swup.config.js] Defines path of swup
                                                                       config file.

  -m, --sitemap=sitemap                                                [default: public/sitemap.xml] Sitemap file
                                                                       (accepts file path or URL)

  -o, --containers=containers                                          [default: #swup] Container selectors separated by
                                                                       a comma (,)

  -s, --stylesExpectedToChange=stylesExpectedToChange                  [default: opacity,transform] Styles expected to
                                                                       change separated by a comma (,)

  -t, --runTests=all|containers|transition-duration|transition-styles  [default: all] Run only specific test.

  -u, --testUrl=testUrl                                                Run tests for single URL.
```

_See code: [src/commands/validate.js](https://github.com/swup/cli/blob/v4.0.2/src/commands/validate.js)_
<!-- commandsstop -->
