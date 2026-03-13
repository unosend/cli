import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { apiRequest, handleError, formatDate } from '../utils/api.js';
import { hasApiKey } from '../utils/config.js';
import { tableBorder, getStatusBadge } from '../utils/format.js';

interface Domain {
  id: string;
  domain: string;
  status: string;
  created_at: string;
  verified_at?: string;
  dns_records?: DnsRecord[];
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
}

interface DomainsResponse {
  data: Domain[];
}

interface DomainResponse {
  domain: Domain;
  success?: boolean;
}

async function resolveDomainId(domainName: string): Promise<string | null> {
  const result = await apiRequest<DomainsResponse>('/domains');
  if (!result.success) return null;
  const domains = result.data?.data || [];
  const match = domains.find((d: Domain) => d.domain === domainName);
  return match?.id || null;
}

export async function domainsCommand(action?: string, domain?: string): Promise<void> {
  if (!hasApiKey()) {
    console.log(chalk.yellow('⚠ Not logged in. Run `unosend init` first.'));
    process.exit(1);
  }

  if (!action) action = 'list';

  switch (action) {
    case 'list':
    case 'ls':
      await listDomains();
      break;
    case 'add':
    case 'create':
      if (!domain) {
        console.log(chalk.red('✗ Domain name required. Usage: unosend domains add <domain>'));
        process.exit(1);
      }
      await addDomain(domain);
      break;
    case 'verify':
    case 'check':
      if (!domain) {
        console.log(chalk.red('✗ Domain name required. Usage: unosend domains verify <domain>'));
        process.exit(1);
      }
      await verifyDomain(domain);
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      if (!domain) {
        console.log(chalk.red('✗ Domain name required. Usage: unosend domains remove <domain>'));
        process.exit(1);
      }
      await removeDomain(domain);
      break;
    case 'show':
    case 'info':
      if (!domain) {
        console.log(chalk.red('✗ Domain name required. Usage: unosend domains show <domain>'));
        process.exit(1);
      }
      await showDomain(domain);
      break;
    default:
      console.log(chalk.red(`✗ Unknown action: ${action}`));
      console.log(chalk.gray('  Available actions: list, add, verify, remove, show'));
      process.exit(1);
  }
}

async function listDomains(): Promise<void> {
  const spinner = ora('Fetching domains...').start();
  
  const result = await apiRequest<DomainsResponse>('/domains');
  
  if (!result.success) {
    spinner.fail('Failed to fetch domains');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const domains = result.data?.data || [];
  
  if (domains.length === 0) {
    console.log(chalk.yellow('\n📭 No domains configured yet.'));
    console.log(chalk.gray('   Add one with: unosend domains add <domain>\n'));
    return;
  }

  console.log(chalk.cyan(`\n📧 Domains (${domains.length}):\n`));

  const tableData = [
    [chalk.white.bold('Domain'), chalk.white.bold('Status'), chalk.white.bold('Created')],
    ...domains.map((d: Domain) => [
      chalk.white(d.domain),
      getStatusBadge(d.status),
      chalk.gray(formatDate(d.created_at)),
    ]),
  ];

  console.log(table(tableData, { border: tableBorder }));
}

async function addDomain(domain: string): Promise<void> {
  const spinner = ora(`Adding domain ${domain}...`).start();
  
  const result = await apiRequest<DomainResponse>('/domains', {
    method: 'POST',
    body: { domain },
  });

  if (!result.success) {
    spinner.fail('Failed to add domain');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed(`Domain ${domain} added!`);
  
  const dnsRecords = result.data?.domain?.dns_records;
  if (dnsRecords && dnsRecords.length > 0) {
    console.log(chalk.cyan('\n📝 Add these DNS records to verify your domain:\n'));
    
    const tableData = [
      [chalk.white.bold('Type'), chalk.white.bold('Name'), chalk.white.bold('Value')],
      ...dnsRecords.map((r: DnsRecord) => [
        chalk.yellow(r.type),
        chalk.white(r.name),
        chalk.gray(r.value.length > 50 ? r.value.slice(0, 50) + '...' : r.value),
      ]),
    ];

    console.log(table(tableData));
    console.log(chalk.gray('After adding records, run: unosend domains verify ' + domain));
  }
}

async function verifyDomain(domain: string): Promise<void> {
  const spinner = ora(`Verifying domain ${domain}...`).start();

  const domainId = await resolveDomainId(domain);
  if (!domainId) {
    spinner.fail(`Domain "${domain}" not found. Run \`unosend domains list\` to see your domains.`);
    process.exit(1);
  }
  
  const result = await apiRequest<DomainResponse>(`/domains/${domainId}/verify`, {
    method: 'POST',
  });

  if (!result.success) {
    spinner.fail('Verification failed');
    handleError(result.error || 'Unknown error');
    return;
  }

  const status = result.data?.domain?.status || 'pending';
  
  if (status === 'verified' || status === 'active') {
    spinner.succeed(`Domain ${domain} is verified!`);
    console.log(chalk.green('\n✓ You can now send emails from this domain.\n'));
  } else {
    spinner.warn('DNS records not yet propagated');
    console.log(chalk.yellow('\n⏳ Please wait for DNS propagation (can take up to 48 hours).'));
    console.log(chalk.gray('   Then run: unosend domains verify ' + domain + '\n'));
  }
}

async function removeDomain(domain: string): Promise<void> {
  const spinner = ora(`Removing domain ${domain}...`).start();

  const domainId = await resolveDomainId(domain);
  if (!domainId) {
    spinner.fail(`Domain "${domain}" not found. Run \`unosend domains list\` to see your domains.`);
    process.exit(1);
  }
  
  const result = await apiRequest<DomainResponse>(`/domains/${domainId}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    spinner.fail('Failed to remove domain');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.succeed(`Domain ${domain} removed.`);
}

async function showDomain(domain: string): Promise<void> {
  const spinner = ora(`Fetching domain info...`).start();

  const domainId = await resolveDomainId(domain);
  if (!domainId) {
    spinner.fail(`Domain "${domain}" not found. Run \`unosend domains list\` to see your domains.`);
    process.exit(1);
  }
  
  const result = await apiRequest<DomainResponse>(`/domains/${domainId}`);

  if (!result.success) {
    spinner.fail('Failed to fetch domain');
    handleError(result.error || 'Unknown error');
    return;
  }

  spinner.stop();

  const d = result.data?.domain;
  if (!d) {
    console.log(chalk.red('✗ Domain not found'));
    return;
  }

  console.log(chalk.cyan(`\n📧 Domain: ${d.domain}\n`));
  console.log(chalk.white('  Status:     '), getStatusBadge(d.status));
  console.log(chalk.white('  Created:    '), chalk.gray(formatDate(d.created_at)));
  if (d.verified_at) {
    console.log(chalk.white('  Verified:   '), chalk.gray(formatDate(d.verified_at)));
  }

  if (d.dns_records && d.dns_records.length > 0) {
    console.log(chalk.cyan('\n📝 DNS Records:\n'));
    
    for (const r of d.dns_records) {
      console.log(chalk.yellow(`  ${r.type}`), chalk.white(r.name));
      console.log(chalk.gray(`     ${r.value}\n`));
    }
  }
  console.log();
}
