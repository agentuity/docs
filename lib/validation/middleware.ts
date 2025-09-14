import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MessageSchema, SessionSchema } from '@/app/chat/types';

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

function zodErrorToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    received: err.received
  }));
}

export async function parseAndValidateJSON<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
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

  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = zodErrorToValidationErrors(result.error);
    return {
      success: false,
      response: createValidationError('Validation failed', errors)
    };
  }

  return { success: true, data: result.data };
}

export const TutorialProgressRequestSchema = z.object({
  tutorialId: z.string().min(1),
  currentStep: z.number().int().min(0),
  totalSteps: z.number().int().min(1)
});

export const TutorialResetRequestSchema = z.object({
  tutorialId: z.string().min(1)
});

export const SessionMessageRequestSchema = z.object({
  message: MessageSchema,
  processWithAgent: z.boolean().optional().default(true)
});

export const SessionMessageOnlyRequestSchema = z.object({
  message: MessageSchema
});

export const StepNumberSchema = z.string().transform((val, ctx) => {
  const stepIndex = Number.parseInt(val, 10);

  if (Number.isNaN(stepIndex)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be a valid integer',
    });
    return z.NEVER;
  }

  if (stepIndex < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be greater than 0',
    });
    return z.NEVER;
  }

  return stepIndex;
});

export const TutorialIdSchema = z.string().min(1, 'must be a non-empty string').refine(
  (id) => !id.includes('..') && !id.includes('/') && !id.includes('\\'),
  'contains invalid characters (path traversal attempt)'
);

export function validateStepNumber(stepNumber: string): ValidationResult<number> {
  const result = StepNumberSchema.safeParse(stepNumber);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => ({
        field: 'stepNumber',
        message: issue.message,
        received: stepNumber
      }))
    };
  }

  return { success: true, data: result.data };
}

export function validateTutorialId(id: string): ValidationResult<string> {
  const result = TutorialIdSchema.safeParse(id);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => ({
        field: 'tutorialId',
        message: issue.message,
        received: id
      }))
    };
  }

  return { success: true, data: result.data };
}