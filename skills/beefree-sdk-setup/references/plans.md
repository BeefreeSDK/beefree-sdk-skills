# Plans and feature availability

Source: <https://developers.beefree.io/pricing-plans?from=skill> (section "Compare features", read on 2026-09-02)
and <https://docs.beefree.io/beefree-sdk/getting-started/readme/development-applications?from=skill>.
The pricing page changes over time.
When a feature matters, confirm the row on the page before promising it.

## Plans

Five plans, ordered by tier.
The token returned by `loginV2` carries the plan under its internal name, not the commercial one.
`scripts/check-credentials.sh` prints the mapped name.

| Plan        | Value in the token     | Tier |
|-------------|------------------------|-----:|
| Free        | `beeplugin_free`       |   10 |
| Essentials  | `beeplugin_startup`    |   20 |
| Core        | `beeplugin_silver`     |   30 |
| Superpowers | `beeplugin_gold`       |   40 |
| Enterprise  | `beeplugin_enterprise` |   50 |

A `_annual` suffix (for example `beeplugin_gold_annual`) is the yearly billing variant of the same plan.
It has the same features as the monthly one: strip the suffix before mapping.
Any other value is unknown to this skill: ask the developer which plan they are on.

The plan belongs to the application.
A developer with several applications can have several plans.
The check reflects only the credentials it was run with.

## Using a feature above the plan

Two paths on paid plans, plus a trial on Free.

1. **Test it in a development application.**
   Development applications are child applications of a production application, available on paid plans.
   They inherit the parent's plan and the parent's application type, so they cannot provide another type.
   To test features of a higher plan, open the development application details in the Developer Console and click **CHANGE PLAN** in the upper right.
   This is free of charge and does not change the subscription of the production application.
   The Custom CSS docs page states this "at no extra charge"; usage on the development application still counts toward usage-based fees and limits.
   Features tested this way cannot be deployed to production unless the production plan includes them.
2. **Upgrade the production application** to the plan that includes the feature.

Usage-based fees still apply to development applications.

### On the Free plan

There is no development application on Free.
Offer a no-charge proof of concept (PoC) trial first, then the upgrade.
The trial is requested from the Beefree team at <https://developers.beefree.io/talk-to-sales?from=skill>.
Keep the link and the meaning of this message, and fit the wording to the conversation:

> {Feature} is available on {Plan} and above, so it isn't included in the Free plan, but we'd love for you to try it. You can request a no-charge proof of concept (PoC) trial to get access while you build: <https://developers.beefree.io/talk-to-sales?from=skill>
>
> If you'd rather move to a paid plan now, you can upgrade the application in the Developer Console.

`{Plan}` is the "Min plan" of the feature in the table below.

## Feature availability

Only the features the skills in this set configure or point to.
For any other feature, read the "Compare features" section of the pricing page before promising it: the full grid is not mirrored here because it drifts and this skill is not a sales page.

Legend: `✓` available, `—` not available, text = the limit shown on the page.
"Min plan" is the lowest plan whose cell is not empty.
Feature names link to the docs page the pricing table points to.

| Feature                                                                                                                                            | Free | Essentials | Core     | Superpowers | Enterprise |       Min plan |
|----------------------------------------------------------------------------------------------------------------------------------------------------|:----:|:----------:|:--------:|:-----------:|:----------:|---------------:|
| [Dialogs For Content Search](https://docs.beefree.io/content-dialog/?from=skill)                                                                              | —    | ✓          | ✓        | ✓           | ✓          |  20 Essentials |
| [MCP Server](https://docs.beefree.io/beefree-sdk/ai-and-mcp/getting-started?from=skill)                                                                       | —    | ✓          | ✓        | ✓           | ✓          |  20 Essentials |
| [Custom File Storage](https://docs.beefree.io/connect-your-own-file-storage/?from=skill)                                                                      | —    | ✓          | ✓        | ✓           | ✓          |  20 Essentials |
| [Themes](https://docs.beefree.io/custom-look-feel/?from=skill)                                                                                                | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Custom Languages](https://docs.beefree.io/custom-languages/?from=skill)                                                                                      | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Custom Rows](https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/pre-build/implement-custom-rows?from=skill)                                    | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Hosted Saved Rows](https://docs.beefree.io/beefree-sdk/rows/storage/hosted-saved-rows?from=skill)                                                            | —    | —          | 100 rows | 250 rows    | 1000 rows  |        30 Core |
| [Self-Hosted Saved Rows](https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/save?from=skill)                                                    | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Synced Rows (Saved and Sync Content Blocks Across Designs)](https://docs.beefree.io/beefree-sdk/rows/reusable-content/sync/implement-synced-rows?from=skill) | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Single Row Edit Mode](https://docs.beefree.io/beefree-sdk/rows/reusable-content/sync/initialize-edit-single-row-mode?from=skill)                             | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Display Conditions](https://docs.beefree.io/display-conditions/?from=skill)                                                                                  | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Smart Merge Tags](https://docs.beefree.io/smart-merge-tags/?from=skill)                                                                                      | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Custom Attributes](https://docs.beefree.io/custom-attributes/?from=skill)                                                                                    | —    | —          | ✓        | ✓           | ✓          |        30 Core |
| [Custom CSS](https://docs.beefree.io/custom-css/?from=skill)                                                                                                  | —    | —          | —        | ✓           | ✓          | 40 Superpowers |
| [Custom File Picker](https://docs.beefree.io/custom-file-picker/?from=skill)                                                                                  | —    | —          | —        | ✓           | ✓          | 40 Superpowers |
| [Advanced Permissions](https://docs.beefree.io/advanced-permissions/?from=skill)                                                                              | —    | —          | —        | ✓           | ✓          | 40 Superpowers |
