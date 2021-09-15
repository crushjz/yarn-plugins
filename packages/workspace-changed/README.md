# `@retorio/yarn-plugin-dependency

Custom Yarn 3+ plugin to execute commands only on workspaces with git changes.

## Usage

```
yarn run-on-changes ... <commandName>
```

## Examples

Run the `lint` command only on workspaces that has git changes between the current branch and the `dev` branch:

```
yarn run-on-changes --commit-target dev lint
```

## Options

| Definition    | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| -c,--commit   | Git commit/branch to be used as revision for the diff                       |
| -p,--parallel | Run the commands in parallel                                                |
| -j,--jobs #0  | The maximum number of parallel tasks that the execution will be limited to  |
| --include #0  | An array of glob pattern idents; only matching workspaces will be traversed |
| --exclude #0  | An array of glob pattern idents; matching workspaces won't be traversed     |

## Details

The command name has to be written last because the plugin can forward arguments to it:

```
yarn run-on-changes --commit-target dev lint --max-warnings=0
```

## Development

Build the plugin in watch mode and copy it to the `.yarn/plugins` folder:

```
yarn workspace @retorio/yarn-plugin-dependency dev
```
