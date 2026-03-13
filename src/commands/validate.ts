import chalk from 'chalk';
import ora from 'ora';
import { apiRequest, handleError } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';

interface ValidationResult {
  email: string;
  valid: boolean;
  reason?: string;
  is_disposable?: boolean;
  is_role_based?: boolean;
  has_mx_record?: boolean;
  suggestion?: string;
}

export async function validateCommand(email: string): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!email) {
    console.log(chalk.red('✗ Email required. Usage: unosend validate <email>'));
    process.exit(1);
  }

  const spinner = ora(`Validating ${email}...`).start();

  const result = await apiRequest<ValidationResult>('/contacts/validate', {
    method: 'POST',
    body: { email },
  });

  if (!result.success) {
    spinner.fail('Validation failed');
    handleError(result.error || 'Unknown error');
  }

  spinner.stop();

  const v = result.data;
  if (!v) {
    console.log(chalk.red('✗ No validation result'));
    return;
  }

  const icon = v.valid ? chalk.green('✓') : chalk.red('✗');
  const status = v.valid ? chalk.green('Valid') : chalk.red('Invalid');

  console.log(`\n  ${icon} ${chalk.white(v.email)} — ${status}\n`);

  if (v.reason) {
    console.log(chalk.white('  Reason:      '), chalk.gray(v.reason));
  }
  if (v.is_disposable) {
    console.log(chalk.white('  Disposable:  '), chalk.red('Yes'));
  }
  if (v.is_role_based) {
    console.log(chalk.white('  Role-based:  '), chalk.yellow('Yes'));
  }
  if (v.has_mx_record !== undefined) {
    console.log(chalk.white('  MX Record:   '), v.has_mx_record ? chalk.green('Yes') : chalk.red('No'));
  }
  if (v.suggestion) {
    console.log(chalk.white('  Suggestion:  '), chalk.cyan(v.suggestion));
  }
  console.log();
}
