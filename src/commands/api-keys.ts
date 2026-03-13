import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { tableBorder } from '../utils/format.js';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key?: string;
  last_used_at?: string;
  created_at: string;
  revoked_at?: string;
}

interface ApiKeysResponse {
  data: ApiKey[];
}

interface ApiKeyResponse {
  data?: ApiKey;
  id?: string;
  key?: string;
}

export async function apiKeysCommand(action?: string, nameOrId?: string): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listApiKeys();
      break;
    case 'create':
    case 'add':
      if (!nameOrId) {
        console.log(chalk.red('✗ Name required. Usage: unosend api-keys create <name>'));
        process.exit(1);
      }
      await createApiKey(nameOrId);
      break;
    case 'revoke':
    case 'delete':
    case 'rm':
      if (!nameOrId) {
        console.log(chalk.red('✗ API key ID required. Usage: unosend api-keys revoke <id>'));
        process.exit(1);
      }
      await revokeApiKey(nameOrId);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, create, revoke'));
      process.exit(1);
  }
}

async function listApiKeys(): Promise<void> {
  const spinner = ora('Fetching API keys...').start();
  
  const result = await apiRequest<ApiKeysResponse>('/api-keys');
  
  if (!result.success) {
    spinner.fail('Failed to fetch API keys');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const keys = result.data?.data || [];
  
  if (keys.length === 0) {
    console.log(chalk.yellow('\n📭 No API keys found.'));
    console.log(chalk.gray('   Create one with: unosend api-keys create <name>\n'));
    return;
  }

  console.log(chalk.cyan(`\n🔑 API Keys (${keys.length}):\n`));

  const tableData = [
    [chalk.white.bold('Name'), chalk.white.bold('Prefix'), chalk.white.bold('Last Used'), chalk.white.bold('Status'), chalk.white.bold('ID')],
    ...keys.map((k: ApiKey) => [
      chalk.white(k.name),
      chalk.gray(k.key_prefix + '...'),
      chalk.gray(k.last_used_at ? formatDate(k.last_used_at) : 'Never'),
      k.revoked_at ? chalk.red('Revoked') : chalk.green('Active'),
      chalk.gray(k.id.slice(0, 8)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function createApiKey(name: string): Promise<void> {
  const spinner = ora(`Creating API key "${name}"...`).start();
  
  const result = await apiRequest<ApiKeyResponse>('/api-keys', {
    method: 'POST',
    body: { name },
  });

  if (!result.success) {
    spinner.fail('Failed to create API key');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('API key created!');
  
  const key = result.data?.data || result.data;
  if (key?.key) {
    console.log();
    console.log(chalk.yellow('  ⚠️  Save this key now - it won\'t be shown again!'));
    console.log();
    console.log(chalk.white('  API Key: '), chalk.green(key.key));
    console.log(chalk.white('  ID:      '), chalk.gray(key.id));
  }
  console.log();
}

async function revokeApiKey(id: string): Promise<void> {
  const spinner = ora('Revoking API key...').start();
  
  const result = await apiRequest(`/api-keys/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to revoke API key');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('API key revoked.');
  console.log(chalk.yellow('  Note: This key can no longer be used for authentication.\n'));
}
