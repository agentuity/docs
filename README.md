<div align="center">
    <img src=".github/Agentuity.png" alt="Agentuity" width="100"/>
</div>

<br />

# Agentuity Docs Website

Documentation website for Agentuity, built with [Fumadocs](https://fumadocs.vercel.app) and Next.js 15.

## Project Structure

```
docs/
├── app/                    # Next.js app router
├── content/                # Documentation content (MDX files)
├── components/             # React components
├── lib/                    # Shared utilities
├── doc-agents/             # Agentuity agents backend (AI search, chat, etc.)
└── public/                 # Static assets
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `AGENT_BASE_URL` | URL of the doc-agents backend (local: `http://127.0.0.1:3500`) |
| `AGENT_BEARER_TOKEN` | Bearer token for authenticating with the agent backend |

### 3. Start the Doc-Agents Backend (Optional)

If you need AI search or chat features, start the agents backend:

```bash
cd doc-agents
agentuity dev
```

This starts the agents backend at `http://localhost:3500`. See [doc-agents/README.md](doc-agents/README.md) for more details.

### 4. Run the Docs Site

```bash
npm run dev
```

Open [http://localhost:3201](http://localhost:3201) to view the docs.

## Environment Variables

### Local Development

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_BASE_URL` | No | Agent backend URL (defaults to `http://127.0.0.1:3500`) |
| `AGENT_BEARER_TOKEN` | For AI features | Token for agent backend authentication |

### Production (Cloudflare)

Set these as **runtime** environment variables (not build-time):

| Variable | Description |
|----------|-------------|
| `AGENT_BASE_URL` | Your deployed doc-agents URL |
| `AGENT_BEARER_TOKEN` | Secret token (use encrypted secrets) |

## GitHub Actions Secrets

For CI/CD workflows:

| Secret | Description |
|--------|-------------|
| `AGENT_BEARER_TOKEN` | Bearer token for the `process-docs` API endpoint |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Fumadocs](https://fumadocs.vercel.app)
- [Agentuity Documentation](https://agentuity.dev)
