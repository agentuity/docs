/**
 * Stub implementation for agent functionality during build time
 * This prevents loading of @agentuity/sdk and related dependencies
 */

export default function AgentStub() {
  throw new Error('Agent functionality not available in this environment');
}

export const createTools = () => {
  throw new Error('Agent tools not available in this environment');
};
