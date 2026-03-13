import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { tableBorder } from '../utils/format.js';

interface Audience {
  id: string;
  name: string;
  description?: string;
  contacts_count: number;
  created_at: string;
}

interface AudiencesResponse {
  data: Audience[];
}

interface AudienceResponse {
  data?: Audience;
  id?: string;
}

export async function audiencesCommand(action?: string, nameOrId?: string, options?: Record<string, string>): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listAudiences();
      break;
    case 'add':
    case 'create':
      if (!nameOrId) {
        console.log(chalk.red('✗ Name required. Usage: unosend audiences add <name> [--description <desc>]'));
        process.exit(1);
      }
      await addAudience(nameOrId, options?.description);
      break;
    case 'get':
    case 'show':
      if (!nameOrId) {
        console.log(chalk.red('✗ Audience ID required. Usage: unosend audiences get <id>'));
        process.exit(1);
      }
      await getAudience(nameOrId);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!nameOrId) {
        console.log(chalk.red('✗ Audience ID required. Usage: unosend audiences remove <id>'));
        process.exit(1);
      }
      await removeAudience(nameOrId);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, add, get, remove'));
      process.exit(1);
  }
}

async function listAudiences(): Promise<void> {
  const spinner = ora('Fetching audiences...').start();
  
  const result = await apiRequest<AudiencesResponse>('/audiences');
  
  if (!result.success) {
    spinner.fail('Failed to fetch audiences');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const audiences = result.data?.data || [];
  
  if (audiences.length === 0) {
    console.log(chalk.yellow('\n📭 No audiences found.'));
    console.log(chalk.gray('   Create one with: unosend audiences add <name>\n'));
    return;
  }

  console.log(chalk.cyan(`\n📋 Audiences (${audiences.length}):\n`));

  const tableData = [
    [chalk.white.bold('Name'), chalk.white.bold('Contacts'), chalk.white.bold('ID'), chalk.white.bold('Created')],
    ...audiences.map((a: Audience) => [
      chalk.white(a.name),
      chalk.cyan(String(a.contacts_count)),
      chalk.gray(a.id.slice(0, 8)),
      chalk.gray(formatDate(a.created_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function addAudience(name: string, description?: string): Promise<void> {
  const spinner = ora(`Creating audience "${name}"...`).start();
  
  const body: Record<string, unknown> = { name };
  if (description) body.description = description;
  
  const result = await apiRequest<AudienceResponse>('/audiences', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to create audience');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed(`Audience "${name}" created!`);
  console.log(chalk.gray(`  ID: ${result.data?.id || result.data?.data?.id}\n`));
}

async function getAudience(id: string): Promise<void> {
  const spinner = ora('Fetching audience...').start();
  
  const result = await apiRequest<{ data: Audience }>(`/audiences/${id}`);

  if (!result.success) {
    spinner.fail('Audience not found');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const a = result.data?.data;
  if (!a) {
    console.log(chalk.red('✗ Audience not found'));
    return;
  }

  console.log(chalk.cyan(`\n📋 Audience: ${a.name}\n`));
  console.log(chalk.white('  ID:          '), chalk.gray(a.id));
  console.log(chalk.white('  Contacts:    '), chalk.cyan(String(a.contacts_count)));
  if (a.description) {
    console.log(chalk.white('  Description: '), chalk.gray(a.description));
  }
  console.log(chalk.white('  Created:     '), chalk.gray(formatDate(a.created_at)));
  console.log();
}

async function removeAudience(id: string): Promise<void> {
  const spinner = ora('Removing audience...').start();
  
  const result = await apiRequest(`/audiences/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to remove audience');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('Audience removed.');
}
