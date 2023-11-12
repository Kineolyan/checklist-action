# Checkswitch

An action to create switches to control GitHub actions from the body of a Pull Request.

## Goals

The `checkswitch` action allows one to parse the body of a Pull Request to retrieve bullet points as configuration toggles.

For a Pull Request body as below,

```
Some text describing what your PR does, etc

Switches for CI
-------

- [x] Run tests in a fancy CI system <!-- fancy-test state[ ] -->
- [ ] Update changelog <!-- update-changelog state[ ] -->
```

the action will extract two switches from the content:

 - a switch name `fancy-test`, that is currently enabled
 - a switch name `update-changelog`, that is currently disabled

This information is made available to subsequent steps in GitHub actions, through steps outputs.

In addition to reading this information, checkswitch will update the Pull Request body to be able to detect changes to the switches. Using an hidden value, `checkswitch` can report if a given switch has been enabled or disabled by the latest change to the Pull Request body.

## Features

 - Detect and report the state of switches in your Pull Requests
   The output of the action reports the state of each switch, telling whether the switch is enabled.
 - Detect the changes to switches when editing the Pull Requests
   The output of the action reports if the configuration has been changed since the last execution of the action. It contains a flag marking if something changed and the list of switches that changed.
 - Extract and report the labels of switches
   The labels can optionally be added to the action output. This can be used to pass free-form information to the check, to use in downstream actions or scripts.
 - Group switches into namespaces, to create multiple lists.

## Basic usage

### Create switches in your Pull Requests

Switches must follow the format below (places to configure are surrounded by `{..}`)

` - [ ] {label of your switch} <!-- {switch id} state[ ] -->

The action only supports single-line switches.

The line must start with ` - [ ]`. GitHub automatically converts that into a checkbox. When checked, the text changed to ` - [x]`.<br>
The action accepts both ` - [ ]` or ` - [x]` as an initial value, allowing Pull Requests to start in a check state.

The label of the switch can be anything. The action will capture everything between the checkbox and the start of the HTML comment `<!--`.

The switch id must be a single word, maid of letters, numbers and `-` or `_`.

The section `state[ ]` is used internally by this action to detect the change to each switch state. `checkswitch` will automatically update this section as part of its work.

_**Warning**: lines not complying to the syntax of a switch line are ignored by this action._

### Use the action in your workflows

```yaml
steps:
  # Any step needed before, like actions/checkout

  - name: Read switches
    id: read-switches
    uses: kineolyan/checkswitch-action@1

  - name: Print Output
    id: output-in-sh
    run: echo "${{ steps.read-switches.outputs.report }}"

  # Any step needed after

permissions:
  contents: write
  pull-requests: write
```

The above snippet run `checkswitch` in the step `read-switches`. Its output is a JSON containing the result of the action. This output is printed to stdout.

## Output format

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Checkswitch output",
  "type": "object",
  "properties": {
    "hasChanged": {
      "description": "Flag indicating whether there are changes to the switches",
      "type": "boolean"
    },
    "state": {
      "description": "Map from switch ids to their status.",
      "type": "object",
      "additionalProperties": {
        "type": "boolean"
      }
    },
    "changed": {
      "description": "List of switch ids changed since the last execution. Empty when `hasChanged` is false.",
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 0,
      "uniqueItems": true
    },
    "captures": {
      "description": "Map from switch ids to their labels. All labels are captured whatever the states of the switches are",
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    }
  },
  "required": [
    "hasChanged",
    "state",
    "changed"
  ]
}
```