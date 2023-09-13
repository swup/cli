# Swup CLI

[![Version](https://img.shields.io/npm/v/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![License](https://img.shields.io/npm/l/@swup/cli.svg)](https://github.com/gmrchk/cli/blob/master/package.json)
[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

A command-line interface (CLI) to help develop [swup](https://swup.js.org/) sites and plugins.

- Validate your website in CI/CD
- Create plugins and themes from a best-practice template
- Bundle plugins and themes using microbundle

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)

## Installation

Install the CLI globally from npm.

```sh
npm install -g @swup/cli
```

## Usage

The CLI will install a binary called `swup` you can run, followed by any of the provided [commands](#commands).

```sh
$ swup [command]
> Running command...

$ swup --help [command]
> Show help for command [command]

$ swup --version
> @swup/cli/5.0.0 darwin-arm64 node-v18.16.0
```

## Commands

### `swup create`

Create a new plugin or theme by cloning from the plugin template repository.

```sh
USAGE
  $ swup create NAME -f <value>

ARGUMENTS
  NAME  Name of the plugin to create

FLAGS
  -t, --type=<value>  Type of project: plugin | theme

DESCRIPTION
  Generate a new swup plugin or theme from an official, best-practice template

EXAMPLES
  $ swup create SwupExamplePlugin
  $ swup create SwupExampleTheme
```

See code: [src/commands/create.ts](https://github.com/swup/cli/blob/master/src/commands/create.ts)

### `swup help [command]`

Display help for any command.

```sh
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
