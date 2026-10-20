# Beefree SDK skills

Agent Skills for integrating [Beefree SDK](https://developers.beefree.io/?from=skill), the embeddable email, page and popup builder.
The skills follow the open [Agent Skills format](https://agentskills.io/specification), so they work with any coding agent that supports it: Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI, OpenCode and others.

Each skill carries the technical facts it needs and links to the [official documentation](https://docs.beefree.io/beefree-sdk?from=skill) for depth.

## Prerequisite

A Beefree SDK developer account with an application, and its Client ID and Client Secret.
Sign up at <https://developers.beefree.io/signup?from=skill>.

## Skills

| Skill                                        | Use it when                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`beefree-sdk-setup`](skills/beefree-sdk-setup/SKILL.md) | You start from scratch or add Beefree SDK to an existing app: authorization, loading the email, page or popup builder, first save; also a standalone File Manager |
| [`beefree-sdk-custom-css`](skills/beefree-sdk-custom-css/SKILL.md) | You want to change the builder UI beyond what Themes offer (Superpowers plan and above): rounded tabs, a hover effect on the content tiles, your own tile icons, `customCss`, safe selectors |
| [`beefree-sdk-self-hosted-saved-rows`](skills/beefree-sdk-self-hosted-saved-rows/SKILL.md) | You want end users to save rows into your own backend and reuse them (Core plan and above): console toggle, `saveRow` dialog, `onSaveRow`, `getRows`, rename and delete |
| [`beefree-sdk-custom-rows`](skills/beefree-sdk-custom-rows/SKILL.md) | You want to offer ready-made rows (headers, footers, product blocks) in the Rows tab from your own URLs (Core plan and above): `rowsConfiguration`, `externalContentURLs`, `selectedRowType`, row metadata, CORS |
| [`beefree-sdk-content-dialog`](skills/beefree-sdk-content-dialog/SKILL.md) | You want end users to pick merge tags, special links or other content through your own search or picker UI inside the builder (Essentials plan and above): `contentDialog`, handler contract, value shapes, every handler |
| [`beefree-sdk-display-conditions`](skills/beefree-sdk-display-conditions/SKILL.md) | You want end users to show a row only to some recipients, with your own templating syntax (Core plan and above): console switch, `rowDisplayConditions`, before and after rules, a condition builder dialog, roles and permissions |

More skills, one per product area, will follow.

## Install

With the [`skills` CLI](https://github.com/vercel-labs/skills), which works for Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI, OpenCode and many other agents:

```bash
npx skills add BeefreeSDK/beefree-sdk-skills
```

The CLI asks which skills and which agents to install for, then copies each skill into the folder that agent reads.
Non-interactive variants:

```bash
# one skill, one agent, no prompts
npx skills add BeefreeSDK/beefree-sdk-skills --skill beefree-sdk-setup --agent claude-code -y

# all skills, all detected agents, for the current user instead of the current project
npx skills add BeefreeSDK/beefree-sdk-skills --all -g
```

Later, `npx skills update` refreshes installed skills and `npx skills list` shows them.
Private access uses the git credentials already configured on the machine.

Manual alternative: copy the skill folder, for example `skills/beefree-sdk-setup/`, into the skills directory your agent reads.
The folder name must match the `name` field in `SKILL.md`.

| Agent          | Project directory        | Docs                                                                    |
| -------------- | ------------------------ | ----------------------------------------------------------------------- |
| Claude Code    | `.claude/skills/`        | <https://code.claude.com/docs/en/skills>                                |
| Cursor         | `.agents/skills/`        | <https://cursor.com/docs/context/skills>                                |
| Codex          | see docs                 | <https://developers.openai.com/codex/skills/>                           |
| GitHub Copilot | see docs                 | <https://docs.github.com/en/copilot/concepts/agents/about-agent-skills> |
| Gemini CLI     | see docs                 | <https://geminicli.com/docs/cli/skills/>                                |
| OpenCode       | `.agents/skills/`        | <https://opencode.ai/docs/skills/>                                      |

## Use

Once installed, the agent picks the skill up from the words in your request.
Example prompts:

```text
Set up Beefree SDK in this folder and get me to a running demo.
```

```text
Add Beefree SDK to this app. Keep loginV2 in our backend.
```

```text
Let users save rows in the Beefree SDK builder into our own API.
```

```text
Let users search our merge tags from a dialog inside the Beefree SDK builder.
```

Agents with slash commands can also call the skill by name, for example `/beefree-sdk-setup` in Claude Code.
Keep your Client Secret out of the prompt: put it in a `.env` file and tell the agent where it is.

## Layout of a skill

```text
skills/<skill-name>/
├── SKILL.md        # instructions loaded when the skill activates
├── references/     # facts the agent reads on demand, each linked to the docs page it came from
├── assets/         # ready-to-copy files, such as the local demo
└── scripts/        # helper scripts, runtime-agnostic (bash, node)
```

## Related resources

- Documentation: <https://docs.beefree.io/beefree-sdk?from=skill>
- Developer Console: <https://developers.beefree.io/apps/?from=skill>
- Agent Skills format: <https://agentskills.io/specification>
- `skills` CLI: <https://github.com/vercel-labs/skills>
- Documentation source: <https://github.com/BeefreeSDK/beefree-sdk-docs>
- npm package: <https://github.com/BeefreeSDK/beefree-sdk-npm-official>
- Examples: <https://github.com/BeefreeSDK/beefree-sdk-examples>
- Sample templates: <https://github.com/BeefreeSDK/beefree-sdk-assets-templates>

## License

[Apache-2.0](LICENSE).
