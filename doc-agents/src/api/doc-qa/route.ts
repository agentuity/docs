import { createRouter } from '@agentuity/runtime';
import docQAAgent from '@agent/doc_qa';
import { bearerTokenAuth } from '@middleware/auth';
import { documentPathToUrl } from '@utils/url';

const router = createRouter();

// POST /api/doc-qa - Answer questions about documentation (bearer token protected, no user context)
router.post('/', bearerTokenAuth, docQAAgent.validator(), async (c) => {
	const data = c.req.valid('json');
	const result = await docQAAgent.run(data);

	// Transform document URLs from raw paths to proper URLs
	if (result.documents && Array.isArray(result.documents)) {
		result.documents = result.documents.map((doc) => ({
			...doc,
			url: documentPathToUrl(doc.url),
		}));
	}

	return c.json(result);
});

export default router;
