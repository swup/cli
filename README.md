# Swup CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![License](https://img.shields.io/npm/l/@swup/cli.svg)](https://github.com/gmrchk/cli/blob/master/package.json)

A command-line interface (CLI) to aid in developing [swup](https://swup.js.org/) sites and plugins.

- Validate your website for CI/CD
- Create plugins and themes from a template
- Bundle plugins and themes using microbundle

- [Usage](#usage)
- [Commands](#commands)

## Installation

Install the CLI globally from npm.

```sh
npm install -g @swup/cli
```

## Usage

The CLI installs a binary called `swup`. Run that, followed by any of the provided [commands](#commands).

```sh
$ swup [command]
running command...

$ swup (--version)
@swup/cli/5.0.0 darwin-arm64 node-v18.16.0

$ swup --help [command]
```

## Commands

### `swup create`

Create a new plugin or theme by cloning from the plugin template repository.

```
USAGE
  $ swup hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

See code: [src/commands/create.ts](https://github.com/swup/cli/blob/master/src/commands/create.ts)

### `swup help [command]`

Display help for any command.

```
USAGE
  $ swup help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for swup.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.19/src/commands/help.ts)_
