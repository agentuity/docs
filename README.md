<div align="center">
    <img src=".github/Agentuity.png" alt="Agentuity" width="100"/>
</div>

<br />

# Agentuity Docs Website

This project contains the Agentuity documentation website, created using Fumadocs and running on NextJS 15.


To make the search feature work, you must set up `.env.local` with the following steps.

## Quick Start Guide

1. **Navigate to the Agent Directory:**
   ```bash
   cd agent-docs
   ```

2. **Generate Agent Environment:**
   ```bash
   agentuity dev
   ```
   This will generate a `.env` file in the `agent-docs` directory with your SDK key. The key is required for the next steps.



3. **Copy Environment Configuration:**
   For local development, copy the `.env.example` file to `.env.local` in the root directory of the docs project:
   ```bash
   # Make sure you are in the root directory, not in agent-docs
   cd ../
   cp .env.example .env.local
   ```

4. **Update `AGENTUITY_API_KEY`:**
   If you are a contributor from outside the Agentuity organization, ensure that you update the `AGENTUITY_API_KEY` in your `.env.local` file with your specific SDK key from the `agentuity dev` run.

## GitHub Actions Secrets

The following secrets need to be configured in GitHub repository settings for the CI/CD workflows to function:

| Secret | Description |
|--------|-------------|
| `AGENT_BEARER_TOKEN` | Bearer token for authenticating with the `process-docs` API endpoint. This must match the `AGENT_BEARER_TOKEN` environment variable configured in your Agentuity deployment. |

To set up:
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add `AGENT_BEARER_TOKEN` with the same value configured in the Agentuity environment

## Running Docs Application

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.vercel.app) - learn about Fumadocs
