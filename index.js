require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { google } = require("googleapis");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const googleSheetsAuth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Predefined categories
const predefinedCategories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Health",
  "Entertainment",
  "Bills & Utilities",
  "Travel",
  "Education",
  "Personal Care",
  "Gifts & Donations",
];

const categories = new Set(predefinedCategories);

async function applyBoldFormatting(range) {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });
    
    const request = {
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: range.startRowIndex,
              endRowIndex: range.endRowIndex,
              startColumnIndex: range.startColumnIndex,
              endColumnIndex: range.endColumnIndex
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: true
                }
              }
            },
            fields: "userEnteredFormat.textFormat.bold"
          }
        }]
      }
    };

    await sheets.spreadsheets.batchUpdate(request);
    console.log("Applied bold formatting to headers");
  } catch (error) {
    console.error("Error applying bold formatting:", error);
  }
}

async function updateYearlyTotals() {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });
    
    // Get all expenses
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A2:D",
    });

    const values = response.data.values || [];
    
    // Create a map to store yearly totals
    const yearlyTotals = new Map();
    
    // Process each expense
    values.forEach((row) => {
      if (row.length >= 3) {
        const date = row[0];
        const amount = parseFloat(row[2]);
        
        if (date && !isNaN(amount)) {
          const year = date.split('-')[0];
          yearlyTotals.set(year, (yearlyTotals.get(year) || 0) + amount);
        }
      }
    });

    // Prepare the yearly totals data
    const yearlyData = Array.from(yearlyTotals.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, total]) => [year, total]);

    // Update or create the yearly totals table
    const request = {
      spreadsheetId: spreadsheetId,
      range: "Sheet1!F1:G1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["Year", "Total Expenses"]],
      },
    };

    await sheets.spreadsheets.values.update(request);
    
    // Apply bold formatting to headers
    await applyBoldFormatting({
      startRowIndex: 0,
      endRowIndex: 1,
      startColumnIndex: 5,
      endColumnIndex: 7
    });
    
    if (yearlyData.length > 0) {
      const dataRequest = {
        spreadsheetId: spreadsheetId,
        range: `Sheet1!F2:G${yearlyData.length + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: yearlyData,
        },
      };

      await sheets.spreadsheets.values.update(dataRequest);
    }

    console.log("Yearly totals updated successfully");
  } catch (error) {
    console.error("Error updating yearly totals:", error);
  }
}

async function updateMonthlyTotals() {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });
    
    // Get all expenses
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A2:D",
    });

    const values = response.data.values || [];
    const currentYear = new Date().getFullYear().toString();
    
    // Create a map to store monthly totals
    const monthlyTotals = new Map();
    
    // Process each expense
    values.forEach((row) => {
      if (row.length >= 3) {
        const date = row[0];
        const amount = parseFloat(row[2]);
        
        if (date && !isNaN(amount)) {
          const [year, month] = date.split('-');
          if (year === currentYear) {
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
            monthlyTotals.set(monthName, (monthlyTotals.get(monthName) || 0) + amount);
          }
        }
      }
    });

    // Prepare the monthly totals data
    const monthlyData = Array.from(monthlyTotals.entries())
      .sort((a, b) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(a[0]) - months.indexOf(b[0]);
      })
      .map(([month, total]) => [month, total]);

    // Update or create the monthly totals table
    const request = {
      spreadsheetId: spreadsheetId,
      range: "Sheet1!I1:J1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [["Month", `Total Expenses (${currentYear})`]],
      },
    };

    await sheets.spreadsheets.values.update(request);
    
    // Apply bold formatting to headers
    await applyBoldFormatting({
      startRowIndex: 0,
      endRowIndex: 1,
      startColumnIndex: 8,
      endColumnIndex: 10
    });
    
    if (monthlyData.length > 0) {
      const dataRequest = {
        spreadsheetId: spreadsheetId,
        range: `Sheet1!I2:J${monthlyData.length + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: monthlyData,
        },
      };

      await sheets.spreadsheets.values.update(dataRequest);
    }

    console.log("Monthly totals updated successfully");
  } catch (error) {
    console.error("Error updating monthly totals:", error);
  }
}

async function sortExpensesByDate() {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });
    
    // Get all expenses (excluding header)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A2:D",
    });

    const values = response.data.values || [];
    
    // Sort the expenses by date
    const sortedValues = values.sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateA - dateB;
    });

    // Clear the existing data (excluding header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A2:D",
    });

    // Write the sorted data back
    if (sortedValues.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: "Sheet1!A2:D",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: sortedValues,
        },
      });
    }

    console.log("Expenses sorted by date successfully");
  } catch (error) {
    console.error("Error sorting expenses by date:", error);
  }
}

async function addExpenseToSheet(date, category, amount, description) {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });

    // First, add the values with normal formatting
    const request = {
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A1:D1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[date, category, amount, description]],
      },
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log("Expense added to sheet:", response.data);
    categories.add(category);
    
    // Apply normal formatting to the new row
    const formatRequest = {
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: response.data.updates.updatedRange.split("!")[1].split(":")[0].match(/\d+/)[0] - 1,
              endRowIndex: response.data.updates.updatedRange.split("!")[1].split(":")[0].match(/\d+/)[0],
              startColumnIndex: 0,
              endColumnIndex: 4
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: false
                }
              }
            },
            fields: "userEnteredFormat.textFormat.bold"
          }
        }]
      }
    };

    await sheets.spreadsheets.batchUpdate(formatRequest);
    
    // Sort the expenses after adding new one
    await sortExpensesByDate();
    
    // Update both yearly and monthly totals after adding new expense
    await updateYearlyTotals();
    await updateMonthlyTotals();
    
    return true;
  } catch (error) {
    console.error("Error adding expense to sheet:", error);
    return false;
  }
}

async function loadExistingCategories() {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!B2:B",
    });

    const values = response.data.values;
    if (values) {
      values.forEach((row) => {
        const category = row[0];
        if (category) {
          categories.add(category);
        }
      });
    }

    console.log("Loaded existing categories:", categories);
  } catch (error) {
    console.error("Error loading existing categories:", error);
  }
}

async function checkAndAddHeaders() {
  try {
    const sheets = google.sheets({ version: "v4", auth: googleSheetsAuth });

    // Check if the first row contains headers
    const checkHeadersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A1:D1",
    });

    const headerValues = checkHeadersResponse.data.values;

    // If the first row is empty or doesn't contain the expected headers, add them
    if (
      !headerValues ||
      headerValues.length === 0 ||
      headerValues[0].length !== 4 ||
      headerValues[0][0] !== "Date" ||
      headerValues[0][1] !== "Category" ||
      headerValues[0][2] !== "Amount" ||
      headerValues[0][3] !== "Description"
    ) {
      console.log("Adding headers to the sheet.");
      const request = {
        spreadsheetId: spreadsheetId,
        range: "Sheet1!A1:D1",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [["Date", "Category", "Amount", "Description"]],
        },
      };

      await sheets.spreadsheets.values.update(request, {
        valueInputOption: "USER_ENTERED",
      });
      
      // Apply bold formatting to headers
      await applyBoldFormatting({
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 4
      });
      
      console.log("Headers added successfully.");
    } else {
      console.log("Headers already exist in the sheet.");
    }
  } catch (error) {
    console.error("Error checking/adding headers:", error);
  }
}

const expenseCommand = new SlashCommandBuilder()
  .setName("expense")
  .setDescription("Add an expense to the Google Sheet")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("The category of the expense")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addNumberOption((option) =>
    option
      .setName("amount")
      .setDescription("The amount of the expense")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("A description of the expense")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("date")
      .setDescription("The date of the expense (YYYY-MM-DD)")
      .setRequired(false),
  );

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  await checkAndAddHeaders();
  await loadExistingCategories();

  const commands = [expenseCommand.toJSON()];
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN,
  );

  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        client.user.id,
        process.env.DISCORD_SERVER_ID,
      ),
      { body: commands },
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "expense") {
      try {
        // Defer the reply to prevent timeout
        await interaction.deferReply();

        let date = interaction.options.getString("date");
        const category = interaction.options.getString("category");
        const amount = interaction.options.getNumber("amount");
        const description = interaction.options.getString("description");

        if (!date) {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          date = `${year}-${month}-${day}`;
        }

        const success = await addExpenseToSheet(
          date,
          category,
          amount,
          description,
        );

        if (success) {
          await interaction.editReply(
            `Expense added to Google Sheet!\nDate: ${date}\nCategory: ${category}\nAmount: ${amount}\nDescription: ${description}`,
          );
        } else {
          await interaction.editReply(
            "Failed to add expense to Google Sheet. Check logs.",
          );
        }
      } catch (error) {
        console.error("Error handling expense command:", error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply("An error occurred while processing your request. Please try again.");
          } else {
            await interaction.editReply("An error occurred while processing your request. Please try again.");
          }
        } catch (e) {
          console.error("Error sending error message:", e);
        }
      }
    }
  } else if (interaction.isAutocomplete()) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "category") {
      const input = focusedOption.value.toLowerCase();
      const allCategories = Array.from(categories);
      const filtered = allCategories
        .filter((choice) => choice.toLowerCase().includes(input))
        .slice(0, 25);
      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice })),
      );
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
