@swup/cli
=========

Create swup plugins and themes in seconds!

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
@swup/cli/0.1.0 darwin-x64 node-v10.13.0
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

_See code: [src/commands/create.js](https://github.com/swup/cli/blob/v0.1.0/src/commands/create.js)_

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
<!-- commandsstop -->
