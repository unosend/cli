import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'fs';
import { apiRequest, handleError } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';

interface SendOptions {
  to: string;
  subject: string;
  from?: string;
  fromName?: string;
  html?: string;
  text?: string;
  file?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
  template?: string;
  templateData?: string;
  schedule?: string;
  tags?: string;
}

interface SendResponse {
  id: string;
  to: string;
  subject: string;
  status: string;
}

export async function sendCommand(options: SendOptions): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!options.from) {
    console.log(chalk.red('✗ You must provide --from (sender email address)'));
    process.exit(1);
  }

  if (!options.html && !options.text && !options.file && !options.template) {
    console.log(chalk.red('✗ You must provide --html, --text, --file, or --template'));
    process.exit(1);
  }

  let htmlContent = options.html;
  if (options.file) {
    if (!existsSync(options.file)) {
      console.log(chalk.red(`✗ File not found: ${options.file}`));
      process.exit(1);
    }
    htmlContent = readFileSync(options.file, 'utf-8');
  }

  const spinner = ora('Sending email...').start();

  const body: Record<string, unknown> = {
    to: options.to,
    subject: options.subject,
  };

  if (options.from) {
    if (options.fromName) {
      body.from = `${options.fromName} <${options.from}>`;
    } else {
      body.from = options.from;
    }
  }
  if (htmlContent) body.html = htmlContent;
  if (options.text) body.text = options.text;
  if (options.replyTo) body.reply_to = options.replyTo;
  if (options.cc) body.cc = options.cc.split(',').map(e => e.trim());
  if (options.bcc) body.bcc = options.bcc.split(',').map(e => e.trim());
  if (options.template) body.template_id = options.template;
  if (options.templateData) {
    try {
      body.template_data = JSON.parse(options.templateData);
    } catch {
      console.log(chalk.red('✗ Invalid JSON for --template-data'));
      process.exit(1);
    }
  }
  if (options.schedule) body.scheduled_for = options.schedule;
  if (options.tags) {
    body.tags = options.tags.split(',').map(t => {
      const [name, value] = t.trim().split(':');
      return { name, value: value || name };
    });
  }

  const result = await apiRequest<SendResponse>('/emails', {
    method: 'POST',
    body,
  });

  if (!result.success) {
    spinner.fail('Failed to send email');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed('Email sent successfully!');
  
  console.log();
  console.log(chalk.white('  Email ID:  '), chalk.cyan(result.data?.id));
  console.log(chalk.white('  To:        '), chalk.gray(options.to));
  console.log(chalk.white('  Subject:   '), chalk.gray(options.subject));
  console.log(chalk.white('  Status:    '), chalk.green(result.data?.status || 'queued'));
  console.log();
}
