import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { syncDocsFromPayload } from './docs-orchestrator';
import type { SyncPayload } from './types';

export const welcome = () => {
	return {
		welcome:
			'Documentation Sync Agent - Processes embedded MDX content from GitHub workflows',
		prompts: [
			{
				data: 'Sync documentation changes from GitHub',
				contentType: 'text/plain',
			},
		],
	};
};

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	try {
		const payload = (await req.data.json()) as unknown as SyncPayload;

		// Validate that at least one operation is requested
		if (
			(!payload.changed || payload.changed.length === 0) &&
			(!payload.removed || payload.removed.length === 0)
		) {
			return resp.json(
				{
					error:
						'Invalid payload format. Must provide at least one of: changed files or removed files',
				},
				400
			);
		}

		// Validate changed files if present
		if (payload.changed) {
			if (!Array.isArray(payload.changed)) {
				return resp.json(
					{
						error: 'Invalid payload format. Changed files must be an array',
					},
					400
				);
			}

			for (const file of payload.changed) {
				if (
					!file.path ||
					!file.content ||
					typeof file.path !== 'string' ||
					typeof file.content !== 'string'
				) {
					return resp.json(
						{
							error:
								'Invalid file format. Each changed file must have {path: string, content: string}',
						},
						400
					);
				}
			}
		}

		// Validate removed files if present
		if (payload.removed) {
			if (!Array.isArray(payload.removed)) {
				return resp.json(
					{
						error: 'Invalid payload format. Removed files must be an array',
					},
					400
				);
			}

			for (const file of payload.removed) {
				if (typeof file !== 'string') {
					return resp.json(
						{
							error:
								'Invalid removed file format. Each removed file must be a string path',
						},
						400
					);
				}
			}
		}

		ctx.logger.info(
			'Processing payload: %d changed files, %d removed files',
			payload.changed?.length || 0,
			payload.removed?.length || 0
		);

		const stats = await syncDocsFromPayload(ctx, {
			commit: payload.commit,
			repo: payload.repo,
			changed: payload.changed || [],
			removed: payload.removed || [],
		});
		return resp.json({ status: 'ok', stats });
	} catch (error) {
		ctx.logger.error('Error running sync agent:', error);
		let message = 'Unknown error';
		if (error instanceof Error) {
			message = error.message;
		} else if (typeof error === 'string') {
			message = error;
		}
		return resp.json({ error: message }, 500);
	}
}
