import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// GET with query string: /tasks?status=completed
router.get('/tasks', async (c) => {
  const status = c.req.query('status');
  const result = await c.agent.taskAgent.run({
    action: 'list',
    filter: status
  });
  return c.json(result);
});

// GET with route parameter: /tasks/:id
router.get('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.agent.taskAgent.run({
    action: 'get',
    id
  });
  return c.json(result);
});

// POST for creation
router.post('/tasks', async (c) => {
  const body = await c.req.json();
  const result = await c.agent.taskAgent.run({
    action: 'create',
    title: body.title,
    status: body.status
  });
  return c.json(result);
});

// PUT for updates
router.put('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = await c.agent.taskAgent.run({
    action: 'update',
    id,
    title: body.title,
    status: body.status
  });
  return c.json(result);
});

// DELETE for removal
router.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.agent.taskAgent.run({
    action: 'delete',
    id
  });
  return c.json(result);
});
