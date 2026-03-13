<p align="center">
  <img src="https://www.unosend.co/logo.svg" alt="Unosend" width="48" height="48" />
</p>

<h1 align="center">Unosend CLI</h1>

<p align="center">
  Send emails from your terminal with the Unosend CLI.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/unosend"><img src="https://img.shields.io/npm/v/unosend.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/unosend"><img src="https://img.shields.io/npm/dm/unosend.svg" alt="npm downloads" /></a>
  <a href="https://github.com/unosend/cli/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/unosend.svg" alt="license" /></a>
</p>

```
╦ ╦╔╗╔╔═╗╔═╗╔═╗╔╗╔╔╦╗
║ ║║║║║ ║╚═╗║╣ ║║║ ║║
╚═╝╝╚╝╚═╝╚═╝╚═╝╝╚╝═╩╝
One API. Infinite Emails.
```

## Installation

```bash
npm install -g unosend
```

Or use with npx:

```bash
npx unosend send -f you@yourdomain.com -t user@example.com -s "Hello" --text "Hi"
```

## Quick Start

```bash
# 1. Initialize with your API key
unosend init

# 2. Send an email
unosend send -f you@yourdomain.com -t user@example.com -s "Hello!" --text "Hi there"

# 3. View your domains
unosend domains list

# 4. Check usage stats
unosend usage
```

Get your API key at [unosend.co/api-keys](https://www.unosend.co/api-keys).

## Commands

| Command | Description |
|---------|-------------|
| `unosend init` | Set up your API key |
| `unosend send` | Send an email |
| `unosend emails` | Get, resend, or cancel emails |
| `unosend broadcasts` | Manage email broadcasts |
| `unosend domains` | Manage sending domains |
| `unosend contacts` | Manage contacts |
| `unosend audiences` | Manage audiences |
| `unosend templates` | Manage email templates |
| `unosend webhooks` | Manage webhooks |
| `unosend api-keys` | Manage API keys |
| `unosend suppressions` | Manage email suppressions |
| `unosend inbound` | Manage inbound emails |
| `unosend validate` | Validate an email address |
| `unosend logs` | View email logs |
| `unosend usage` | View usage stats |
| `unosend config` | View or update configuration |
| `unosend whoami` | Show current auth status |

---

### `unosend init`

Set up your API key interactively. Get yours at [unosend.co/api-keys](https://www.unosend.co/api-keys).

### `unosend send`

Send an email.

```bash
# Basic email
unosend send -f you@yourdomain.com -t user@example.com -s "Subject" --text "Body"

# HTML email
unosend send -f you@yourdomain.com -t user@example.com -s "Subject" --html "<h1>Hello</h1>"

# From file
unosend send -f you@yourdomain.com -t user@example.com -s "Newsletter" --file ./email.html

# With display name
unosend send -f you@yourdomain.com -t user@example.com -s "Subject" --text "Body" --from-name "My App"

# Using a template
unosend send -f you@yourdomain.com -t user@example.com -s "Welcome" --template tmpl_abc123 --template-data '{"name":"John"}'

# Schedule for later
unosend send -f you@yourdomain.com -t user@example.com -s "Subject" --text "Body" --schedule "2026-04-01T09:00:00Z"

# With tags
unosend send -f you@yourdomain.com -t user@example.com -s "Subject" --text "Body" --tags "category:onboarding,env:production"

# With CC and BCC
unosend send -f you@yourdomain.com -t user@example.com -s "Subject" --text "Body" --cc "cc@example.com" --bcc "bcc@example.com"
```

**Options:**

| Option | Description |
|--------|-------------|
| `-t, --to <email>` | Recipient email (required) |
| `-s, --subject <subject>` | Subject line (required) |
| `-f, --from <email>` | Sender email (required) |
| `--html <html>` | HTML content |
| `--text <text>` | Plain text content |
| `--file <path>` | Read HTML from file |
| `--reply-to <email>` | Reply-to address |
| `--cc <emails>` | CC recipients (comma-separated) |
| `--bcc <emails>` | BCC recipients (comma-separated) |
| `--from-name <name>` | Sender display name |
| `--template <id>` | Template ID to use |
| `--template-data <json>` | Template variables as JSON |
| `--schedule <datetime>` | Schedule send (ISO 8601) |
| `--tags <tags>` | Tags as name:value pairs |

### `unosend emails`

Manage sent emails.

```bash
unosend emails get <email-id>       # Get email details
unosend emails resend <email-id>    # Resend an email
unosend emails cancel <email-id>    # Cancel a scheduled email
```

### `unosend broadcasts`

Manage email broadcasts (campaigns).

```bash
# List broadcasts
unosend broadcasts list

# Create a broadcast
unosend broadcasts create --name "March Newsletter" --subject "What's New" \
  --from newsletter@yourdomain.com --file ./newsletter.html --audience aud_123

# Get broadcast details
unosend broadcasts get <broadcast-id>

# Update a broadcast
unosend broadcasts update <broadcast-id> --subject "Updated Subject"

# Send a broadcast
unosend broadcasts send <broadcast-id>

# Schedule a broadcast
unosend broadcasts create --name "Campaign" --subject "Hi" \
  --from hi@yourdomain.com --text "Hello!" --audience aud_123 \
  --schedule "2026-04-01T09:00:00Z"

# Remove a broadcast
unosend broadcasts remove <broadcast-id>
```

### `unosend domains`

Manage your sending domains.

```bash
unosend domains list                  # List domains
unosend domains add example.com      # Add a domain
unosend domains verify example.com   # Verify domain DNS
unosend domains remove example.com   # Remove a domain
```

### `unosend contacts`

Manage contacts in your audiences.

```bash
# List contacts
unosend contacts list --audience <audience-id>

# Add a contact
unosend contacts add user@example.com --audience <audience-id> --first-name "John" --last-name "Doe"

# Get a contact
unosend contacts get <contact-id>

# Update a contact
unosend contacts update <contact-id> --first-name "Jane" --subscribed

# Remove a contact
unosend contacts remove <contact-id>
```

### `unosend audiences`

Manage audiences (contact lists).

```bash
unosend audiences list                                                     # List audiences
unosend audiences add "Newsletter Subscribers" --description "Main list"   # Create
unosend audiences get <audience-id>                                        # Get details
unosend audiences remove <audience-id>                                     # Remove
```

### `unosend templates`

Manage email templates.

```bash
# List templates
unosend templates list

# Create a template
unosend templates create "Welcome Email" --subject "Welcome!" --html "<h1>Welcome</h1>"

# Create from file
unosend templates create "Newsletter" --subject "Weekly Update" --file ./template.html

# Update a template
unosend templates update <template-id> --subject "New Subject" --html "<h1>Updated</h1>"

# Remove a template
unosend templates remove <template-id>
```

### `unosend webhooks`

Manage webhook endpoints.

```bash
# List webhooks
unosend webhooks list

# Add a webhook (all events)
unosend webhooks add https://example.com/webhook

# Add with specific events
unosend webhooks add https://example.com/webhook --events "email.delivered,email.bounced"

# View available events
unosend webhooks events

# Remove a webhook
unosend webhooks remove <webhook-id>
```

Available events: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.unsubscribed`

### `unosend api-keys`

Manage API keys.

```bash
unosend api-keys list                     # List API keys
unosend api-keys create "Production Key"  # Create a new key
unosend api-keys revoke <key-id>          # Revoke a key
```

### `unosend suppressions`

Manage email suppressions.

```bash
unosend suppressions list                                                # List suppressions
unosend suppressions add user@example.com --reason "User requested"      # Add
unosend suppressions get <suppression-id>                                # Get details
unosend suppressions remove <suppression-id>                             # Remove
```

### `unosend inbound`

Manage inbound (received) emails.

```bash
unosend inbound list               # List inbound emails
unosend inbound get <email-id>     # Get inbound email details
unosend inbound remove <email-id>  # Delete an inbound email
```

### `unosend validate`

Validate an email address.

```bash
unosend validate user@example.com
```

Returns: valid/invalid status, disposable check, role-based check, MX record check, and suggestions.

### `unosend usage`

View email usage and statistics.

```bash
unosend usage               # Default: last 30 days
unosend usage --period 7d   # Last 7 days
unosend usage --period 90d  # Last 90 days
```

Shows: emails sent/limit with progress bar, delivered, bounced, opened, clicked, contacts, and domains.

### `unosend logs`

View email sending logs.

```bash
unosend logs                    # Recent logs
unosend logs --limit 50         # More logs
unosend logs --status failed    # Filter by status
```

### `unosend config`

Manage configuration.

```bash
unosend config --list                 # View config
unosend config --set apiKey=un_xxxxx  # Update API key
unosend config --set apiUrl=https://custom.endpoint.com  # Custom endpoint
```

### `unosend whoami`

Show current authentication status and configured endpoint.

## Requirements

- Node.js >= 18.0.0
- An [Unosend](https://www.unosend.co) account and API key

## Links

- [Website](https://www.unosend.co)
- [Documentation](https://docs.unosend.co)
- [Dashboard](https://www.unosend.co/dashboard)
- [API Reference](https://docs.unosend.co/api-reference/introduction)

## License

MIT
