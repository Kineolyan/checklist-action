import * as core from '@actions/core'
import { getPrInfo, process, updatePr, Config } from './core'

const readConfig = (): Config => {
  const token = core.getInput('github-token')
  const delay: number = parseInt(core.getInput('delay'), 10)
  const captureLabels = core.getBooleanInput('capture-labels')
  const userNamespace = core.getInput('namespace')
  const namespace = userNamespace.trim().length > 0 ? userNamespace : undefined;
  return {
    githubToken: token,
    delay,
    captureLabels,
    namespace,
  }
}

const delayAction = async (duration: number) => {
  // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
  core.info(`Waiting ${duration} milliseconds ...`)

  // Log the current timestamp, wait, then log the new timestamp
  core.debug(`Start waiting at ${new Date().toTimeString()}`)
  await new Promise(resolve => setTimeout(resolve, duration))
  core.debug(`Done waiting at ${new Date().toTimeString()}`)
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const config = readConfig()
    await delayAction(config.delay)

    console.info('Collecting PR details')
    const pr = await getPrInfo(config)
    console.info('Detecting changes to switches')
    const report = process({
      body: pr.body,
      config
    })
    core.setOutput('report', JSON.stringify(report))
    if (report.hasChanged) {
      console.info('Update PR body to save the new state')
      await updatePr({ pr, config })
    }
    core.info('Done ! :)')
  } catch (error: unknown) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
