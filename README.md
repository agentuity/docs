<div align="center">
    <img src=".github/Agentuity.png" alt="Agentuity" width="100"/>
</div>

<br />

# Agentuity Docs Website

This project contains the Agentuity documentation website, created using Fumadocs and running on NextJS 15.

To make the search feature work, you must set up `.env.local` with the following steps.

## Setup Local Environment
1. **Navigate to the Agent Directory:**
   ```bash
   cd agent-docs
   ```

2. **Start the Agent:**
   ```bash
   agentuity dev
   ```

3. **Update `.env.local`:**  
   Add your agent's URL and ID:
   ```plaintext
   AGENT_BASE_URL=YOUR_AGENT_URL
   AGENT_ID=YOUR_DOC_QA_AGENT_ID
   ```

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
