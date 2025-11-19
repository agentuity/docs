import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// EMAIL: Auto-respond to incoming emails
router.email('hello@example.com', async (c) => {
  // Parse incoming email
  const email = await c.req.email();

  c.logger.info('Email received', {
    from: email.from,
    subject: email.subject
  });

  const result = await c.agent.emailResponder.run({
    from: email.from,
    subject: email.subject,
    message: email.text
  });

  // TODO: Use c.reply() for proper email replies when available
  const response = `
Hello from Agentuity!

Thank you for your message:

Subject: ${email.subject}
Message: ${email.text}

We'll review it and get back to you soon.

Best regards,
Agentuity
  `.trim();

  return c.text(response);
});
