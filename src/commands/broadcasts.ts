import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'fs';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder, getStatusBadge } from '../utils/format.js';

interface Broadcast {
  id: string;
  name: string;
  subject: string;
  from: string;
  reply_to?: string;
  html?: string;
  text?: string;
  status: string;
  audience_id?: string;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count?: number;
  created_at: string;
}

interface BroadcastsResponse {
  data: Broadcast[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface BroadcastResponse {
  data?: Broadcast;
  id?: string;
}

export async function broadcastsCommand(
  action?: string,
  idOrName?: string,
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
      await listBroadcasts(options?.limit || '10');
      break;
    case 'get':
    case 'show':
      if (!idOrName) {
        console.log(chalk.red('✗ Broadcast ID required. Usage: unosend broadcasts get <id>'));
        process.exit(1);
      }
      await getBroadcast(idOrName);
      break;
    case 'create':
    case 'add':
      await createBroadcast(idOrName, options);
      break;
    case 'update':
    case 'edit':
      if (!idOrName) {
        console.log(chalk.red('✗ Broadcast ID required. Usage: unosend broadcasts update <id>'));
        process.exit(1);
      }
      await updateBroadcast(idOrName, options);
      break;
    case 'send':
      if (!idOrName) {
        console.log(chalk.red('✗ Broadcast ID required. Usage: unosend broadcasts send <id>'));
        process.exit(1);
      }
      await sendBroadcast(idOrName);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!idOrName) {
        console.log(chalk.red('✗ Broadcast ID required. Usage: unosend broadcasts remove <id>'));
        process.exit(1);
      }
      await removeBroadcast(idOrName);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, get, create, update, send, remove'));
      process.exit(1);
  }
}

async function listBroadcasts(limit: string): Promise<void> {
  const spinner = ora('Fetching broadcasts...').start();

  const result = await apiRequest<BroadcastsResponse>(`/broadcasts?limit=${limit}`);

  if (!result.success) {
    spinner.fail('Failed to fetch broadcasts');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const broadcasts = result.data?.data || [];

  if (broadcasts.length === 0) {
    console.log(chalk.yellow('\n📭 No broadcasts found.'));
    console.log(chalk.gray('   Create one with: unosend broadcasts create <name> --subject <subject> --from <email>\n'));
    return;
  }

  console.log(chalk.cyan(`\n📢 Broadcasts (${broadcasts.length}):\n`));

  const tableData = [
    [
      chalk.white.bold('Name'),
      chalk.white.bold('Subject'),
      chalk.white.bold('Status'),
      chalk.white.bold('Recipients'),
      chalk.white.bold('Created'),
    ],
    ...broadcasts.map((b: Broadcast) => [
      chalk.white(truncate(b.name, 20)),
      chalk.gray(truncate(b.subject, 25)),
      getStatusBadge(b.status),
      chalk.cyan(String(b.total_recipients || 0)),
      chalk.gray(formatDate(b.created_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));

  if (result.data?.pagination?.has_more) {
    console.log(chalk.gray(`  Showing ${broadcasts.length} of ${result.data.pagination.total}. Use --limit to see more.\n`));
  }
}

async function getBroadcast(id: string): Promise<void> {
  const spinner = ora('Fetching broadcast...').start();

  const result = await apiRequest<{ data: Broadcast }>(`/broadcasts/${id}`);

  if (!result.success) {
    spinner.fail('Broadcast not found');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const b = result.data?.data;
  if (!b) {
    console.log(chalk.red('✗ Broadcast not found'));
    return;
  }

  console.log(chalk.cyan(`\n📢 Broadcast: ${b.name}\n`));
  console.log(chalk.white('  ID:          '), chalk.gray(b.id));
  console.log(chalk.white('  Name:        '), chalk.gray(b.name));
  console.log(chalk.white('  Subject:     '), chalk.gray(b.subject));
  console.log(chalk.white('  From:        '), chalk.gray(b.from));
  console.log(chalk.white('  Status:      '), getStatusBadge(b.status));
  console.log(chalk.white('  Recipients:  '), chalk.cyan(String(b.total_recipients || 0)));
  if (b.sent_count) console.log(chalk.white('  Sent:        '), chalk.green(String(b.sent_count)));
  if (b.audience_id) console.log(chalk.white('  Audience:    '), chalk.gray(b.audience_id));
  if (b.scheduled_at) console.log(chalk.white('  Scheduled:   '), chalk.yellow(formatDate(b.scheduled_at)));
  if (b.sent_at) console.log(chalk.white('  Sent at:     '), chalk.gray(formatDate(b.sent_at)));
  console.log(chalk.white('  Created:     '), chalk.gray(formatDate(b.created_at)));
  console.log();
}

async function createBroadcast(name?: string, options?: Record<string, string>): Promise<void> {
  if (!name) {
    console.log(chalk.red('✗ Name required. Usage: unosend broadcasts create <name> --subject <subject> --from <email>'));
    process.exit(1);
  }

  if (!options?.subject) {
    console.log(chalk.red('✗ Subject required. Use --subject <subject>'));
    process.exit(1);
  }

  if (!options?.from) {
    console.log(chalk.red('✗ From email required. Use --from <email>'));
    process.exit(1);
  }

  const spinner = ora('Creating broadcast...').start();

  const body: Record<string, unknown> = {
    name,
    subject: options.subject,
    from: options.from,
  };

  if (options.replyTo) body.reply_to = options.replyTo;
  if (options.audience) body.audience_id = options.audience;
  if (options.schedule) body.scheduled_at = options.schedule;

  if (options.file) {
    if (!existsSync(options.file)) {
      spinner.fail(`File not found: ${options.file}`);
      process.exit(1);
    }
    body.html = readFileSync(options.file, 'utf-8');
  } else if (options.html) {
    body.html = options.html;
  }

  if (options.text) body.text = options.text;

  const result = await apiRequest<BroadcastResponse>('/broadcasts', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to create broadcast');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Broadcast created!');
  const id = result.data?.id || result.data?.data?.id;
  if (id) {
    console.log(chalk.gray(`  ID: ${id}`));
    console.log(chalk.gray(`  Send with: unosend broadcasts send ${id}\n`));
  }
}

async function updateBroadcast(id: string, options?: Record<string, string>): Promise<void> {
  const body: Record<string, unknown> = {};

  if (options?.name) body.name = options.name;
  if (options?.subject) body.subject = options.subject;
  if (options?.from) body.from = options.from;
  if (options?.audience) body.audience_id = options.audience;
  if (options?.schedule) body.scheduled_at = options.schedule;

  if (options?.file) {
    if (!existsSync(options.file)) {
      console.log(chalk.red(`✗ File not found: ${options.file}`));
      process.exit(1);
    }
    body.html = readFileSync(options.file, 'utf-8');
  } else if (options?.html) {
    body.html = options.html;
  }

  if (options?.text) body.text = options.text;

  if (Object.keys(body).length === 0) {
    console.log(chalk.red('✗ Nothing to update. Use --name, --subject, --from, --html, --file, --audience, --schedule'));
    process.exit(1);
  }

  const spinner = ora('Updating broadcast...').start();

  const result = await apiRequest(`/broadcasts/${id}`, {
    method: 'PATCH',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to update broadcast');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Broadcast updated!');
}

async function sendBroadcast(id: string): Promise<void> {
  const spinner = ora('Sending broadcast...').start();

  const result = await apiRequest(`/broadcasts/${id}/send`, {
    method: 'POST',
  });

  if (!result.success) {
    spinner.fail('Failed to send broadcast');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Broadcast sending started!');
  console.log(chalk.gray('  Track status with: unosend broadcasts get ' + id + '\n'));
}

async function removeBroadcast(id: string): Promise<void> {
  const spinner = ora('Deleting broadcast...').start();

  const result = await apiRequest(`/broadcasts/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to delete broadcast');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Broadcast deleted.');
}
