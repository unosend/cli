import chalk from 'chalk';
import { getConfig, setConfig } from '../utils/config.js';

interface ConfigOptions {
  set?: string;
  get?: string;
  list?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  const config = getConfig();

  if (options.list) {
    console.log(chalk.cyan('\n📋 Configuration:\n'));
    console.log(chalk.white('  apiKey:  '), config.apiKey ? chalk.green(`${config.apiKey.slice(0, 10)}...`) : chalk.gray('(not set)'));
    console.log(chalk.white('  apiUrl:  '), chalk.green(config.apiUrl));
    console.log();
    return;
  }

  if (options.get) {
    const key = options.get as keyof typeof config;
    const value = config[key];
    if (value) {
      console.log(key === 'apiKey' ? `${value.slice(0, 10)}...` : value);
    } else {
      console.log(chalk.gray('(not set)'));
    }
    return;
  }

  if (options.set) {
    const [key, ...valueParts] = options.set.split('=');
    const value = valueParts.join('=');
    
    if (!key || !value) {
      console.log(chalk.red('✗ Invalid format. Use: --set key=value'));
      process.exit(1);
    }

    if (key !== 'apiKey' && key !== 'apiUrl') {
      console.log(chalk.red(`✗ Unknown config key: ${key}`));
      console.log(chalk.gray('  Valid keys: apiKey, apiUrl'));
      process.exit(1);
    }

    setConfig(key, value);
    console.log(chalk.green(`✓ Set ${key}`));
    return;
  }

  console.log(chalk.cyan('\n📋 Configuration:\n'));
  console.log(chalk.white('  apiKey:  '), config.apiKey ? chalk.green(`${config.apiKey.slice(0, 10)}...`) : chalk.gray('(not set)'));
  console.log(chalk.white('  apiUrl:  '), chalk.green(config.apiUrl));
  console.log(chalk.gray('\nUse --set, --get, or --list to manage config.'));
  console.log();
}
