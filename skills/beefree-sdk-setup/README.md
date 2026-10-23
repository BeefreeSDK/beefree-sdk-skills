# Beefree SDK setup skill

An Agent Skill that takes your coding agent from a set of [Beefree SDK](https://developers.beefree.io/?from=skill) credentials to a working drag-and-drop builder, either as a local demo in a new folder or inside your existing web app.
It works with any agent that supports the open [Agent Skills format](https://agentskills.io/specification): Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI, OpenCode and others.

## What it does

- Checks your Client ID and Client Secret against Beefree, and tells you which plan and application type they belong to, without ever printing the secret.
- Asks how you want to authorize: a small backend token endpoint (recommended, mirrors production) or client-side credentials for a quick local test.
- Starts the Email Builder, Page Builder or Popup Builder with a sample template, or the standalone File Manager, depending on your credentials.
- Walks you through the save round trip: click **Save**, get the template JSON and the rendered HTML back.
- In a React, Vue or Angular app, points you to Beefree's official component and still handles the token endpoint and the checks.
- Tells you which features are in your plan before configuring them, and what your app still needs before you ship.

## Before you start

- A Beefree SDK developer account with an application, and its Client ID and Client Secret.
  Sign up at <https://developers.beefree.io/signup?from=skill>.
- Node.js 20.6 or newer, bash and curl, for the credentials check and the local demo.

## Install

With the [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add BeefreeSDK/beefree-sdk-skills --skill beefree-sdk-setup
```

The CLI asks which agents to install for and copies the skill into the folder each one reads.
For Claude Code only, with no prompts:

```bash
npx skills add BeefreeSDK/beefree-sdk-skills --skill beefree-sdk-setup --agent claude-code -y
```

Or copy this folder into your agent's skills directory, for example `.claude/skills/beefree-sdk-setup/` for Claude Code.

## Try it

Put your credentials in a `.env` file, never in the prompt, then ask your agent:

```text
Set up Beefree SDK in this folder and get me to a running demo.
```

```text
Add Beefree SDK to this app. Keep loginV2 in our backend.
```

```text
Which plan are my Beefree SDK credentials on, and does it include custom CSS?
```

Agents with slash commands can also call it by name, for example `/beefree-sdk-setup` in Claude Code.

## Feedback

Tried it? Tell us what worked and what didn't: <https://growens.typeform.com/to/kHKGaBxd>

## More

- Documentation: <https://docs.beefree.io/beefree-sdk?from=skill>
- Developer Console: <https://developers.beefree.io/apps/?from=skill>
- [`SKILL.md`](SKILL.md) holds the instructions your agent follows.
