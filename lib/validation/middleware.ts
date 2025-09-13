import { NextRequest, NextResponse } from 'next/server';
import { Session, Message, TutorialData, ExecuteRequest } from '@/app/chat/types';
import { 
  TutorialProgressRequest, 
  TutorialResetRequest, 
  SessionMessageRequest 
} from './types';

export interface ValidationError {
  field: string;
  message: string;
  received?: any;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export function createValidationError(message: string, errors: ValidationError[]): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details: errors.map(err => `${err.field}: ${err.message}`)
    },
    { status: 400 }
  );
}

export function validateString(value: any, fieldName: string, required = true): ValidationError | null {
  if (required && (value === undefined || value === null)) {
    return { field: fieldName, message: 'is required', received: value };
  }
  if (value !== undefined && value !== null && typeof value !== 'string') {
    return { field: fieldName, message: 'must be a string', received: typeof value };
  }
  if (required && typeof value === 'string' && value.trim() === '') {
    return { field: fieldName, message: 'cannot be empty', received: value };
  }
  return null;
}

export function validateNumber(value: any, fieldName: string, required = true, options?: { min?: number; max?: number; integer?: boolean }): ValidationError | null {
  if (required && (value === undefined || value === null)) {
    return { field: fieldName, message: 'is required', received: value };
  }
  if (value !== undefined && value !== null && typeof value !== 'number') {
    return { field: fieldName, message: 'must be a number', received: typeof value };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { field: fieldName, message: 'must be a finite number', received: value };
    }
    if (options?.integer && !Number.isInteger(value)) {
      return { field: fieldName, message: 'must be an integer', received: value };
    }
    if (options?.min !== undefined && value < options.min) {
      return { field: fieldName, message: `must be at least ${options.min}`, received: value };
    }
    if (options?.max !== undefined && value > options.max) {
      return { field: fieldName, message: `must be at most ${options.max}`, received: value };
    }
  }
  return null;
}

export function validateMessage(message: any): ValidationResult<Message> {
  const errors: ValidationError[] = [];
  
  if (!message || typeof message !== 'object') {
    return { success: false, errors: [{ field: 'message', message: 'must be an object', received: typeof message }] };
  }

  const idError = validateString(message.id, 'id');
  if (idError) errors.push(idError);

  if (message.author !== 'USER' && message.author !== 'ASSISTANT') {
    errors.push({ field: 'author', message: 'must be either "USER" or "ASSISTANT"', received: message.author });
  }

  const contentError = validateString(message.content, 'content');
  if (contentError) errors.push(contentError);

  const timestampError = validateString(message.timestamp, 'timestamp');
  if (timestampError) errors.push(timestampError);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: message as Message };
}

export function validateSession(session: any): ValidationResult<Session> {
  const errors: ValidationError[] = [];
  
  if (!session || typeof session !== 'object') {
    return { success: false, errors: [{ field: 'session', message: 'must be an object', received: typeof session }] };
  }

  const sessionIdError = validateString(session.sessionId, 'sessionId');
  if (sessionIdError) errors.push(sessionIdError);

  if (!Array.isArray(session.messages)) {
    errors.push({ field: 'messages', message: 'must be an array', received: typeof session.messages });
  } else {
    session.messages.forEach((message: any, index: number) => {
      const messageValidation = validateMessage(message);
      if (!messageValidation.success && messageValidation.errors) {
        messageValidation.errors.forEach(error => {
          errors.push({ field: `messages[${index}].${error.field}`, message: error.message, received: error.received });
        });
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: session as Session };
}

export function validateTutorialProgressRequest(body: any): ValidationResult<{ tutorialId: string; currentStep: number; totalSteps: number }> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'must be an object', received: typeof body }] };
  }

  const tutorialIdError = validateString(body.tutorialId, 'tutorialId');
  if (tutorialIdError) errors.push(tutorialIdError);

  const currentStepError = validateNumber(body.currentStep, 'currentStep', true, { integer: true, min: 0 });
  if (currentStepError) errors.push(currentStepError);

  const totalStepsError = validateNumber(body.totalSteps, 'totalSteps', true, { integer: true, min: 1 });
  if (totalStepsError) errors.push(totalStepsError);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { tutorialId: body.tutorialId, currentStep: body.currentStep, totalSteps: body.totalSteps } };
}

export function validateTutorialResetRequest(body: any): ValidationResult<{ tutorialId: string }> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'must be an object', received: typeof body }] };
  }

  const tutorialIdError = validateString(body.tutorialId, 'tutorialId');
  if (tutorialIdError) errors.push(tutorialIdError);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { tutorialId: body.tutorialId } };
}

export function validateExecuteRequest(body: any): ValidationResult<ExecuteRequest> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { success: false, errors: [{ field: 'body', message: 'must be an object', received: typeof body }] };
  }

  const codeError = validateString(body.code, 'code');
  if (codeError) errors.push(codeError);

  const filenameError = validateString(body.filename, 'filename');
  if (filenameError) errors.push(filenameError);

  const sessionIdError = validateString(body.sessionId, 'sessionId');
  if (sessionIdError) errors.push(sessionIdError);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body as ExecuteRequest };
}

export function validateStepNumber(stepNumber: string): ValidationResult<number> {
  const stepIndex = Number.parseInt(stepNumber, 10);
  
  if (Number.isNaN(stepIndex)) {
    return { 
      success: false, 
      errors: [{ field: 'stepNumber', message: 'must be a valid integer', received: stepNumber }] 
    };
  }
  
  if (stepIndex < 1) {
    return { 
      success: false, 
      errors: [{ field: 'stepNumber', message: 'must be greater than 0', received: stepIndex }] 
    };
  }
  
  return { success: true, data: stepIndex };
}

export function validateTutorialId(id: string): ValidationResult<string> {
  if (!id || typeof id !== 'string') {
    return { 
      success: false, 
      errors: [{ field: 'tutorialId', message: 'must be a non-empty string', received: typeof id }] 
    };
  }
  
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    return { 
      success: false, 
      errors: [{ field: 'tutorialId', message: 'contains invalid characters (path traversal attempt)', received: id }] 
    };
  }
  
  return { success: true, data: id };
}

export async function parseAndValidateJSON<T>(
  request: NextRequest,
  validator: (body: any) => ValidationResult<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: any;
  
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    };
  }

  const validation = validator(body);
  if (!validation.success) {
    return {
      success: false,
      response: createValidationError('Validation failed', validation.errors || [])
    };
  }

  return { success: true, data: validation.data! };
}
