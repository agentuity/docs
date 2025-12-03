import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// ===== Different Input Formats =====

// Parse JSON body
router.post('/tasks/json', async (c) => {
  const body = await c.req.json();
  const result = await c.agent.taskAgent.run({
    action: 'create',
    title: body.title,
    status: body.status
  });
  return c.json(result);
});

// Parse plain text
router.post('/tasks/text', async (c) => {
  const title = await c.req.text();
  const result = await c.agent.taskAgent.run({
    action: 'create',
    title
  });
  return c.json(result);
});

// Parse form data
router.post('/tasks/form', async (c) => {
  const formData = await c.req.formData();
  const title = formData.get('title') as string;
  const status = formData.get('status') as 'pending' | 'completed';

  const result = await c.agent.taskAgent.run({
    action: 'create',
    title,
    status
  });
  return c.json(result);
});

// ===== Different Response Types =====

// Return JSON
router.get('/tasks/:id/json', async (c) => {
  const id = c.req.param('id');
  const result = await c.agent.taskAgent.run({
    action: 'get',
    id
  });
  return c.json(result);
});

// Return plain text
router.get('/tasks/:id/text', async (c) => {
  const id = c.req.param('id');
  const result = await c.agent.taskAgent.run({
    action: 'get',
    id
  });

  const text = `Task ${id}: ${result.task?.title}`;
  return c.text(text);
});

// Return HTML
router.get('/tasks/:id/html', async (c) => {
  const id = c.req.param('id');
  const result = await c.agent.taskAgent.run({
    action: 'get',
    id
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Task ${id}</title></head>
      <body>
        <h1>${result.task?.title}</h1>
        <p>Status: ${result.task?.status}</p>
      </body>
    </html>
  `;
  return c.html(html);
});

// Redirect example
router.get('/task', async (c) => {
  const id = c.req.query('id');
  if (!id) {
    return c.redirect('/tasks');
  }
  return c.redirect(`/tasks/${id}`);
});

// ===== Content Negotiation =====

// Respond based on Accept header
router.get('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const accept = c.req.header('Accept');
  const result = await c.agent.taskAgent.run({
    action: 'get',
    id
  });

  // Check what format client wants
  if (accept?.includes('text/html')) {
    return c.html(`<h1>${result.task?.title}</h1>`);
  }if (accept?.includes('text/plain')) {
    return c.text(result.task?.title || '');
  }
    return c.json(result);
});

// ===== Custom Status Codes & Headers =====

router.get('/tasks/:id/status', async (c) => {
  const id = c.req.param('id');

  try {
    const result = await c.agent.taskAgent.run({
      action: 'get',
      id
    });

    // Return with custom headers
    return c.json(result, {
      status: 200,
      headers: {
        'X-Task-Version': '1.0',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    // Return 404 with error message
    return c.json(
      { error: 'Task not found' },
      { status: 404 }
    );
  }
});
