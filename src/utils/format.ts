import chalk from 'chalk';

export function truncate(str: string, len: number): string {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

export const tableBorder = {
  topBody: '', topJoin: '', topLeft: '', topRight: '',
  bottomBody: '', bottomJoin: '', bottomLeft: '', bottomRight: '',
  bodyLeft: '  ', bodyRight: '', bodyJoin: '  ',
  joinBody: '', joinLeft: '', joinRight: '', joinJoin: '',
};

export function getStatusBadge(status: string): string {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'active':
    case 'verified':
    case 'sent':
      return chalk.green(`● ${status}`);
    case 'bounced':
    case 'failed':
    case 'rejected':
      return chalk.red(`● ${status}`);
    case 'queued':
    case 'pending':
    case 'processing':
    case 'sending':
    case 'scheduled':
      return chalk.yellow(`● ${status}`);
    case 'draft':
      return chalk.gray(`● ${status}`);
    case 'opened':
    case 'clicked':
      return chalk.cyan(`● ${status}`);
    case 'complained':
    case 'unsubscribed':
      return chalk.magenta(`● ${status}`);
    default:
      return chalk.gray(`● ${status || 'unknown'}`);
  }
}
