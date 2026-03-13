import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { truncate, tableBorder, getStatusBadge } from '../utils/format.js';

interface LogEntry {
  id: string;
  to: string[];
  from: string;
  subject: string;
  status: string;
  created_at: string;
  opened_at?: string;
  clicked_at?: string;
  error?: string;
}

interface LogsResponse {
  data: LogEntry[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface LogsOptions {
  limit?: string;
  status?: string;
}

export async function logsCommand(options: LogsOptions): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  const spinner = ora('Fetching logs...').start();

  const limit = parseInt(options.limit || '10', 10);
  let endpoint = `/logs?limit=${limit}`;
  
  if (options.status) {
    endpoint += `&status=${options.status}`;
  }

  const result = await apiRequest<LogsResponse>(endpoint);

  if (!result.success) {
    spinner.fail('Failed to fetch logs');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const logs = result.data?.data || [];

  if (logs.length === 0) {
    console.log(chalk.yellow('\n📭 No email logs found.'));
    if (options.status) {
      console.log(chalk.gray(`   (filtered by status: ${options.status})`));
    }
    console.log();
    return;
  }

  console.log(chalk.cyan(`\n📬 Recent Emails (${logs.length}):\n`));

  const tableData = [
    [
      chalk.white.bold('ID'),
      chalk.white.bold('To'),
      chalk.white.bold('Subject'),
      chalk.white.bold('Status'),
      chalk.white.bold('Sent'),
    ],
    ...logs.map((log: LogEntry) => [
      chalk.gray(log.id.slice(0, 8)),
      truncate(log.to[0] || '', 25),
      chalk.white(truncate(log.subject || 'No subject', 30)),
      getStatusBadge(log.status),
      chalk.gray(formatDate(log.created_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));

  if (result.data?.pagination?.has_more) {
    console.log(chalk.gray(`  Showing ${logs.length} of ${result.data.pagination.total} total logs.`));
    console.log(chalk.gray(`  Use --limit to see more.\n`));
  }
}
