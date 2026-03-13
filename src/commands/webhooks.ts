import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder } from '../utils/format.js';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  created_at: string;
  updated_at?: string;
}

interface WebhooksResponse {
  data: Webhook[];
}

interface WebhookResponse {
  data?: Webhook;
  id?: string;
}

const AVAILABLE_EVENTS = [
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
  'email.unsubscribed',
];

export async function webhooksCommand(action?: string, urlOrId?: string, options?: Record<string, string>): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listWebhooks();
      break;
    case 'add':
    case 'create':
      if (!urlOrId) {
        console.log(chalk.red('✗ URL required. Usage: unosend webhooks add <url> [--events <events>]'));
        console.log(chalk.gray(`  Available events: ${AVAILABLE_EVENTS.join(', ')}`));
        process.exit(1);
      }
      await addWebhook(urlOrId, options?.events);
      break;
    case 'get':
    case 'show':
      if (!urlOrId) {
        console.log(chalk.red('✗ Webhook ID required. Usage: unosend webhooks get <id>'));
        process.exit(1);
      }
      await getWebhook(urlOrId);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!urlOrId) {
        console.log(chalk.red('✗ Webhook ID required. Usage: unosend webhooks remove <id>'));
        process.exit(1);
      }
      await removeWebhook(urlOrId);
      break;
    case 'events':
      console.log(chalk.cyan('\n📋 Available webhook events:\n'));
      AVAILABLE_EVENTS.forEach(e => console.log(chalk.white(`  • ${e}`)));
      console.log();
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, add, get, remove, events'));
      process.exit(1);
  }
}

async function listWebhooks(): Promise<void> {
  const spinner = ora('Fetching webhooks...').start();
  
  const result = await apiRequest<WebhooksResponse>('/webhooks');
  
  if (!result.success) {
    spinner.fail('Failed to fetch webhooks');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const webhooks = result.data?.data || [];
  
  if (webhooks.length === 0) {
    console.log(chalk.yellow('\n📭 No webhooks configured.'));
    console.log(chalk.gray('   Add one with: unosend webhooks add <url>'));
    console.log(chalk.gray('   View events: unosend webhooks events\n'));
    return;
  }

  console.log(chalk.cyan(`\n🔗 Webhooks (${webhooks.length}):\n`));

  const tableData = [
    [chalk.white.bold('URL'), chalk.white.bold('Events'), chalk.white.bold('Active'), chalk.white.bold('ID')],
    ...webhooks.map((w: Webhook) => [
      chalk.white(truncate(w.url, 40)),
      chalk.gray(w.events?.length ? `${w.events.length} events` : 'all'),
      w.active ? chalk.green('✓') : chalk.red('✗'),
      chalk.gray(w.id.slice(0, 8)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function addWebhook(url: string, events?: string): Promise<void> {
  const spinner = ora(`Adding webhook ${url}...`).start();
  
  const body: Record<string, unknown> = { url };
  
  if (events) {
    const eventList = events.split(',').map(e => e.trim());
    const invalidEvents = eventList.filter(e => !AVAILABLE_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      spinner.fail('Invalid events');
      console.log(chalk.red(`\n✗ Invalid events: ${invalidEvents.join(', ')}`));
      console.log(chalk.gray(`  Available: ${AVAILABLE_EVENTS.join(', ')}`));
      process.exit(1);
    }
    body.events = eventList;
  } else {
    body.events = [...AVAILABLE_EVENTS];
  }
  
  const result = await apiRequest<WebhookResponse>('/webhooks', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to add webhook');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('Webhook added!');
  
  const webhook = result.data?.data || result.data;
  if (webhook) {
    console.log(chalk.gray(`  ID: ${webhook.id}`));
    if ('secret' in webhook && webhook.secret) {
      console.log(chalk.yellow(`  Secret: ${webhook.secret}`));
      console.log(chalk.gray('  (Save this secret - it won\'t be shown again)'));
    }
  }
  console.log();
}

async function getWebhook(id: string): Promise<void> {
  const spinner = ora('Fetching webhook...').start();
  
  const result = await apiRequest<{ data: Webhook }>(`/webhooks/${id}`);

  if (!result.success) {
    spinner.fail('Webhook not found');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const w = result.data?.data;
  if (!w) {
    console.log(chalk.red('✗ Webhook not found'));
    return;
  }

  console.log(chalk.cyan(`\n🔗 Webhook\n`));
  console.log(chalk.white('  ID:      '), chalk.gray(w.id));
  console.log(chalk.white('  URL:     '), chalk.gray(w.url));
  console.log(chalk.white('  Active:  '), w.active ? chalk.green('Yes') : chalk.red('No'));
  console.log(chalk.white('  Events:  '), chalk.gray(w.events?.length ? w.events.join(', ') : 'All events'));
  console.log(chalk.white('  Created: '), chalk.gray(formatDate(w.created_at)));
  console.log();
}

async function removeWebhook(id: string): Promise<void> {
  const spinner = ora('Removing webhook...').start();
  
  const result = await apiRequest(`/webhooks/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to remove webhook');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('Webhook removed.');
}
