import { BaseCommand, WorkspaceRequiredError } from '@yarnpkg/cli'
import { Configuration, Project } from '@yarnpkg/core'

export class ChangedListCommand extends BaseCommand {
  static readonly paths = [['workspaces', 'changed', 'list']]

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

    console.log('LIST')

    return 0
  }
}
