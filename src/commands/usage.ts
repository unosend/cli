import chalk from 'chalk';
import ora from 'ora';
import { apiRequest, handleError } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';

interface UsageData {
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  emails_opened: number;
  emails_clicked: number;
  email_limit: number;
  contact_count?: number;
  contact_limit?: number;
  domain_count?: number;
  plan?: string;
}

export async function usageCommand(options?: Record<string, string>): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  const spinner = ora('Fetching usage...').start();

  const period = options?.period || '30d';
  const result = await apiRequest<{ data: UsageData }>(`/usage?period=${period}`);

  if (!result.success) {
    spinner.fail('Failed to fetch usage');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const u = result.data?.data;
  if (!u) {
    console.log(chalk.red('✗ No usage data'));
    return;
  }

  const pct = u.email_limit > 0 ? ((u.emails_sent / u.email_limit) * 100).toFixed(1) : '0';
  const bar = progressBar(u.emails_sent, u.email_limit);

  console.log(chalk.cyan(`\n📊 Usage (${period}):\n`));

  if (u.plan) console.log(chalk.white('  Plan:        '), chalk.cyan(u.plan));
  console.log(chalk.white('  Emails:      '), chalk.white(`${u.emails_sent.toLocaleString()} / ${u.email_limit.toLocaleString()}`), chalk.gray(`(${pct}%)`));
  console.log(chalk.white('               '), bar);
  console.log(chalk.white('  Delivered:   '), chalk.green(u.emails_delivered.toLocaleString()));
  console.log(chalk.white('  Bounced:     '), u.emails_bounced > 0 ? chalk.red(u.emails_bounced.toLocaleString()) : chalk.gray('0'));
  console.log(chalk.white('  Opened:      '), chalk.cyan(u.emails_opened.toLocaleString()));
  console.log(chalk.white('  Clicked:     '), chalk.cyan(u.emails_clicked.toLocaleString()));

  if (u.contact_count !== undefined && u.contact_limit !== undefined) {
    console.log(chalk.white('  Contacts:    '), chalk.white(`${u.contact_count.toLocaleString()} / ${u.contact_limit.toLocaleString()}`));
  }
  if (u.domain_count !== undefined) {
    console.log(chalk.white('  Domains:     '), chalk.white(String(u.domain_count)));
  }

  console.log();
}

function progressBar(current: number, max: number, width: number = 25): string {
  if (max <= 0) return chalk.gray('▓'.repeat(width));
  const ratio = Math.min(current / max, 1);
  const filled = Math.round(width * ratio);
  const empty = width - filled;

  const color = ratio > 0.9 ? chalk.red : ratio > 0.7 ? chalk.yellow : chalk.green;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
