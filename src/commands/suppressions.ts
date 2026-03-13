import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder } from '../utils/format.js';

interface Suppression {
  id: string;
  email: string;
  reason: string;
  created_at: string;
}

interface SuppressionsResponse {
  data: Suppression[];
}

export async function suppressionsCommand(action?: string, emailOrId?: string, options?: Record<string, string>): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listSuppressions(options?.limit || '20');
      break;
    case 'add':
    case 'create':
      if (!emailOrId) {
        console.log(chalk.red('✗ Email required. Usage: unosend suppressions add <email> [--reason <reason>]'));
        process.exit(1);
      }
      await addSuppression(emailOrId, options?.reason);
      break;
    case 'get':
    case 'show':
      if (!emailOrId) {
        console.log(chalk.red('✗ Suppression ID required. Usage: unosend suppressions get <id>'));
        process.exit(1);
      }
      await getSuppression(emailOrId);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!emailOrId) {
        console.log(chalk.red('✗ Suppression ID required. Usage: unosend suppressions remove <id>'));
        process.exit(1);
      }
      await removeSuppression(emailOrId);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, add, get, remove'));
      process.exit(1);
  }
}

async function listSuppressions(limit: string): Promise<void> {
  const spinner = ora('Fetching suppressions...').start();

  const result = await apiRequest<SuppressionsResponse>(`/suppressions?limit=${limit}`);

  if (!result.success) {
    spinner.fail('Failed to fetch suppressions');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const suppressions = result.data?.data || [];

  if (suppressions.length === 0) {
    console.log(chalk.yellow('\n📭 No suppressions found.\n'));
    return;
  }

  console.log(chalk.cyan(`\n🚫 Suppressions (${suppressions.length}):\n`));

  const tableData = [
    [chalk.white.bold('Email'), chalk.white.bold('Reason'), chalk.white.bold('ID'), chalk.white.bold('Added')],
    ...suppressions.map((s: Suppression) => [
      chalk.white(truncate(s.email, 30)),
      chalk.gray(s.reason || '-'),
      chalk.gray(s.id.slice(0, 8)),
      chalk.gray(formatDate(s.created_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function addSuppression(email: string, reason?: string): Promise<void> {
  const spinner = ora(`Suppressing ${email}...`).start();

  const body: Record<string, unknown> = { email };
  if (reason) body.reason = reason;

  const result = await apiRequest('/suppressions', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to add suppression');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed(`${email} added to suppression list.`);
}

async function getSuppression(id: string): Promise<void> {
  const spinner = ora('Fetching suppression...').start();

  const result = await apiRequest<{ data: Suppression }>(`/suppressions/${id}`);

  if (!result.success) {
    spinner.fail('Suppression not found');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const s = result.data?.data;
  if (!s) {
    console.log(chalk.red('✗ Suppression not found'));
    return;
  }

  console.log(chalk.cyan(`\n🚫 Suppression: ${s.email}\n`));
  console.log(chalk.white('  ID:      '), chalk.gray(s.id));
  console.log(chalk.white('  Email:   '), chalk.gray(s.email));
  console.log(chalk.white('  Reason:  '), chalk.gray(s.reason || '-'));
  console.log(chalk.white('  Added:   '), chalk.gray(formatDate(s.created_at)));
  console.log();
}

async function removeSuppression(id: string): Promise<void> {
  const spinner = ora('Removing suppression...').start();

  const result = await apiRequest(`/suppressions/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to remove suppression');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Suppression removed.');
}
