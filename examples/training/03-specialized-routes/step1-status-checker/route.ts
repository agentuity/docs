import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// HTTP: Query current status
router.get('/status/:service', async (c) => {
  const service = c.req.param('service');
  const result = await c.agent.statusChecker.run({ service });
  return c.json(result);
});

// CRON: Update status every hour
// Cron expression: '0 * * * *' = minute 0 of every hour
router.cron('0 * * * *', async (c) => {
  c.logger.info('Cron: Updating service status');

  const services = ['api', 'database', 'cache'];

  // Update status for each service
  for (const service of services) {
    await c.kv.set('status', service, {
      service,
      status: 'up',
      lastCheck: new Date().toISOString()
    }, { ttl: 3600 }); // Cache for 1 hour
  }

  c.logger.info('Status update complete', { count: services.length });

  return c.json({ updated: services.length });
});
