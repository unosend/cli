import chalk from 'chalk';
import { password } from '@inquirer/prompts';
import ora from 'ora';
import { setConfig } from '../utils/config.js';
import { apiRequest } from '../utils/api.js';

export async function initCommand(): Promise<void> {
  console.log(chalk.cyan('\n🚀 Welcome to Unosend CLI!\n'));
  console.log(chalk.gray('Let\'s get you set up. You\'ll need an API key from your Unosend dashboard.'));
  console.log(chalk.gray('Get your API key at: https://www.unosend.co/api-keys\n'));

  const apiKey = await password({
    message: 'Enter your API key:',
    mask: '*',
    validate: (value) => {
      if (!value) return 'API key is required';
      if (!value.startsWith('un_')) return 'API key should start with "un_"';
      return true;
    },
  });

  const spinner = ora('Verifying API key...').start();
  
  setConfig('apiKey', apiKey);
  
  const result = await apiRequest<{ domains: unknown[] }>('/domains');
  
  if (!result.success) {
    spinner.fail('Invalid API key');
    setConfig('apiKey', '');
    console.log(chalk.red(`\n✗ ${result.error}`));
    console.log(chalk.gray('\nPlease check your API key and try again.'));
    process.exit(1);
  }

  spinner.succeed('API key verified!');
  
  console.log(chalk.green('\n✓ Unosend CLI configured successfully!\n'));
  console.log(chalk.gray('You can now use the following commands:'));
  console.log(chalk.white('  unosend send        '), chalk.gray('- Send an email'));
  console.log(chalk.white('  unosend domains     '), chalk.gray('- Manage sending domains'));
  console.log(chalk.white('  unosend contacts    '), chalk.gray('- Manage contacts'));
  console.log(chalk.white('  unosend audiences   '), chalk.gray('- Manage audiences'));
  console.log(chalk.white('  unosend broadcasts  '), chalk.gray('- Manage email broadcasts'));
  console.log(chalk.white('  unosend templates   '), chalk.gray('- Manage email templates'));
  console.log(chalk.white('  unosend webhooks    '), chalk.gray('- Manage webhooks'));
  console.log(chalk.white('  unosend api-keys    '), chalk.gray('- Manage API keys'));
  console.log(chalk.white('  unosend logs        '), chalk.gray('- View email logs'));
  console.log(chalk.white('  unosend usage       '), chalk.gray('- View usage stats'));
  console.log(chalk.white('  unosend --help      '), chalk.gray('- Show all commands'));
  console.log();
}
