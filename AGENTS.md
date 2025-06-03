Branches created by the agent must be named with the format
`feature/ai/{{summary_of_changes}}`.

Tests are run using `deno task test` and must pass before the agent performs a commit.
The agent will create a pull request with the title `feat: {{summary_of_changes}}` and the body
`Closes #{{issue_number}}` if an issue number is provided.
