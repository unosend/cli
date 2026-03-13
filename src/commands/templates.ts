import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'fs';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder } from '../utils/format.js';

interface Template {
  id: string;
  name: string;
  subject: string;
  html?: string;
  text?: string;
  variables?: string[];
  created_at: string;
  updated_at: string;
}

interface TemplatesResponse {
  data: Template[];
}

interface TemplateResponse {
  data?: Template;
  id?: string;
}

export async function templatesCommand(action?: string, idOrName?: string, options?: Record<string, string>): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listTemplates();
      break;
    case 'get':
    case 'show':
      if (!idOrName) {
        console.log(chalk.red('✗ Template ID required. Usage: unosend templates get <id>'));
        process.exit(1);
      }
      await getTemplate(idOrName);
      break;
    case 'create':
    case 'add':
      if (!idOrName) {
        console.log(chalk.red('✗ Template name required. Usage: unosend templates create <name> --subject <subject> --html <html>'));
        process.exit(1);
      }
      await createTemplate(idOrName, options);
      break;
    case 'update':
    case 'edit':
      if (!idOrName) {
        console.log(chalk.red('✗ Template ID required. Usage: unosend templates update <id> --subject <subject>'));
        process.exit(1);
      }
      await updateTemplate(idOrName, options);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!idOrName) {
        console.log(chalk.red('✗ Template ID required. Usage: unosend templates remove <id>'));
        process.exit(1);
      }
      await removeTemplate(idOrName);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, get, create, update, remove'));
      process.exit(1);
  }
}

async function listTemplates(): Promise<void> {
  const spinner = ora('Fetching templates...').start();
  
  const result = await apiRequest<TemplatesResponse>('/templates');
  
  if (!result.success) {
    spinner.fail('Failed to fetch templates');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const templates = result.data?.data || [];
  
  if (templates.length === 0) {
    console.log(chalk.yellow('\n📭 No templates found.'));
    console.log(chalk.gray('   Create one at: https://www.unosend.co/templates\n'));
    return;
  }

  console.log(chalk.cyan(`\n📄 Templates (${templates.length}):\n`));

  const tableData = [
    [chalk.white.bold('Name'), chalk.white.bold('Subject'), chalk.white.bold('ID'), chalk.white.bold('Updated')],
    ...templates.map((t: Template) => [
      chalk.white(truncate(t.name, 25)),
      chalk.gray(truncate(t.subject, 35)),
      chalk.gray(t.id.slice(0, 8)),
      chalk.gray(formatDate(t.updated_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function getTemplate(id: string): Promise<void> {
  const spinner = ora('Fetching template...').start();
  
  const result = await apiRequest<{ data: Template }>(`/templates/${id}`);

  if (!result.success) {
    spinner.fail('Template not found');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const t = result.data?.data;
  if (!t) {
    console.log(chalk.red('✗ Template not found'));
    return;
  }

  console.log(chalk.cyan(`\n📄 Template: ${t.name}\n`));
  console.log(chalk.white('  ID:        '), chalk.gray(t.id));
  console.log(chalk.white('  Subject:   '), chalk.gray(t.subject));
  console.log(chalk.white('  Created:   '), chalk.gray(formatDate(t.created_at)));
  console.log(chalk.white('  Updated:   '), chalk.gray(formatDate(t.updated_at)));
  
  if (t.variables && t.variables.length > 0) {
    console.log(chalk.white('  Variables: '), chalk.yellow(t.variables.join(', ')));
  }
  
  console.log(chalk.white('  HTML:      '), chalk.gray(t.html ? `${t.html.length} chars` : 'No'));
  console.log(chalk.white('  Text:      '), chalk.gray(t.text ? `${t.text.length} chars` : 'No'));
  console.log();
}

async function createTemplate(name: string, options?: Record<string, string>): Promise<void> {
  const body: Record<string, unknown> = { name };

  if (options?.subject) body.subject = options.subject;
  if (options?.html) body.html = options.html;
  if (options?.text) body.text = options.text;

  if (options?.file) {
    if (!existsSync(options.file)) {
      console.log(chalk.red(`✗ File not found: ${options.file}`));
      process.exit(1);
    }
    body.html = readFileSync(options.file, 'utf-8');
  }

  if (!body.subject) {
    console.log(chalk.red('✗ Subject required. Use --subject <subject>'));
    process.exit(1);
  }

  const spinner = ora('Creating template...').start();

  const result = await apiRequest<TemplateResponse>('/templates', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to create template');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed(`Template "${name}" created!`);
  console.log(chalk.gray(`  ID: ${result.data?.id || result.data?.data?.id}\n`));
}

async function updateTemplate(id: string, options?: Record<string, string>): Promise<void> {
  const body: Record<string, unknown> = {};

  if (options?.name) body.name = options.name;
  if (options?.subject) body.subject = options.subject;
  if (options?.html) body.html = options.html;
  if (options?.text) body.text = options.text;

  if (options?.file) {
    if (!existsSync(options.file)) {
      console.log(chalk.red(`✗ File not found: ${options.file}`));
      process.exit(1);
    }
    body.html = readFileSync(options.file, 'utf-8');
  }

  if (Object.keys(body).length === 0) {
    console.log(chalk.red('✗ Nothing to update. Use --name, --subject, --html, --text, or --file'));
    process.exit(1);
  }

  const spinner = ora('Updating template...').start();

  const result = await apiRequest(`/templates/${id}`, {
    method: 'PATCH',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to update template');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Template updated!');
}

async function removeTemplate(id: string): Promise<void> {
  const spinner = ora('Removing template...').start();
  
  const result = await apiRequest(`/templates/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to remove template');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('Template removed.');
}
