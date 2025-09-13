import { Session, Message, TutorialData } from '../../app/chat/types';

export interface TutorialProgressRequest {
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
}

export interface TutorialResetRequest {
  tutorialId: string;
}

export interface SessionMessageRequest {
  message: Message;
  processWithAgent?: boolean;
}

export interface SessionCreateRequest extends Session {}

export interface SessionUpdateRequest extends Session {}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  cursor: number;
  nextCursor: number | null;
  hasMore: boolean;
  total: number;
  limit: number;
}

export interface SessionsResponse extends ApiResponse {
  sessions: Session[];
  pagination: PaginationInfo;
}
