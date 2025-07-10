# User Metadata
{
    "email": string;
    "completedTutorial":
}

# Message
{
    "sender": "username" | "Pulse";
    "createdAt": DateTime;
    "content": string;
    "type": "markdown" | "action"
}

{
    "name": string;
    "steps": 
}

# Chat Session
{
    "type": "default" | "tutorial";
    "messages": Message[];
    "tutorial": 
}