import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

/* Different routes for different triggers */

// HTTP: Send notification on-demand
router.post('/notify', async (c) => {
  const body = await c.req.json();

  const result = await c.agent.notificationAgent.run({
    recipient: body.recipient,
    message: body.message
  });

  return c.json(result);
});

// CRON: Send daily digest at 9 AM
router.cron('0 9 * * *', async (c) => {
  c.logger.info('Cron: Sending daily digest');

  const recipients = ['user1@example.com', 'user2@example.com'];

  // Send to all recipients
  for (const recipient of recipients) {
    await c.agent.notificationAgent.run({
      recipient,
      message: 'Your daily digest is ready'
    });
  }

  c.logger.info('Daily digest sent', { count: recipients.length });

  return c.json({ sent: recipients.length });
});

// EMAIL: Forward email as notification
router.email('notify@example.com', async (c) => {
  const email = await c.req.email();

  await c.agent.notificationAgent.run({
    recipient: email.from,
    message: `Email received: ${email.subject}`
  });

  return c.text('Notification sent!');
});
