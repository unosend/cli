import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder } from '../utils/format.js';

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  audience_id?: string;
  subscribed: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface ContactsResponse {
  data: Contact[];
}

interface ContactResponse {
  data?: Contact;
  id?: string;
}

export async function contactsCommand(action?: string, emailOrId?: string, options?: Record<string, string>): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listContacts(options?.limit || '10', options?.audience);
      break;
    case 'add':
    case 'create':
      if (!emailOrId) {
        console.log(chalk.red('✗ Email required. Usage: unosend contacts add <email> [--first-name <name>] [--last-name <name>]'));
        process.exit(1);
      }
      await addContact(emailOrId, options);
      break;
    case 'get':
    case 'show':
      if (!emailOrId) {
        console.log(chalk.red('✗ Contact ID or email required. Usage: unosend contacts get <id|email>'));
        process.exit(1);
      }
      await getContact(emailOrId);
      break;
    case 'update':
    case 'edit':
      if (!emailOrId) {
        console.log(chalk.red('✗ Contact ID required. Usage: unosend contacts update <id> --first-name <name>'));
        process.exit(1);
      }
      await updateContact(emailOrId, options);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!emailOrId) {
        console.log(chalk.red('✗ Contact ID required. Usage: unosend contacts remove <id>'));
        process.exit(1);
      }
      await removeContact(emailOrId);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, add, get, update, remove'));
      process.exit(1);
  }
}

async function listContacts(limit: string, audienceId?: string): Promise<void> {
  const spinner = ora('Fetching contacts...').start();
  
  let endpoint = `/contacts?limit=${limit}`;
  if (audienceId) {
    endpoint += `&audience_id=${audienceId}`;
  }
  
  const result = await apiRequest<ContactsResponse>(endpoint);
  
  if (!result.success) {
    spinner.fail('Failed to fetch contacts');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const contacts = result.data?.data || [];
  
  if (contacts.length === 0) {
    console.log(chalk.yellow('\n📭 No contacts found.'));
    console.log(chalk.gray('   Add one with: unosend contacts add <email>\n'));
    return;
  }

  console.log(chalk.cyan(`\n👥 Contacts (${contacts.length}):\n`));

  const tableData = [
    [chalk.white.bold('Email'), chalk.white.bold('Name'), chalk.white.bold('Subscribed'), chalk.white.bold('Created')],
    ...contacts.map((c: Contact) => [
      chalk.white(truncate(c.email, 30)),
      chalk.gray(`${c.first_name || ''} ${c.last_name || ''}`.trim() || '-'),
      c.subscribed ? chalk.green('✓') : chalk.red('✗'),
      chalk.gray(formatDate(c.created_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function addContact(email: string, options?: Record<string, string>): Promise<void> {
  const spinner = ora(`Adding contact ${email}...`).start();
  
  const body: Record<string, unknown> = { email };
  if (options?.firstName) body.first_name = options.firstName;
  if (options?.lastName) body.last_name = options.lastName;
  if (options?.audience) body.audience_id = options.audience;
  
  const result = await apiRequest<ContactResponse>('/contacts', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to add contact');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed(`Contact ${email} added!`);
  console.log(chalk.gray(`  ID: ${result.data?.id || result.data?.data?.id}\n`));
}

async function getContact(idOrEmail: string): Promise<void> {
  const spinner = ora('Fetching contact...').start();
  
  const result = await apiRequest<{ data: Contact }>(`/contacts/${idOrEmail}`);

  if (!result.success) {
    spinner.fail('Contact not found');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const c = result.data?.data;
  if (!c) {
    console.log(chalk.red('✗ Contact not found'));
    return;
  }

  console.log(chalk.cyan(`\n👤 Contact: ${c.email}\n`));
  console.log(chalk.white('  ID:         '), chalk.gray(c.id));
  console.log(chalk.white('  Name:       '), chalk.gray(`${c.first_name || ''} ${c.last_name || ''}`.trim() || '-'));
  console.log(chalk.white('  Subscribed: '), c.subscribed ? chalk.green('Yes') : chalk.red('No'));
  console.log(chalk.white('  Created:    '), chalk.gray(formatDate(c.created_at)));
  console.log();
}

async function updateContact(id: string, options?: Record<string, string>): Promise<void> {
  const body: Record<string, unknown> = {};

  if (options?.firstName) body.first_name = options.firstName;
  if (options?.lastName) body.last_name = options.lastName;
  if (options?.email) body.email = options.email;
  if (options?.unsubscribed === 'true') body.subscribed = false;
  if (options?.subscribed === 'true') body.subscribed = true;

  if (Object.keys(body).length === 0) {
    console.log(chalk.red('✗ Nothing to update. Use --first-name, --last-name, or --email'));
    process.exit(1);
  }

  const spinner = ora('Updating contact...').start();

  const result = await apiRequest(`/contacts/${id}`, {
    method: 'PATCH',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to update contact');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Contact updated!');
}

async function removeContact(id: string): Promise<void> {
  const spinner = ora('Removing contact...').start();
  
  const result = await apiRequest(`/contacts/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to remove contact');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('Contact removed.');
}
