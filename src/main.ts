import * as core from '@actions/core'
import { getPrInfo, process, updatePr } from './core'

const delayAction = async (duration: number) => {
  // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
  core.debug(`Waiting ${duration} milliseconds ...`)

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
    const delay: number = parseInt(core.getInput('delay'), 10)
    await delayAction(delay)

    const pr = await getPrInfo()
    const report = process(pr.body)
    core.setOutput('report', JSON.stringify(report))
    if (report.hasChanged) {
      await updatePr(pr)
    }
  } catch (error: unknown) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
