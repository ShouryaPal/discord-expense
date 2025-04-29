# Discord Expense Bot

A Discord bot that helps track expenses by storing them in a Google Sheet. The bot provides commands to add expenses and automatically updates monthly and yearly totals.

## Features

- Add expenses with date, category, amount, and description
- Automatic categorization with predefined categories
- Monthly and yearly expense totals
- Automatic sorting of expenses by date
- Bold headers and normal value formatting in the Google Sheet

## Prerequisites

1. Node.js (v14 or higher)
2. A Discord account
3. A Google Cloud account
4. A Google Sheet for storing expenses

## Setup Instructions

### 1. Discord Bot Setup

1. Create a Discord Bot:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" tab and click "Add Bot"
   - Under the bot section, click "Reset Token" to get your bot token
   - **Important**: Keep this token secure and never share it
   - Enable "Message Content Intent" under Privileged Gateway Intents
   - Enable "Server Members Intent" if you plan to use member-specific features

2. Invite the Bot:
   - Go to the "OAuth2" → "URL Generator" tab
   - Select the following scopes:
     - `bot`
     - `applications.commands`
   - Select the following bot permissions:
     - Send Messages
     - Use Slash Commands
     - Read Message History
   - Copy the generated URL and open it in your browser
   - Select your server and authorize the bot
   - Note down your Server ID (Enable Developer Mode in Discord settings, right-click your server → Copy ID)

### 2. Google API Setup

1. Create a Google Cloud Project:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Create Project" or select an existing one
   - Give your project a descriptive name

2. Enable the Google Sheets API:
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

3. Create a Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Give it a descriptive name (e.g., "discord-expense-bot")
   - Click "Create and Continue"
   - Grant this service account the "Editor" role
   - Click "Done"

4. Create and Download Service Account Key:
   - In the service account list, find your newly created account
   - Click on the three dots menu (⋮) and select "Manage keys"
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Click "Create" to download the key file
   - **Important**: Keep this JSON key file secure and never commit it to version control

5. Share the Google Sheet:
   - Create a new Google Sheet
   - Click the "Share" button in the top right
   - Add the email address of your service account (found in the JSON key file)
   - Set the permission to "Editor"
   - Click "Share"

### 3. Google Sheet Setup

1. Create a new Google Sheet
2. Share the sheet with the email address found in your `credentials.json` file (it will look like `something@project-id.iam.gserviceaccount.com`)
3. Give the service account "Editor" access
4. Copy the Sheet ID from the URL (it's the long string between /d/ and /edit in the URL)

### 4. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_SERVER_ID=your_discord_server_id
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

### 5. Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the bot:
   ```bash
   npm run dev
   ```

## Usage

The bot provides the following slash command:

- `/expense` - Add a new expense
  - `category`: Select from predefined categories
  - `amount`: The expense amount
  - `description`: A description of the expense
  - `date`: (Optional) The date of the expense (YYYY-MM-DD format)

## Predefined Categories

- Food & Dining
- Transportation
- Shopping
- Health
- Entertainment
- Bills & Utilities
- Travel
- Education
- Personal Care
- Gifts & Donations

## Google Sheet Structure

The sheet will automatically create and maintain three tables:

1. Main Expenses Table (Columns A-D):
   - Date
   - Category
   - Amount
   - Description

2. Yearly Totals (Columns F-G):
   - Year
   - Total Expenses

3. Monthly Totals (Columns I-J):
   - Month
   - Total Expenses (Current Year)

