export interface ConversationMessage {
	author: 'USER' | 'ASSISTANT';
	content: string;
}

export interface TutorialState {
	tutorialId: string;
	currentStep: number;
}

export interface Tutorial {
	id: string;
	title: string;
	description: string;
	totalSteps: number;
	difficulty?: string;
	estimatedTime?: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	details?: any;
	status?: number;
}

export enum ActionType {
	START_TUTORIAL_STEP = 'start_tutorial_step',
}

export interface Action {
	type: ActionType;
	tutorialId: string;
	currentStep: number;
	totalSteps: number;
}

export interface StreamingChunk {
	type: 'text-delta' | 'status' | 'tutorial-data' | 'finish' | 'error';
	textDelta?: string;
	message?: string;
	category?: string;
	tutorialData?: Action;
	error?: string;
	details?: string;
}
