# Swup CLI

A command-line interface (CLI) to aid in developing [swup](https://swup.js.org/) sites and plugins.

- Validate your website for CI/CD
- Create plugins and themes from a template
- Bundle plugins and themes using microbundle

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@swup/cli.svg)](https://npmjs.org/package/@swup/cli)
[![License](https://img.shields.io/npm/l/@swup/cli.svg)](https://github.com/gmrchk/cli/blob/master/package.json)

<!-- toc -->
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

## Installation

Install the CLI globally from npm.

```sh
npm install -g @swup/cli
```

## Usage

The CLI installs a binary called `swup`. Run that, followed by any of the provided [commands](#commands).

<!-- usage -->
```sh
$ swup [command]
running command...

$ swup (--version)
@swup/cli/5.0.0 darwin-arm64 node-v18.16.0

$ swup --help [command]
```
<!-- usagestop -->

## Commands

## `swup hello PERSON`

Say hello

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

_See code: [dist/commands/hello/index.ts](https://github.com/swup/cli/blob/v0.0.0/dist/commands/hello/index.ts)_

## `swup hello world`

Say hello world

```
USAGE
  $ swup hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ swup hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [dist/commands/hello/world.ts](https://github.com/swup/cli/blob/v0.0.0/dist/commands/hello/world.ts)_

## `swup help [COMMANDS]`

Display help for swup.

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

## `swup plugins`

List installed plugins.

```
USAGE
  $ swup plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ swup plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.5.0/src/commands/plugins/index.ts)_

## `swup plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ swup plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ swup plugins add

EXAMPLES
  $ swup plugins:install myplugin

  $ swup plugins:install https://github.com/someuser/someplugin

  $ swup plugins:install someuser/someplugin
```

## `swup plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ swup plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ swup plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.5.0/src/commands/plugins/inspect.ts)_

## `swup plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ swup plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ swup plugins add

EXAMPLES
  $ swup plugins:install myplugin

  $ swup plugins:install https://github.com/someuser/someplugin

  $ swup plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.5.0/src/commands/plugins/install.ts)_

## `swup plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ swup plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ swup plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.5.0/src/commands/plugins/link.ts)_

## `swup plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ swup plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ swup plugins unlink
  $ swup plugins remove
```

## `swup plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ swup plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ swup plugins unlink
  $ swup plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.5.0/src/commands/plugins/uninstall.ts)_

## `swup plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ swup plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ swup plugins unlink
  $ swup plugins remove
```

## `swup plugins update`

Update installed plugins.

```
USAGE
  $ swup plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.5.0/src/commands/plugins/update.ts)_
<!-- commandsstop -->
