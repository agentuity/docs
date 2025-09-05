'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Session, Message } from './types';

export async function createNewSession(formData: FormData) {
  const content = formData.get('message') as string;
  if (!content) {
    throw new Error('Message required');
  }

  const newSessionId = crypto.randomUUID();
  const userMessage: Message = {
    id: crypto.randomUUID(),
    author: 'USER',
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };

  const newSession: Session = {
    sessionId: newSessionId,
    messages: [userMessage],
  };

  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSession),
  });

  if (!response.ok) {
    throw new Error('Failed to create session');
  }

  const data = await response.json();
  if (!data.session) {
    throw new Error('Invalid response');
  }

  revalidatePath('/chat');
  redirect(`/chat/${newSessionId}`);
}
