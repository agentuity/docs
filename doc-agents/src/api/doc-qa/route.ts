import { createRouter } from '@agentuity/runtime';
import docQAAgent from '@agent/doc_qa';

const router = createRouter();

// POST /api/doc-qa - Answer questions about documentation
router.post('/', docQAAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await docQAAgent.run(data);
	return c.json(result);
});

export default router;
