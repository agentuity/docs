# Agentuity CLI Skills

This directory contains auto-generated [Agent Skills](https://agentskills.io) for the Agentuity CLI.

## What are Agent Skills?

Agent Skills are modular capabilities that extend AI coding agents. Each skill is a directory
containing a `SKILL.md` file with instructions that agents read when performing relevant tasks.

Learn more at the [Agent Skills Specification](https://agentskills.io/specification).

## Generated From

- **CLI Version**: 0.1.20
- **Generated**: 2026-01-21
- **Total Skills**: 139

## Available Skills

### auth

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-auth-apikey](./agentuity-cli-auth-apikey) | `agentuity auth apikey` | Display the API key for the currently authenticated user |
| [agentuity-cli-auth-login](./agentuity-cli-auth-login) | `agentuity auth login` | Login to the Agentuity Platform using a browser-based authen... |
| [agentuity-cli-auth-logout](./agentuity-cli-auth-logout) | `agentuity auth logout` | Logout of the Agentuity Cloud Platform |
| [agentuity-cli-auth-org-current](./agentuity-cli-auth-org-current) | `agentuity auth org current` | Show the current default organization |
| [agentuity-cli-auth-org-select](./agentuity-cli-auth-org-select) | `agentuity auth org select` | Set the default organization for all commands |
| [agentuity-cli-auth-org-unselect](./agentuity-cli-auth-org-unselect) | `agentuity auth org unselect` | Clear the default organization preference |
| [agentuity-cli-auth-ssh-add](./agentuity-cli-auth-ssh-add) | `agentuity auth ssh add` | Add an SSH public key to your account (reads from file or st... |
| [agentuity-cli-auth-ssh-delete](./agentuity-cli-auth-ssh-delete) | `agentuity auth ssh delete` | Delete an SSH key from your account |
| [agentuity-cli-auth-ssh-list](./agentuity-cli-auth-ssh-list) | `agentuity auth ssh list` | List all SSH keys on your account |
| [agentuity-cli-auth-whoami](./agentuity-cli-auth-whoami) | `agentuity auth whoami` | Display information about the currently authenticated user |

### build

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-build](./agentuity-cli-build) | `agentuity build` | Build Agentuity application for deployment |

### cloud

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-cloud-agent-get](./agentuity-cli-cloud-agent-get) | `agentuity cloud agent get` | Get details about a specific agent |
| [agentuity-cli-cloud-agent-list](./agentuity-cli-cloud-agent-list) | `agentuity cloud agent list` | List agents for a project |
| [agentuity-cli-cloud-apikey-create](./agentuity-cli-cloud-apikey-create) | `agentuity cloud apikey create` | Create a new API key |
| [agentuity-cli-cloud-apikey-delete](./agentuity-cli-cloud-apikey-delete) | `agentuity cloud apikey delete` | Delete an API key (soft delete) |
| [agentuity-cli-cloud-apikey-get](./agentuity-cli-cloud-apikey-get) | `agentuity cloud apikey get` | Get a specific API key by id |
| [agentuity-cli-cloud-apikey-list](./agentuity-cli-cloud-apikey-list) | `agentuity cloud apikey list` | List all API keys |
| [agentuity-cli-cloud-db-create](./agentuity-cli-cloud-db-create) | `agentuity cloud db create` | Create a new database resource |
| [agentuity-cli-cloud-db-delete](./agentuity-cli-cloud-db-delete) | `agentuity cloud db delete` | Delete a database resource |
| [agentuity-cli-cloud-db-get](./agentuity-cli-cloud-db-get) | `agentuity cloud db get` | Show details about a specific database |
| [agentuity-cli-cloud-db-list](./agentuity-cli-cloud-db-list) | `agentuity cloud db list` | List database resources |
| [agentuity-cli-cloud-db-logs](./agentuity-cli-cloud-db-logs) | `agentuity cloud db logs` | Get query logs for a specific database |
| [agentuity-cli-cloud-db-sql](./agentuity-cli-cloud-db-sql) | `agentuity cloud db sql` | Execute SQL query on a database |
| [agentuity-cli-cloud-deploy](./agentuity-cli-cloud-deploy) | `agentuity cloud deploy` | Deploy project to the Agentuity Cloud |
| [agentuity-cli-cloud-deployment-list](./agentuity-cli-cloud-deployment-list) | `agentuity cloud deployment list` | List deployments |
| [agentuity-cli-cloud-deployment-logs](./agentuity-cli-cloud-deployment-logs) | `agentuity cloud deployment logs` | View logs for a specific deployment |
| [agentuity-cli-cloud-deployment-remove](./agentuity-cli-cloud-deployment-remove) | `agentuity cloud deployment remove` | Remove a specific deployment |
| [agentuity-cli-cloud-deployment-rollback](./agentuity-cli-cloud-deployment-rollback) | `agentuity cloud deployment rollback` | Rollback the latest to the previous deployment |
| [agentuity-cli-cloud-deployment-show](./agentuity-cli-cloud-deployment-show) | `agentuity cloud deployment show` | Show details about a specific deployment |
| [agentuity-cli-cloud-deployment-undeploy](./agentuity-cli-cloud-deployment-undeploy) | `agentuity cloud deployment undeploy` | Undeploy the latest deployment |
| [agentuity-cli-cloud-env-delete](./agentuity-cli-cloud-env-delete) | `agentuity cloud env delete` | Delete an environment variable or secret |
| [agentuity-cli-cloud-env-get](./agentuity-cli-cloud-env-get) | `agentuity cloud env get` | Get an environment variable or secret value |
| [agentuity-cli-cloud-env-import](./agentuity-cli-cloud-env-import) | `agentuity cloud env import` | Import environment variables and secrets from a file to clou... |
| [agentuity-cli-cloud-env-list](./agentuity-cli-cloud-env-list) | `agentuity cloud env list` | List all environment variables and secrets |
| [agentuity-cli-cloud-env-pull](./agentuity-cli-cloud-env-pull) | `agentuity cloud env pull` | Pull environment variables from cloud to local .env file |
| [agentuity-cli-cloud-env-push](./agentuity-cli-cloud-env-push) | `agentuity cloud env push` | Push environment variables and secrets from local .env file ... |
| [agentuity-cli-cloud-env-set](./agentuity-cli-cloud-env-set) | `agentuity cloud env set` | Set an environment variable or secret |
| [agentuity-cli-cloud-keyvalue-create-namespace](./agentuity-cli-cloud-keyvalue-create-namespace) | `agentuity cloud keyvalue create-namespace` | Create a new keyvalue namespace |
| [agentuity-cli-cloud-keyvalue-delete](./agentuity-cli-cloud-keyvalue-delete) | `agentuity cloud keyvalue delete` | Delete a key from the keyvalue storage |
| [agentuity-cli-cloud-keyvalue-delete-namespace](./agentuity-cli-cloud-keyvalue-delete-namespace) | `agentuity cloud keyvalue delete-namespace` | Delete a keyvalue namespace and all its keys |
| [agentuity-cli-cloud-keyvalue-get](./agentuity-cli-cloud-keyvalue-get) | `agentuity cloud keyvalue get` | Get a value from the keyvalue storage |
| [agentuity-cli-cloud-keyvalue-keys](./agentuity-cli-cloud-keyvalue-keys) | `agentuity cloud keyvalue keys` | List all keys in a keyvalue namespace |
| [agentuity-cli-cloud-keyvalue-list-namespaces](./agentuity-cli-cloud-keyvalue-list-namespaces) | `agentuity cloud keyvalue list-namespaces` | List all keyvalue namespaces |
| [agentuity-cli-cloud-keyvalue-repl](./agentuity-cli-cloud-keyvalue-repl) | `agentuity cloud keyvalue repl` | Start an interactive repl for working with keyvalue database |
| [agentuity-cli-cloud-keyvalue-search](./agentuity-cli-cloud-keyvalue-search) | `agentuity cloud keyvalue search` | Search for keys matching a keyword in a keyvalue namespace |
| [agentuity-cli-cloud-keyvalue-set](./agentuity-cli-cloud-keyvalue-set) | `agentuity cloud keyvalue set` | Set a key and value in the keyvalue storage |
| [agentuity-cli-cloud-keyvalue-stats](./agentuity-cli-cloud-keyvalue-stats) | `agentuity cloud keyvalue stats` | Get statistics for keyvalue storage |
| [agentuity-cli-cloud-queue-ack](./agentuity-cli-cloud-queue-ack) | `agentuity cloud queue ack` | Acknowledge a message (mark as processed) |
| [agentuity-cli-cloud-queue-create](./agentuity-cli-cloud-queue-create) | `agentuity cloud queue create` | Create a new queue |
| [agentuity-cli-cloud-queue-delete](./agentuity-cli-cloud-queue-delete) | `agentuity cloud queue delete` | Delete a queue by name |
| [agentuity-cli-cloud-queue-destinations-create](./agentuity-cli-cloud-queue-destinations-create) | `agentuity cloud queue destinations create` | Create a webhook destination for a queue |
| [agentuity-cli-cloud-queue-destinations-delete](./agentuity-cli-cloud-queue-destinations-delete) | `agentuity cloud queue destinations delete` | Delete a destination from a queue |
| [agentuity-cli-cloud-queue-destinations-list](./agentuity-cli-cloud-queue-destinations-list) | `agentuity cloud queue destinations list` | List destinations for a queue |
| [agentuity-cli-cloud-queue-destinations-update](./agentuity-cli-cloud-queue-destinations-update) | `agentuity cloud queue destinations update` | Update a destination |
| [agentuity-cli-cloud-queue-dlq-list](./agentuity-cli-cloud-queue-dlq-list) | `agentuity cloud queue dlq list` | List messages in the dead letter queue |
| [agentuity-cli-cloud-queue-dlq-purge](./agentuity-cli-cloud-queue-dlq-purge) | `agentuity cloud queue dlq purge` | Purge all messages from the dead letter queue |
| [agentuity-cli-cloud-queue-dlq-replay](./agentuity-cli-cloud-queue-dlq-replay) | `agentuity cloud queue dlq replay` | Replay a message from the dead letter queue |
| [agentuity-cli-cloud-queue-get](./agentuity-cli-cloud-queue-get) | `agentuity cloud queue get` | Get queue or message details |
| [agentuity-cli-cloud-queue-list](./agentuity-cli-cloud-queue-list) | `agentuity cloud queue list` | List all queues |
| [agentuity-cli-cloud-queue-messages](./agentuity-cli-cloud-queue-messages) | `agentuity cloud queue messages` | List messages in a queue or get a specific message |
| [agentuity-cli-cloud-queue-nack](./agentuity-cli-cloud-queue-nack) | `agentuity cloud queue nack` | Negative acknowledge a message (return to queue for retry) |
| [agentuity-cli-cloud-queue-pause](./agentuity-cli-cloud-queue-pause) | `agentuity cloud queue pause` | Pause message delivery for a queue |
| [agentuity-cli-cloud-queue-publish](./agentuity-cli-cloud-queue-publish) | `agentuity cloud queue publish` | Publish a message to a queue |
| [agentuity-cli-cloud-queue-receive](./agentuity-cli-cloud-queue-receive) | `agentuity cloud queue receive` | Receive (claim) a message from a worker queue |
| [agentuity-cli-cloud-queue-resume](./agentuity-cli-cloud-queue-resume) | `agentuity cloud queue resume` | Resume message delivery for a paused queue |
| [agentuity-cli-cloud-queue-sources-create](./agentuity-cli-cloud-queue-sources-create) | `agentuity cloud queue sources create` | Create a source for a queue |
| [agentuity-cli-cloud-queue-sources-delete](./agentuity-cli-cloud-queue-sources-delete) | `agentuity cloud queue sources delete` | Delete a source from a queue |
| [agentuity-cli-cloud-queue-sources-get](./agentuity-cli-cloud-queue-sources-get) | `agentuity cloud queue sources get` | Get a source by ID |
| [agentuity-cli-cloud-queue-sources-list](./agentuity-cli-cloud-queue-sources-list) | `agentuity cloud queue sources list` | List sources for a queue |
| [agentuity-cli-cloud-queue-sources-update](./agentuity-cli-cloud-queue-sources-update) | `agentuity cloud queue sources update` | Update a source |
| [agentuity-cli-cloud-queue-stats](./agentuity-cli-cloud-queue-stats) | `agentuity cloud queue stats` | View queue analytics and statistics |
| [agentuity-cli-cloud-redis-show](./agentuity-cli-cloud-redis-show) | `agentuity cloud redis show` | Show Redis connection URL |
| [agentuity-cli-cloud-region-current](./agentuity-cli-cloud-region-current) | `agentuity cloud region current` | Show the current default region |
| [agentuity-cli-cloud-region-select](./agentuity-cli-cloud-region-select) | `agentuity cloud region select` | Set the default cloud region for all commands |
| [agentuity-cli-cloud-region-unselect](./agentuity-cli-cloud-region-unselect) | `agentuity cloud region unselect` | Clear the default region preference |
| [agentuity-cli-cloud-sandbox-cp](./agentuity-cli-cloud-sandbox-cp) | `agentuity cloud sandbox cp` | Copy files or directories to or from a sandbox |
| [agentuity-cli-cloud-sandbox-create](./agentuity-cli-cloud-sandbox-create) | `agentuity cloud sandbox create` | Create an interactive sandbox for multiple executions |
| [agentuity-cli-cloud-sandbox-delete](./agentuity-cli-cloud-sandbox-delete) | `agentuity cloud sandbox delete` | Delete a sandbox |
| [agentuity-cli-cloud-sandbox-download](./agentuity-cli-cloud-sandbox-download) | `agentuity cloud sandbox download` | Download files from a sandbox as a compressed archive |
| [agentuity-cli-cloud-sandbox-env](./agentuity-cli-cloud-sandbox-env) | `agentuity cloud sandbox env` | Set or delete environment variables on a sandbox |
| [agentuity-cli-cloud-sandbox-exec](./agentuity-cli-cloud-sandbox-exec) | `agentuity cloud sandbox exec` | Execute a command in a running sandbox |
| [agentuity-cli-cloud-sandbox-execution-get](./agentuity-cli-cloud-sandbox-execution-get) | `agentuity cloud sandbox execution get` | Get information about a specific execution |
| [agentuity-cli-cloud-sandbox-execution-list](./agentuity-cli-cloud-sandbox-execution-list) | `agentuity cloud sandbox execution list` | List executions for a sandbox |
| [agentuity-cli-cloud-sandbox-files](./agentuity-cli-cloud-sandbox-files) | `agentuity cloud sandbox files` | List files in a sandbox directory |
| [agentuity-cli-cloud-sandbox-get](./agentuity-cli-cloud-sandbox-get) | `agentuity cloud sandbox get` | Get information about a sandbox |
| [agentuity-cli-cloud-sandbox-list](./agentuity-cli-cloud-sandbox-list) | `agentuity cloud sandbox list` | List sandboxes with optional filtering |
| [agentuity-cli-cloud-sandbox-mkdir](./agentuity-cli-cloud-sandbox-mkdir) | `agentuity cloud sandbox mkdir` | Create a directory in a sandbox |
| [agentuity-cli-cloud-sandbox-rm](./agentuity-cli-cloud-sandbox-rm) | `agentuity cloud sandbox rm` | Remove a file from a sandbox |
| [agentuity-cli-cloud-sandbox-rmdir](./agentuity-cli-cloud-sandbox-rmdir) | `agentuity cloud sandbox rmdir` | Remove a directory from a sandbox |
| [agentuity-cli-cloud-sandbox-run](./agentuity-cli-cloud-sandbox-run) | `agentuity cloud sandbox run` | Run a one-shot command in a sandbox (creates, executes, dest... |
| [agentuity-cli-cloud-sandbox-runtime-list](./agentuity-cli-cloud-sandbox-runtime-list) | `agentuity cloud sandbox runtime list` | List available sandbox runtimes |
| [agentuity-cli-cloud-sandbox-snapshot-build](./agentuity-cli-cloud-sandbox-snapshot-build) | `agentuity cloud sandbox snapshot build` | Build a snapshot from a declarative file |
| [agentuity-cli-cloud-sandbox-snapshot-create](./agentuity-cli-cloud-sandbox-snapshot-create) | `agentuity cloud sandbox snapshot create` | Create a snapshot from a sandbox |
| [agentuity-cli-cloud-sandbox-snapshot-delete](./agentuity-cli-cloud-sandbox-snapshot-delete) | `agentuity cloud sandbox snapshot delete` | Delete a snapshot |
| [agentuity-cli-cloud-sandbox-snapshot-get](./agentuity-cli-cloud-sandbox-snapshot-get) | `agentuity cloud sandbox snapshot get` | Get snapshot details |
| [agentuity-cli-cloud-sandbox-snapshot-list](./agentuity-cli-cloud-sandbox-snapshot-list) | `agentuity cloud sandbox snapshot list` | List snapshots |
| [agentuity-cli-cloud-sandbox-snapshot-tag](./agentuity-cli-cloud-sandbox-snapshot-tag) | `agentuity cloud sandbox snapshot tag` | Add or update a tag on a snapshot |
| [agentuity-cli-cloud-sandbox-upload](./agentuity-cli-cloud-sandbox-upload) | `agentuity cloud sandbox upload` | Upload a compressed archive to a sandbox and extract it |
| [agentuity-cli-cloud-scp-download](./agentuity-cli-cloud-scp-download) | `agentuity cloud scp download` | Download a file using security copy |
| [agentuity-cli-cloud-scp-upload](./agentuity-cli-cloud-scp-upload) | `agentuity cloud scp upload` | Upload a file using security copy |
| [agentuity-cli-cloud-session-get](./agentuity-cli-cloud-session-get) | `agentuity cloud session get` | Get details about a specific session |
| [agentuity-cli-cloud-session-list](./agentuity-cli-cloud-session-list) | `agentuity cloud session list` | List recent sessions |
| [agentuity-cli-cloud-session-logs](./agentuity-cli-cloud-session-logs) | `agentuity cloud session logs` | Get logs for a specific session |
| [agentuity-cli-cloud-ssh](./agentuity-cli-cloud-ssh) | `agentuity cloud ssh` | SSH into a cloud project or sandbox |
| [agentuity-cli-cloud-storage-create](./agentuity-cli-cloud-storage-create) | `agentuity cloud storage create` | Create a new storage resource |
| [agentuity-cli-cloud-storage-delete](./agentuity-cli-cloud-storage-delete) | `agentuity cloud storage delete` | Delete a storage resource or file |
| [agentuity-cli-cloud-storage-download](./agentuity-cli-cloud-storage-download) | `agentuity cloud storage download` | Download a file from storage bucket |
| [agentuity-cli-cloud-storage-get](./agentuity-cli-cloud-storage-get) | `agentuity cloud storage get` | Show details about a specific storage bucket |
| [agentuity-cli-cloud-storage-list](./agentuity-cli-cloud-storage-list) | `agentuity cloud storage list` | List storage resources or files in a bucket |
| [agentuity-cli-cloud-storage-upload](./agentuity-cli-cloud-storage-upload) | `agentuity cloud storage upload` | Upload a file to storage bucket |
| [agentuity-cli-cloud-stream-delete](./agentuity-cli-cloud-stream-delete) | `agentuity cloud stream delete` | Delete a stream by ID (soft delete) |
| [agentuity-cli-cloud-stream-get](./agentuity-cli-cloud-stream-get) | `agentuity cloud stream get` | Get detailed information about a specific stream |
| [agentuity-cli-cloud-stream-list](./agentuity-cli-cloud-stream-list) | `agentuity cloud stream list` | List recent streams with optional filtering |
| [agentuity-cli-cloud-thread-delete](./agentuity-cli-cloud-thread-delete) | `agentuity cloud thread delete` | Delete a thread |
| [agentuity-cli-cloud-thread-get](./agentuity-cli-cloud-thread-get) | `agentuity cloud thread get` | Get details about a specific thread |
| [agentuity-cli-cloud-thread-list](./agentuity-cli-cloud-thread-list) | `agentuity cloud thread list` | List recent threads |
| [agentuity-cli-cloud-vector-delete](./agentuity-cli-cloud-vector-delete) | `agentuity cloud vector delete` | Delete one or more vectors by key |
| [agentuity-cli-cloud-vector-delete-namespace](./agentuity-cli-cloud-vector-delete-namespace) | `agentuity cloud vector delete-namespace` | Delete a vector namespace and all its vectors |
| [agentuity-cli-cloud-vector-get](./agentuity-cli-cloud-vector-get) | `agentuity cloud vector get` | Get a specific vector entry by key |
| [agentuity-cli-cloud-vector-list-namespaces](./agentuity-cli-cloud-vector-list-namespaces) | `agentuity cloud vector list-namespaces` | List all vector namespaces |
| [agentuity-cli-cloud-vector-search](./agentuity-cli-cloud-vector-search) | `agentuity cloud vector search` | Search for vectors using semantic similarity |
| [agentuity-cli-cloud-vector-stats](./agentuity-cli-cloud-vector-stats) | `agentuity cloud vector stats` | Get statistics for vector storage |
| [agentuity-cli-cloud-vector-upsert](./agentuity-cli-cloud-vector-upsert) | `agentuity cloud vector upsert` | Add or update vectors in the vector storage |

### dev

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-dev](./agentuity-cli-dev) | `agentuity dev` | Build and run the development server |

### git

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-git-account-add](./agentuity-cli-git-account-add) | `agentuity git account add` | Add a GitHub account to your organization |
| [agentuity-cli-git-account-list](./agentuity-cli-git-account-list) | `agentuity git account list` | List GitHub accounts connected to your organizations |
| [agentuity-cli-git-account-remove](./agentuity-cli-git-account-remove) | `agentuity git account remove` | Remove a GitHub account from your organization |
| [agentuity-cli-git-link](./agentuity-cli-git-link) | `agentuity git link` | Link a project to a GitHub repository |
| [agentuity-cli-git-list](./agentuity-cli-git-list) | `agentuity git list` | List GitHub repositories accessible to your organization |
| [agentuity-cli-git-status](./agentuity-cli-git-status) | `agentuity git status` | Show GitHub connection status for current project |
| [agentuity-cli-git-unlink](./agentuity-cli-git-unlink) | `agentuity git unlink` | Unlink a project from its GitHub repository |

### project

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-project-auth-generate](./agentuity-cli-project-auth-generate) | `agentuity project auth generate` | Generate SQL schema for Agentuity Auth tables |
| [agentuity-cli-project-auth-init](./agentuity-cli-project-auth-init) | `agentuity project auth init` | Set up Agentuity Auth for your project |
| [agentuity-cli-project-create](./agentuity-cli-project-create) | `agentuity project create` | Create a new project |
| [agentuity-cli-project-delete](./agentuity-cli-project-delete) | `agentuity project delete` | Delete a project |
| [agentuity-cli-project-import](./agentuity-cli-project-import) | `agentuity project import` | Import or register a local project with Agentuity Cloud |
| [agentuity-cli-project-list](./agentuity-cli-project-list) | `agentuity project list` | List all projects |
| [agentuity-cli-project-show](./agentuity-cli-project-show) | `agentuity project show` | Show project detail |

### repl

| Skill | Command | Description |
|-------|---------|-------------|
| [agentuity-cli-repl](./agentuity-cli-repl) | `agentuity repl` | interactive REPL for testing |

## Usage

These skills are designed for AI coding agents that support the Agent Skills format.
Place this directory in your project or install globally for your agent to discover.

## Regenerating

To regenerate these skills with the latest CLI schema:

```bash
agentuity ai skills generate --output ./skills
```

---

*This file was auto-generated by the Agentuity CLI. Do not edit manually.*
