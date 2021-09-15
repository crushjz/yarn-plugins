import { BaseCommand, WorkspaceRequiredError } from '@yarnpkg/cli'
import {
  CommandContext,
  Configuration,
  formatUtils,
  miscUtils,
  Project,
  Report,
  StreamReport,
  structUtils,
  Workspace,
} from '@yarnpkg/core'
import { Option } from 'clipanion'
import { MiniCli } from 'clipanion/lib/advanced/Cli'
import {
  getFilesChanged,
  getWorkspaceFullName,
  getWorkspaceWithDependencies,
  isNotNil,
} from '@crushjz/common-utils'
import { isMatch } from 'micromatch'
import { cpus } from 'os'
import pLimit from 'p-limit'
import any from 'ramda/es/any'
import isEmpty from 'ramda/es/isEmpty'
import { Writable } from 'stream'
import * as t from 'typanion'

const colors = [`#2E86AB`, `#A23B72`, `#F18F01`, `#C73E1D`, `#CCE2A3`] as const

type GetPrefixOptions = {
  readonly configuration: Configuration
  readonly commandIndex: number
}
const getPrefix = (
  workspace: Workspace,
  { configuration, commandIndex }: GetPrefixOptions
) => {
  const ident = structUtils.convertToIdent(workspace.locator)
  const name = structUtils.stringifyIdent(ident)
  const prefix = `[${name}]:`
  const color = colors[commandIndex % colors.length] || colors[0]
  return formatUtils.pretty(configuration, prefix, color)
}

const createStream = (
  report: Report,
  {
    prefix,
    interlaced,
  }: { readonly prefix: string | null; readonly interlaced: boolean }
): [Writable, Promise<boolean>] => {
  const streamReporter = report.createStreamReporter(prefix)

  const defaultStream = new miscUtils.DefaultStream()
  defaultStream.pipe(streamReporter, { end: false })
  defaultStream.on(`finish`, () => {
    streamReporter.end()
  })

  const promise = new Promise<boolean>(resolve => {
    streamReporter.on(`finish`, () => {
      resolve(defaultStream.active)
    })
  })

  if (interlaced) {
    return [defaultStream, promise]
  }

  const streamBuffer = new miscUtils.BufferStream()
  streamBuffer.pipe(defaultStream, { end: false })
  streamBuffer.on(`finish`, () => {
    defaultStream.end()
  })

  return [streamBuffer, promise]
}

const runCommand = async (
  workspace: Workspace,
  configuration: Configuration,
  report: StreamReport,
  cli: MiniCli<CommandContext>,
  {
    commandIndex,
    commandName,
    args,
  }: {
    readonly commandIndex: number
    readonly commandName: string
    readonly args: Array<string>
  }
) => {
  const prefix = getPrefix(workspace, {
    configuration,
    commandIndex,
  })

  const [stdout, stdoutEnd] = createStream(report, {
    prefix,
    interlaced: false,
  })
  const [stderr, stderrEnd] = createStream(report, {
    prefix,
    interlaced: false,
  })

  try {
    report.reportInfo(null, `${prefix} Process started`)

    const start = Date.now()

    const exitCode =
      (await cli.run([commandName, ...args], {
        cwd: workspace.cwd,
        stdout,
        stderr,
      })) || 0

    stdout.end()
    stderr.end()

    await stdoutEnd
    await stderrEnd

    const end = Date.now()
    const timerMessage = configuration.get(`enableTimers`)
      ? `, completed in ${formatUtils.pretty(
          configuration,
          end - start,
          formatUtils.Type.DURATION
        )}`
      : ``

    report.reportInfo(
      null,
      `${prefix} Process exited (exit code ${exitCode})${timerMessage}`
    )

    return exitCode
  } catch (err) {
    stdout.end()
    stderr.end()

    await stdoutEnd
    await stderrEnd

    throw err
  }
}

export class Changed extends BaseCommand {
  static readonly paths = [['workspaces', 'foreach', 'changed']]

  readonly commit = Option.String('-c,--commit', {
    description: 'Git revision patterns: eg  `<commit>`, `<commit>..<commit>`',
    validator: t.isString(),
  })

  readonly parallel = Option.Boolean(`-p,--parallel`, false, {
    description: `Run the commands in parallel`,
  })

  readonly jobs = Option.String(`-j,--jobs`, {
    description: `The maximum number of parallel tasks that the execution will be limited to`,
    validator: t.applyCascade(t.isNumber(), [t.isInteger(), t.isAtLeast(2)]),
  })

  readonly include = Option.Array(`--include`, [], {
    description: `An array of glob pattern idents; only matching workspaces will be traversed`,
  })

  readonly exclude = Option.Array(`--exclude`, [], {
    description: `An array of glob pattern idents; matching workspaces won't be traversed`,
  })

  readonly scriptName = Option.String({
    required: true,
    validator: t.isString(),
  })

  readonly args = Option.Proxy()

  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    )
    const { project, workspace: rootWorkspace } = await Project.find(
      configuration,
      this.context.cwd
    )

    const concurrency = this.parallel
      ? this.jobs || Math.max(1, cpus().length / 2)
      : 1
    const limit = pLimit(concurrency)

    if (!rootWorkspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd)
    }

    const workspaces = rootWorkspace.getRecursiveWorkspaceChildren()

    const filesChanged = await getFilesChanged(this.commit)

    const candidates = workspaces
      .filter(workspace => workspace.manifest.scripts.has(this.scriptName))
      .map(getWorkspaceWithDependencies)
      .filter(({ workspace, dependencies }) =>
        any(
          w =>
            any(
              filePath => isMatch(filePath, `${w.relativeCwd}/**/*`),
              filesChanged
            ),
          [workspace, ...dependencies]
        )
      )
      .map(({ workspace }) => workspace)
      .filter(workspace =>
        isEmpty(this.include)
          ? true
          : isMatch(structUtils.stringifyIdent(workspace.locator), this.include)
      )
      .filter(workspace =>
        isEmpty(this.exclude)
          ? true
          : !isMatch(
              structUtils.stringifyIdent(workspace.locator),
              this.exclude
            )
      )

    let mutableFinalExitCode: 0 | 1 = 0

    await StreamReport.start(
      {
        configuration,
        stdout: this.context.stdout,
      },
      async report => {
        report.reportInfo(null, `Detected ${filesChanged.length} change/s.`)
        if (candidates.length > 0) {
          report.reportInfo(null, `They affect the following workspaces:`)
          candidates.forEach(w => {
            report.reportInfo(null, `- ${getWorkspaceFullName(w)}`)
          })
        } else {
          report.reportInfo(null, "They don't affect any workspace.")
        }

        const exitCodesP = candidates.map((workspace, index) =>
          limit(async () => {
            const exitCode = await runCommand(
              workspace,
              configuration,
              report,
              this.cli,
              {
                commandIndex: index,
                commandName: this.scriptName,
                args: this.args,
              }
            )
            return exitCode
          })
        )

        const exitCodes = await Promise.all(exitCodesP)

        const errorCode = exitCodes.find(code => code !== 0)

        mutableFinalExitCode = isNotNil(errorCode) ? 1 : 0
      }
    )

    return mutableFinalExitCode
  }
}
