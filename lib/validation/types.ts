import type { Session, Message, TutorialData, ExecuteRequest } from '../../app/chat/types';
import type { 
  TutorialProgressRequest,
  TutorialResetRequest,
  SessionMessageRequest,
  SessionMessageOnlyRequest
} from './middleware';

export type {
  Session,
  Message,
  TutorialData,
  ExecuteRequest
};

export type {
  TutorialProgressRequest,
  TutorialResetRequest,
  SessionMessageRequest,
  SessionMessageOnlyRequest
};

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
