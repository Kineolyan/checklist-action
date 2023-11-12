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
 - Handy little timeout to wait for multiple updates to the Pull Request body, when clicking on multiple switches.

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

## Advanced usage

### Timeout

`checkswitch-action` allows to define a built-in timeout. This allows to wait for users to make multiple changes to switches (an task that can easily take many seconds on GitHub).

```yaml
steps:
  - name: Read switches
    id: read-switches
    uses: kineolyan/checkswitch-action@1
    with:
      delay: 100 # delay of 100ms
```

This accepts a value in milliseconds. By default, no timeout is applied.

### Capturing switch labels

`checkswitch-action` allows to capture the label of all switches, whatever their state.

```yaml
  - name: Read switches
    id: read-switches
    uses: kineolyan/checkswitch-action@1
    with:
      capture-labels: true
```

Applied to the following content

```
 - [ ] Run tests <!-- test state[ ] -->
 - [x] By-pass checks: accepted <!-- ignore state[ ] -->
```

it will return the following output to the field `captures`:

```json
{
  "test": "Run tests",
  "ignore": "By-pass checks: accepted"
}
```

This example above illustrates a way to complement the switch status with additional information. In this case, the workflow can parse the capture for `ignore`. If it contains `accepted`, the workflow decides not to run tests but still reports them as passed.

By default, the action does not capture anything.

### Multiple lists with namespaces

`checkswitch-action` allows you to manage multiple lists of switches, using a namespace. Namespaces are defined by switch ids starting with another word followed by a `/`.

```yaml
  - name: Read switches
    id: read-switches
    uses: kineolyan/checkswitch-action@1
    with:
      namespace: admin
```

Applied to the following content

```
 - [ ] Run tests <!-- test state[ ] -->
 - [x] By-pass checks <!-- admin/ignore state[ ] -->
```

the output will only contain information about `admin/ignore`.

#### Caveats

`checkswitch-action` will conflict when a user edits multiple lists in the same operation. Each workflow will likely be process in different workflows, each updating the Pull Request body at the end.
