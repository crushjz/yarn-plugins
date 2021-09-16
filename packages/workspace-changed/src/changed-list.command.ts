import {
  getFilesChanged,
  getWorkspaceChangedReasons,
  getWorkspaceFullName,
} from '@crushjz/common-utils'
import { BaseCommand, WorkspaceRequiredError } from '@yarnpkg/cli'
import { Configuration, Project, StreamReport } from '@yarnpkg/core'
import { Option } from 'clipanion'
import isEmpty from 'ramda/es/isEmpty'
import * as t from 'typanion'

export class ChangedListCommand extends BaseCommand {
  static readonly paths = [['workspaces', 'changed', 'list']]

  readonly commit = Option.String('-c,--commit', {
    description:
      'Git commit, branch or range to be used as revision for the diff',
    validator: t.isString(),
  })

  readonly json = Option.Boolean('-j,--json', false, {
    description:
      'If true the output will follow a JSON-stream also known as NDJSON (https://github.com/ndjson/ndjson-spec)',
  })

  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    )
    const { project, workspace: rootWorkspace } = await Project.find(
      configuration,
      this.context.cwd
    )

    if (!rootWorkspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd)
    }

    const report = await StreamReport.start(
      {
        configuration,
        json: this.json,
        stdout: this.context.stdout,
      },
      async r => {
        const workspaces = rootWorkspace.getRecursiveWorkspaceChildren()

        const filesChanged = await getFilesChanged(this.commit)

        const candidates = workspaces
          .map(workspace => {
            const reasons = getWorkspaceChangedReasons(workspace, filesChanged)
            return {
              workspace,
              reasons,
            }
          })
          .filter(({ reasons }) => !isEmpty(reasons))

        candidates.forEach(({ workspace, reasons }) => {
          r.reportInfo(null, workspace.relativeCwd)

          if (this.json) {
            const j = {
              name: getWorkspaceFullName(workspace),
              location: workspace.relativeCwd,
              reasons,
            }

            r.reportJson(j)
          }
        })
      }
    )

    return report.exitCode()
  }
}
