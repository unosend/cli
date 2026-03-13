#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendCommand } from './commands/send.js';
import { domainsCommand } from './commands/domains.js';
import { logsCommand } from './commands/logs.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { contactsCommand } from './commands/contacts.js';
import { audiencesCommand } from './commands/audiences.js';
import { templatesCommand } from './commands/templates.js';
import { webhooksCommand } from './commands/webhooks.js';
import { apiKeysCommand } from './commands/api-keys.js';
import { emailsCommand } from './commands/emails.js';
import { suppressionsCommand } from './commands/suppressions.js';
import { validateCommand } from './commands/validate.js';
import { broadcastsCommand } from './commands/broadcasts.js';
import { inboundCommand } from './commands/inbound.js';
import { usageCommand } from './commands/usage.js';
import { getConfig } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

const logo = `
${chalk.cyan('╦ ╦╔╗╔╔═╗╔═╗╔═╗╔╗╔╔╦╗')}
${chalk.cyan('║ ║║║║║ ║╚═╗║╣ ║║║ ║║')}
${chalk.cyan('╚═╝╝╚╝╚═╝╚═╝╚═╝╝╚╝═╩╝')}
${chalk.gray('One API. Infinite Emails.')}
`;

program
  .name('unosend')
  .description(logo + '\n\nUnosend CLI - Send emails from your terminal')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize Unosend CLI with your API key')
  .action(initCommand);

program
  .command('config')
  .description('View or update configuration')
  .option('-s, --set <key=value>', 'Set a config value')
  .option('-g, --get <key>', 'Get a config value')
  .option('-l, --list', 'List all config values')
  .action(configCommand);

program
  .command('send')
  .description('Send an email')
  .requiredOption('-t, --to <email>', 'Recipient email address')
  .requiredOption('-s, --subject <subject>', 'Email subject')
  .requiredOption('-f, --from <email>', 'Sender email address')
  .option('--html <html>', 'HTML content')
  .option('--text <text>', 'Plain text content')
  .option('--file <path>', 'Read HTML content from file')
  .option('--reply-to <email>', 'Reply-to address')
  .option('--cc <emails>', 'CC recipients (comma-separated)')
  .option('--bcc <emails>', 'BCC recipients (comma-separated)')
  .option('--from-name <name>', 'Sender display name')
  .option('--template <id>', 'Template ID to use')
  .option('--template-data <json>', 'Template variables as JSON string')
  .option('--schedule <datetime>', 'Schedule send (ISO 8601 datetime)')
  .option('--tags <tags>', 'Tags as name:value pairs (comma-separated)')
  .action(sendCommand);

program
  .command('domains')
  .description('Manage sending domains')
  .argument('[action]', 'Action: list, add, verify, remove')
  .argument('[domain]', 'Domain name')
  .action(domainsCommand);

program
  .command('logs')
  .description('View email logs')
  .option('-l, --limit <number>', 'Number of logs to show', '10')
  .option('-s, --status <status>', 'Filter by status: sent, failed, queued')
  .action(logsCommand);

// Contacts (People)
program
  .command('contacts')
  .description('Manage contacts/people')
  .argument('[action]', 'Action: list, add, get, update, remove')
  .argument('[email]', 'Contact email or ID')
  .option('--first-name <name>', 'First name')
  .option('--last-name <name>', 'Last name')
  .option('--audience <id>', 'Audience ID')
  .option('--subscribed', 'Set contact as subscribed')
  .option('--unsubscribed', 'Set contact as unsubscribed')
  .option('--email <newEmail>', 'New email (for update)')
  .option('-l, --limit <number>', 'Number of contacts to show', '10')
  .action((action, email, options) => contactsCommand(action, email, options));

// Audiences
program
  .command('audiences')
  .description('Manage audiences')
  .argument('[action]', 'Action: list, add, get, remove')
  .argument('[name]', 'Audience name or ID')
  .option('--description <desc>', 'Audience description')
  .action((action, name, options) => audiencesCommand(action, name, options));

// Webhooks
program
  .command('webhooks')
  .description('Manage webhooks')
  .argument('[action]', 'Action: list, add, get, remove, events')
  .argument('[url]', 'Webhook URL or ID')
  .option('--events <events>', 'Comma-separated list of events')
  .action((action, url, options) => webhooksCommand(action, url, options));

// API Keys
program
  .command('api-keys')
  .description('Manage API keys')
  .argument('[action]', 'Action: list, create, revoke')
  .argument('[name]', 'Key name or ID')
  .action(apiKeysCommand);

// Templates
program
  .command('templates')
  .description('Manage email templates')
  .argument('[action]', 'Action: list, get, create, update, remove')
  .argument('[id]', 'Template ID or name')
  .option('--name <name>', 'Template name')
  .option('--subject <subject>', 'Template subject')
  .option('--html <html>', 'HTML content')
  .option('--text <text>', 'Plain text content')
  .option('--file <path>', 'Read HTML content from file')
  .action((action, id, options) => templatesCommand(action, id, options));

// Emails
program
  .command('emails')
  .description('Manage sent emails')
  .argument('[action]', 'Action: get, resend, cancel')
  .argument('[id]', 'Email ID')
  .action(emailsCommand);

// Suppressions
program
  .command('suppressions')
  .description('Manage email suppressions')
  .argument('[action]', 'Action: list, add, get, remove')
  .argument('[emailOrId]', 'Email address or suppression ID')
  .option('--reason <reason>', 'Suppression reason')
  .option('-l, --limit <number>', 'Number of suppressions to show', '10')
  .action((action, emailOrId, options) => suppressionsCommand(action, emailOrId, options));

// Validate
program
  .command('validate')
  .description('Validate an email address')
  .argument('<email>', 'Email address to validate')
  .action(validateCommand);

// Broadcasts
program
  .command('broadcasts')
  .description('Manage email broadcasts')
  .argument('[action]', 'Action: list, get, create, update, send, remove')
  .argument('[id]', 'Broadcast ID')
  .option('--name <name>', 'Broadcast name')
  .option('--subject <subject>', 'Email subject')
  .option('-f, --from <email>', 'Sender email address')
  .option('--from-name <name>', 'Sender display name')
  .option('--html <html>', 'HTML content')
  .option('--text <text>', 'Plain text content')
  .option('--file <path>', 'Read HTML content from file')
  .option('--audience <id>', 'Audience ID')
  .option('--reply-to <email>', 'Reply-to address')
  .option('--schedule <datetime>', 'Schedule send (ISO 8601 datetime)')
  .option('-l, --limit <number>', 'Number of broadcasts to show', '10')
  .action((action, id, options) => broadcastsCommand(action, id, options));

// Inbound Emails
program
  .command('inbound')
  .description('Manage inbound emails')
  .argument('[action]', 'Action: list, get, remove')
  .argument('[id]', 'Inbound email ID')
  .option('-l, --limit <number>', 'Number of emails to show', '10')
  .action((action, id, options) => inboundCommand(action, id, options));

// Usage
program
  .command('usage')
  .description('View email usage and stats')
  .option('--period <period>', 'Time period: 7d, 30d, 90d', '30d')
  .action(usageCommand);

program
  .command('whoami')
  .description('Show current API key info')
  .action(async () => {
    const config = getConfig();
    if (!config.apiKey) {
      console.log(chalk.yellow('Not logged in. Run `unosend init` to get started.'));
      return;
    }
    console.log(chalk.green('✓ Logged in'));
    console.log(chalk.gray(`  API Key: ${config.apiKey.slice(0, 10)}...`));
    console.log(chalk.gray(`  Endpoint: ${config.apiUrl}`));
  });

program.parse();

if (!process.argv.slice(2).length) {
  console.log(logo);
  program.outputHelp();
}
