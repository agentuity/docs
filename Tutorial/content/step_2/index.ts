import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import OpenAI from "openai";

export default async function CustomerSupportAgent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Log that we received a request
  context.logger.info("Customer support agent received request");

  // Get the trigger type and request data
  const triggerType = request.trigger;
  const requestText = await request.data.text();

  // Initialize OpenAI client
  const openai = new OpenAI();

  try {
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: requestText }],
      model: "gpt-3.5-turbo",
    });
    const aiResponse = completion.choices[0]?.message?.content ?? "No response generated";

    return response.json({
      message: aiResponse,
      status: "success"
    });

  } catch (error) {
    context.logger.error("OpenAI API error: %s", error);
    return response.json({
      message: "Sorry, I encountered an error processing your request.",
      status: "error"
    });
  }
}