import * as core from '@actions/core'
import { process } from './process'

async delayAction(duration: number) => {
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${delay} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(ms)
    core.debug(new Date().toTimeString())
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const delay: number = parseInt(core.getInput('delay'), 10)
    await delayAction(delay)

    const report = await process();
    core.setOutput('report', JSON.stringify(report))
  } catch (error: unknown) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
