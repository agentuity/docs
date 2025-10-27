from agentuity import AgentRequest, AgentResponse, AgentContext
from pydantic import BaseModel, Field
from typing import List, Literal
from anthropic import AsyncAnthropic
import json

# Define schema for routing decisions
class RoutingDecision(BaseModel):
    agent_type: Literal['support', 'sales', 'technical'] = Field(alias='agentType')
    tags: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str

    class Config:
        populate_by_name = True

client = AsyncAnthropic()

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    user_message = await request.data.text()

    context.logger.info('Analyzing request for routing')

    # Use AI to generate routing decision as JSON
    result = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        system="""You are a routing orchestrator. Analyze user messages and determine which
specialist agent should handle them. Consider the user's intent and return a structured
routing decision.

You MUST respond with valid JSON matching this schema:
{
    "agentType": "support" | "sales" | "technical",
    "tags": ["tag1", "tag2"],
    "confidence": 0.0-1.0,
    "reasoning": "why this agent"
}

Only respond with the JSON, no other text.""",
        messages=[{"role": "user", "content": f'Analyze this user message: "{user_message}"'}]
    )

    # Parse and validate the response
    try:
        decision_data = json.loads(result.content[0].text)
        decision = RoutingDecision(**decision_data)
    except Exception as e:
        context.logger.error(f'Failed to parse routing decision: {e}')
        return response.text("Sorry, I couldn't analyze your request properly.")

    context.logger.info(
        f'Routing decision: {decision.agent_type} (confidence: {decision.confidence})'
    )

    # Only route if confidence is high enough
    if decision.confidence < 0.7:
        return response.json({
            "message": "I'm not confident about routing this. Let me connect you with a human.",
            "reasoning": decision.reasoning,
            "tags": decision.tags
        })

    # Route to appropriate agent based on validated decision
    target_agent = await context.get_agent({"name": f"{decision.agent_type}-agent"})
    result = await target_agent.run(user_message)

    return response.text(await result.data.text())

def welcome():
    return {
        'welcome': 'Use Pydantic schemas with AI to make intelligent routing decisions with structured output.',
        'prompts': [
            {'data': 'I need help with my account password', 'contentType': 'text/plain'},
            {'data': 'Can you tell me about pricing plans?', 'contentType': 'text/plain'},
            {'data': 'The API is returning 500 errors', 'contentType': 'text/plain'}
        ]
    }
