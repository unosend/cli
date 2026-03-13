import chalk from 'chalk';
import ora from 'ora';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { getStatusBadge } from '../utils/format.js';

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: string;
  created_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
}

export async function emailsCommand(action?: string, id?: string): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'get';

  switch (action) {
    case 'get':
    case 'show':
      if (!id) {
        console.log(chalk.red('✗ Email ID required. Usage: unosend emails get <id>'));
        process.exit(1);
      }
      await getEmail(id);
      break;
    case 'resend':
      if (!id) {
        console.log(chalk.red('✗ Email ID required. Usage: unosend emails resend <id>'));
        process.exit(1);
      }
      await resendEmail(id);
      break;
    case 'cancel':
      if (!id) {
        console.log(chalk.red('✗ Email ID required. Usage: unosend emails cancel <id>'));
        process.exit(1);
      }
      await cancelEmail(id);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: get, resend, cancel'));
      process.exit(1);
  }
}

async function getEmail(id: string): Promise<void> {
  const spinner = ora('Fetching email...').start();

  const result = await apiRequest<{ data: Email }>(`/emails/${id}`);

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

  console.log(chalk.cyan(`\n📧 Email: ${e.subject}\n`));
  console.log(chalk.white('  ID:        '), chalk.gray(e.id));
  console.log(chalk.white('  From:      '), chalk.gray(e.from));
  console.log(chalk.white('  To:        '), chalk.gray(e.to?.join(', ')));
  console.log(chalk.white('  Subject:   '), chalk.gray(e.subject));
  console.log(chalk.white('  Status:    '), getStatusBadge(e.status));
  console.log(chalk.white('  Sent:      '), chalk.gray(formatDate(e.created_at)));
  if (e.delivered_at) console.log(chalk.white('  Delivered: '), chalk.gray(formatDate(e.delivered_at)));
  if (e.opened_at) console.log(chalk.white('  Opened:    '), chalk.gray(formatDate(e.opened_at)));
  if (e.clicked_at) console.log(chalk.white('  Clicked:   '), chalk.gray(formatDate(e.clicked_at)));
  if (e.bounced_at) console.log(chalk.white('  Bounced:   '), chalk.red(formatDate(e.bounced_at)));
  console.log();
}

async function resendEmail(id: string): Promise<void> {
  const spinner = ora('Resending email...').start();

  const result = await apiRequest(`/emails/${id}/resend`, {
    method: 'POST',
  });

  if (!result.success) {
    spinner.fail('Failed to resend email');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Email resent!');
}

async function cancelEmail(id: string): Promise<void> {
  const spinner = ora('Cancelling email...').start();

  const result = await apiRequest(`/emails/${id}/cancel`, {
    method: 'POST',
  });

  if (!result.success) {
    spinner.fail('Failed to cancel email');
    handleError(result.error || 'Unknown error');
  }

  spinner.succeed('Email cancelled.');
}
