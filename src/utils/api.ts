import chalk from 'chalk';
import { getConfig } from './config.js';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const config = getConfig();
  
  if (!config.apiKey) {
    return {
      success: false,
      error: 'No API key configured. Run `unosend init` first.',
    };
  }

  const { method = 'GET', body } = options;
  const url = `${config.apiUrl}/api/v1${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function handleError(error: string): never {
  console.error(chalk.red('✗ Error:'), error);
  process.exit(1);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}
