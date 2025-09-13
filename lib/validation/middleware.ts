import { NextRequest, NextResponse } from 'next/server';

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

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  pattern?: RegExp;
  enumValues?: string[];
  arrayItemSchema?: FieldSchema;
  objectSchema?: Record<string, FieldSchema>;
  customValidator?: (value: any, fieldName: string) => ValidationError | null;
}

export interface ValidationSchema {
  [fieldName: string]: FieldSchema;
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

export function validateField(value: any, fieldName: string, schema: FieldSchema): ValidationError | null {
  if (schema.required && (value === undefined || value === null)) {
    return { field: fieldName, message: 'is required', received: value };
  }

  if (!schema.required && (value === undefined || value === null)) {
    return null;
  }

  if (schema.customValidator) {
    return schema.customValidator(value, fieldName);
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { field: fieldName, message: 'must be a string', received: typeof value };
      }
      if (schema.required && value.trim() === '') {
        return { field: fieldName, message: 'cannot be empty', received: value };
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        return { field: fieldName, message: `must be at least ${schema.minLength} characters`, received: value.length };
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        return { field: fieldName, message: `must be at most ${schema.maxLength} characters`, received: value.length };
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        return { field: fieldName, message: 'format is invalid', received: value };
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        return { field: fieldName, message: 'must be a number', received: typeof value };
      }
      if (!Number.isFinite(value)) {
        return { field: fieldName, message: 'must be a finite number', received: value };
      }
      if (schema.integer && !Number.isInteger(value)) {
        return { field: fieldName, message: 'must be an integer', received: value };
      }
      if (schema.min !== undefined && value < schema.min) {
        return { field: fieldName, message: `must be at least ${schema.min}`, received: value };
      }
      if (schema.max !== undefined && value > schema.max) {
        return { field: fieldName, message: `must be at most ${schema.max}`, received: value };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field: fieldName, message: 'must be a boolean', received: typeof value };
      }
      break;

    case 'enum':
      if (!schema.enumValues || !schema.enumValues.includes(value)) {
        return { 
          field: fieldName, 
          message: `must be one of: ${schema.enumValues?.join(', ')}`, 
          received: value 
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { field: fieldName, message: 'must be an array', received: typeof value };
      }
      if (schema.arrayItemSchema) {
        for (let i = 0; i < value.length; i++) {
          const itemError = validateField(value[i], `${fieldName}[${i}]`, schema.arrayItemSchema);
          if (itemError) return itemError;
        }
      }
      break;

    case 'object':
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { field: fieldName, message: 'must be an object', received: typeof value };
      }
      if (schema.objectSchema) {
        for (const [propName, propSchema] of Object.entries(schema.objectSchema)) {
          const propError = validateField(value[propName], `${fieldName}.${propName}`, propSchema);
          if (propError) return propError;
        }
      }
      break;

    default:
      return { field: fieldName, message: `unknown validation type: ${schema.type}`, received: value };
  }

  return null;
}

export function validateObject<T = any>(obj: any, schema: ValidationSchema): ValidationResult<T> {
  const errors: ValidationError[] = [];

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { success: false, errors: [{ field: 'root', message: 'must be an object', received: typeof obj }] };
  }

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const error = validateField(obj[fieldName], fieldName, fieldSchema);
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: obj as T };
}

export function validateString(value: any, fieldName: string, required = true): ValidationError | null {
  return validateField(value, fieldName, { type: 'string', required });
}

export function validateNumber(value: any, fieldName: string, required = true, options?: { min?: number; max?: number; integer?: boolean }): ValidationError | null {
  return validateField(value, fieldName, { 
    type: 'number', 
    required, 
    min: options?.min, 
    max: options?.max, 
    integer: options?.integer 
  });
}

export const MessageSchema: ValidationSchema = {
  id: { type: 'string', required: true },
  author: { type: 'enum', required: true, enumValues: ['USER', 'ASSISTANT'] },
  content: { type: 'string', required: true },
  timestamp: { type: 'string', required: true },
  tutorialData: { type: 'object', required: false }
};

export function validateMessage(message: any): ValidationResult<any> {
  return validateObject(message, MessageSchema);
}

export const SessionSchema: ValidationSchema = {
  sessionId: { type: 'string', required: true },
  messages: { 
    type: 'array', 
    required: true,
    arrayItemSchema: { type: 'object', required: true, objectSchema: MessageSchema }
  },
  isTutorial: { type: 'boolean', required: false },
  title: { type: 'string', required: false }
};

export function validateSession(session: any): ValidationResult<any> {
  return validateObject(session, SessionSchema);
}

export const TutorialProgressRequestSchema: ValidationSchema = {
  tutorialId: { type: 'string', required: true },
  currentStep: { type: 'number', required: true, integer: true, min: 0 },
  totalSteps: { type: 'number', required: true, integer: true, min: 1 }
};

export function validateTutorialProgressRequest(body: any): ValidationResult<any> {
  return validateObject(body, TutorialProgressRequestSchema);
}

export const TutorialResetRequestSchema: ValidationSchema = {
  tutorialId: { type: 'string', required: true }
};

export function validateTutorialResetRequest(body: any): ValidationResult<any> {
  return validateObject(body, TutorialResetRequestSchema);
}

export const ExecuteRequestSchema: ValidationSchema = {
  code: { type: 'string', required: true },
  filename: { type: 'string', required: true },
  sessionId: { type: 'string', required: true }
};

export function validateExecuteRequest(body: any): ValidationResult<any> {
  return validateObject(body, ExecuteRequestSchema);
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
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }>;

export async function parseAndValidateJSON<T>(
  request: NextRequest,
  schema: ValidationSchema
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }>;

export async function parseAndValidateJSON<T>(
  request: NextRequest,
  validatorOrSchema: ((body: any) => ValidationResult<T>) | ValidationSchema
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

  let validation: ValidationResult<T>;
  
  if (typeof validatorOrSchema === 'function') {
    validation = validatorOrSchema(body);
  } else {
    validation = validateObject<T>(body, validatorOrSchema);
  }

  if (!validation.success) {
    return {
      success: false,
      response: createValidationError('Validation failed', validation.errors || [])
    };
  }

  return { success: true, data: validation.data! };
}
