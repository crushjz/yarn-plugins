import { UsageError } from 'clipanion'

export class WorkspaceNotFound extends UsageError {
  constructor(workspaceName: string) {
    super(`Workspace ${workspaceName} not found`)
  }
}
