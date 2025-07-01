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

2. **Start the Agent:**
   ```bash
   agentuity dev
   ```

3. **Copy Environment Configuration:**
   For local development, copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Update `AGENT_ID`:**
   If you are a contributor from outside the Agentuity organization, ensure that you update the `AGENT_ID` in your `.env.local` file with your specific agent ID from the `agentuity dev` run.

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
