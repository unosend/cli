import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder } from '../utils/format.js';

interface InboundEmail {
  id: string;
  from: string;
  from_name?: string;
  to: string;
  cc?: string;
  subject: string;
  has_html: boolean;
  has_text: boolean;
  attachment_count: number;
  received_at: string;
}

interface InboundResponse {
  data: InboundEmail[];
}

interface InboundDetailResponse {
  data: InboundEmail & {
    html?: string;
    text?: string;
    headers?: Record<string, string>;
  };
}

export async function inboundCommand(
  action?: string,
  id?: string,
  options?: Record<string, string>
): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listInbound(options?.limit || '20');
      break;
    case 'get':
    case 'show':
      if (!id) {
        console.log(chalk.red('✗ Email ID required. Usage: unosend inbound get <id>'));
        process.exit(1);
      }
      await getInbound(id);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!id) {
        console.log(chalk.red('✗ Email ID required. Usage: unosend inbound remove <id>'));
        process.exit(1);
      }
      await removeInbound(id);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, get, remove'));
      process.exit(1);
  }
}

async function listInbound(limit: string): Promise<void> {
  const spinner = ora('Fetching inbound emails...').start();

  const result = await apiRequest<InboundResponse>(`/inbound?limit=${limit}`);

  if (!result.success) {
    spinner.fail('Failed to fetch inbound emails');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const emails = result.data?.data || [];

  if (emails.length === 0) {
    console.log(chalk.yellow('\n📭 No inbound emails found.\n'));
    return;
  }

  console.log(chalk.cyan(`\n📥 Inbound Emails (${emails.length}):\n`));

  const tableData = [
    [
      chalk.white.bold('From'),
      chalk.white.bold('Subject'),
      chalk.white.bold('Attachments'),
      chalk.white.bold('Received'),
    ],
    ...emails.map((e: InboundEmail) => [
      chalk.white(truncate(e.from_name ? `${e.from_name} <${e.from}>` : e.from, 30)),
      chalk.gray(truncate(e.subject, 30)),
      e.attachment_count > 0 ? chalk.cyan(String(e.attachment_count)) : chalk.gray('0'),
      chalk.gray(formatDate(e.received_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function getInbound(id: string): Promise<void> {
  const spinner = ora('Fetching inbound email...').start();

  const result = await apiRequest<InboundDetailResponse>(`/inbound/${id}`);

  if (!result.success) {
    spinner.fail('Email not found');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const e = result.data?.data;
  if (!e) {
    console.log(chalk.red('✗ Email not found'));
    return;
  }

  console.log(chalk.cyan(`\n📥 Inbound: ${e.subject}\n`));
  console.log(chalk.white('  ID:          '), chalk.gray(e.id));
  console.log(chalk.white('  From:        '), chalk.gray(e.from_name ? `${e.from_name} <${e.from}>` : e.from));
  console.log(chalk.white('  To:          '), chalk.gray(e.to));
  if (e.cc) console.log(chalk.white('  CC:          '), chalk.gray(e.cc));
  console.log(chalk.white('  Subject:     '), chalk.gray(e.subject));
  console.log(chalk.white('  Attachments: '), chalk.cyan(String(e.attachment_count)));
  console.log(chalk.white('  Received:    '), chalk.gray(formatDate(e.received_at)));

  if (e.text) {
    console.log(chalk.white('\n  Body:'));
    console.log(chalk.gray('  ' + e.text.split('\n').slice(0, 10).join('\n  ')));
    if (e.text.split('\n').length > 10) {
      console.log(chalk.gray('  ... (truncated)'));
    }
  }
  console.log();
}

async function removeInbound(id: string): Promise<void> {
  const spinner = ora('Deleting inbound email...').start();

  const result = await apiRequest(`/inbound/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to delete email');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Inbound email deleted.');
}
