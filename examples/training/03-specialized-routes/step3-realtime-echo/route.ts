import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// WEBSOCKET: Bidirectional echo
router.websocket('/echo', {
  onOpen: (ws, c) => {
    c.logger.info('WebSocket connection opened');
    ws.send(JSON.stringify({
      message: 'Connected! Send a message.'
    }));
  },

  onMessage: async (ws, message, c) => {
    const text = message.toString();

    // Echo the message back through the agent
    const result = await c.agent.echoAgent.run({ message: text });

    ws.send(JSON.stringify(result));
  },

  onClose: (ws, c) => {
    c.logger.info('WebSocket connection closed');
  }
});

// SSE: Server-to-client updates
router.sse('/updates', async (c) => {
  c.logger.info('SSE stream started');

  return c.stream(async (stream) => {
    // Send initial message
    await stream.send(JSON.stringify({
      message: 'Stream started'
    }));

    // Send periodic updates every 5 seconds
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      await stream.send(JSON.stringify({
        message: `Update #${count}`,
        timestamp: new Date().toISOString()
      }));
    }, 5000);

    // Cleanup when client disconnects
    stream.onClose(() => {
      clearInterval(interval);
      c.logger.info('SSE stream closed');
    });
  });
});
