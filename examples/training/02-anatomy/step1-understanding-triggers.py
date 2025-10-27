from agentuity import AgentRequest, AgentResponse, AgentContext
import json

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get the trigger type
    trigger = request.trigger

    context.logger.info(f"Agent triggered via: {trigger}")

    # Different behavior based on trigger
    if trigger == "webhook":
        return response.json({
            "message": "Received webhook trigger",
            "tip": "Webhooks are great for REST APIs and integrations"
        })
    elif trigger == "cron":
        return response.json({
            "message": "Scheduled task executed",
            "tip": "Cron triggers run automatically on schedule"
        })
    elif trigger == "manual":
        return response.json({
            "message": "Manual trigger from DevMode or Console",
            "tip": "Manual triggers are perfect for testing"
        })
    else:
        return response.json({
            "message": f"Triggered via: {trigger}",
            "availableTriggers": ["webhook", "cron", "manual", "agent", "sms", "email"]
        })

def welcome():
    return {
        'welcome': 'Learn how agents respond to different trigger types (webhook, cron, manual).',
        'prompts': [
            {'data': 'Test manual trigger', 'contentType': 'text/plain'},
            {'data': json.dumps({'test': 'data'}), 'contentType': 'application/json'}
        ]
    }
