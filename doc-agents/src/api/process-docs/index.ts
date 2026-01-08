import { createRouter } from '@agentuity/runtime';
import docProcessingAgent from '@agent/doc_processing/agent';

const router = createRouter();

// Health check endpoint
router.get('/', async (c) => {
	return c.json({ status: 'ok', service: 'doc-processing' });
});

export default router;
