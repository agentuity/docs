import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint to upload and manage files
router.post('/files/upload', async (c) => {
  const data = await c.req.json();

  const result = await c.agent.objectStorageAgent.run({
    content: data.content,
    filename: data.filename
  });

  return c.json(result);
});

export default router;
