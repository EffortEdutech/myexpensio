# AI Workspace Context

This file is a project-local bridge to the Effort Studio central Obsidian vault.

It exists because some Codex or Claude sessions mount only the project folder. In those sessions, the central vault may be outside the sandbox even though it exists on the machine.

## Central Vault

~~~text
C:\Users\user\Documents\00 AI agent\AI-Knowledge
~~~

## How To Use This File

- Read this file only for architecture rationale, ADR, roadmap, cross-project context, and workspace operating rules.
- Do not use this file as a replacement for project docs or source files.
- If the central vault is accessible, prefer the live vault note listed below.
- If the central vault is not accessible, use this local bridge as the fallback context and mention that the live vault was outside the current sandbox.

## Live Vault Note

~~~text
C:\Users\user\Documents\00 AI agent\AI-Knowledge\Projects\myexpensio\Overview.md
~~~

## Synced Project Overview

# myexpensio Overview

## Purpose

myexpensio reimbursement, claims, admin, CS, and shared package monorepo.

## Repository

``text
C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio
``

## Project Docs

Start with:

``text
docs\00_INDEX.md
``

## AI Setup

Project-local assistant files:

``text
C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio\AGENTS.md
C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio\CLAUDE.md
``

Project-local Graphify wrapper:

``text
C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio\scripts\graphify.ps1
``

## Current Graphify Scope

Initial code graph folders:

- `apps\admin\app\(protected)`
- `apps\admin\app\api`
- `apps\admin\app\auth`
- `apps\admin\app\login`
- `apps\admin\app\orgs`
- `apps\admin\components`
- `apps\admin\lib`
- `apps\cs\app\(protected)`
- `apps\cs\app\api`
- `apps\cs\app\auth`
- `apps\cs\app\login`
- `apps\cs\components`
- `apps\cs\lib`
- `apps\user\app\(app)`
- `apps\user\app\(auth)`
- `apps\user\app\api`
- `apps\user\app\auth`
- `apps\user\app\auth-test`
- `apps\user\app\change-password`
- `apps\user\app\offline`
- `apps\user\app\privacy`
- `apps\user\app\setup`
- `apps\user\app\terms`
- `apps\user\components`
- `apps\user\lib`
- `apps\user\scripts`
- `apps\user-mobile-v2\src\api`
- `apps\user-mobile-v2\src\components`
- `apps\user-mobile-v2\src\features`
- `apps\user-mobile-v2\src\lib`
- `apps\user-mobile-v2\src\local-db`
- `apps\user-mobile-v2\src\screens`
- `apps\user-mobile-v2\src\state`
- `apps\user-mobile-v2\src\sync`
- `apps\user-mobile-v2\src\theme`
- `apps\user-mobile-v2\src\utils`
- `packages\domain\src`
- `packages\shared\src`
- `packages\types\src`
- `scripts`

Full semantic extraction may require an LLM API key if the repository contains Markdown, office documents, PDFs, images, or other non-code files.

## Related Notes

- [[Architecture/AI Development Workspace]]
- [[Architecture/Graphify + Obsidian Workflow]]
- [[Architecture/Codex + Claude Code Workflow]]

