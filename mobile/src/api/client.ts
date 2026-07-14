import { supabase } from '@/src/auth/supabase';

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function isFormDataBody(body: RequestInit['body']) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!baseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL');
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in again');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.body && !isFormDataBody(init.body) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code || 'REQUEST_FAILED',
      payload?.error?.message || 'The request could not be completed'
    );
  }

  return payload as T;
}
