import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { UserManager } from './UserManager.js';
import { Logger } from './logger.js';
import { AdminCommands } from './commands/adminCommands.js';
import { MessageHandler } from './handlers/messageHandler.js';
import { AdminBroadcast } from './services/adminBroadcast.js';
import { getUserDisplayName } from './utils/userInfo.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => Number(id)) : [];

const bot = new TelegramBot(token, { polling: true });
const userManager = new UserManager();
const adminBroadcast = new AdminBroadcast(bot, adminIds);
const messageHandler = new MessageHandler(bot, userManager, adminBroadcast);

// Initialize admin commands
const adminCommands = new AdminCommands(bot, userManager);
adminCommands.init();

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const userName = getUserDisplayName(msg.from);

  Logger.userAction(userId, 'START_COMMAND', { userName });

  if (userManager.isUserInChat(userId)) {
    Logger.userAction(userId, 'START_REJECTED', { userName, reason: 'already_in_chat' });
    await bot.sendMessage(userId, "_You are already in a chat. Use /end to end current chat first_",{ parse_mode: "Markdown" });
    return;
  }

  // await bot.sendMessage(userId, "Looking for a chat partner...");
  const partnerId = userManager.findPartner(userId);

  if (partnerId) {
    Logger.chatEvent(userId, partnerId, 'CHAT_STARTED', { userName });
    await bot.sendMessage(
      userId,
      "_It's a match 🐣_\n" +
      "_ /next — Find new partner 🛑_\n" +
      "_ /end — Leave partner topic 💬_",
      { parse_mode: "Markdown" }
    );
    await bot.sendMessage(
      partnerId,
      "_It's a match 🐣_\n" +
      "_ /next — Find new partner 🛑_\n" +
      "_ /end — Leave partner topic 💬_",
      { parse_mode: "Markdown" }
    );
  } else {
    Logger.userAction(userId, 'WAITING_FOR_PARTNER', { userName });
    await bot.sendMessage(userId, "_Searching a new partner 🤙_", { parse_mode: "Markdown" });
  }
});

// Handle /end command
bot.onText(/\/end/, async (msg) => {
  const userId = msg.from.id;
  const userName = getUserDisplayName(msg.from);
  const partnerId = userManager.getPartner(userId);

  Logger.userAction(userId, 'END_COMMAND', { userName });

  if (!userManager.isUserInChat(userId)) {
    Logger.userAction(userId, 'END_REJECTED', { userName, reason: 'not_in_chat' });
    await bot.sendMessage(userId, "_You are not in a chat. Use /start to start finding partner_",{ parse_mode: "Markdown" });
    return;
  }

  if (partnerId) {
    Logger.chatEvent(userId, partnerId, 'CHAT_ENDED', { userName });
  }

  userManager.endChat(userId);
  await bot.sendMessage(userId, "_Chat ended. Use /start to start finding partner_",{ parse_mode: "Markdown" });
  if (partnerId) {
    await bot.sendMessage(partnerId, "_Your partner has ended the chat. Use /start to start finding partner_",{ parse_mode: "Markdown" });
  }
});

// Handle /next command
bot.onText(/\/next/, async (msg) => {
  const userId = msg.from.id;
  const userName = getUserDisplayName(msg.from);
  const currentPartnerId = userManager.getPartner(userId);

  Logger.userAction(userId, 'NEXT_COMMAND', { userName });

  if (!userManager.isUserInChat(userId)) {
    Logger.userAction(userId, 'NEXT_REJECTED', { userName, reason: 'not_in_chat' });
    await bot.sendMessage(userId, "_You are not in a chat. Use /start to find a partner_",{ parse_mode: "Markdown" });
    return;
  }

  // End current chat
  userManager.endChat(userId);
  if (currentPartnerId) {
    Logger.chatEvent(userId, currentPartnerId, 'CHAT_ENDED', { userName, reason: 'next' });
    await bot.sendMessage(currentPartnerId, "_Your partner has left the chat",{ parse_mode: "Markdown" });
  }

  // Find new partner
  await bot.sendMessage(userId, "Looking for a new partner...");
  const newPartnerId = userManager.findPartner(userId);

  if (newPartnerId) {
    Logger.chatEvent(userId, newPartnerId, 'CHAT_STARTED', { userName, previous_partner: currentPartnerId });
    // await bot.sendMessage(userId, "New partner found! You can start chatting now.");
    // await bot.sendMessage(newPartnerId, "Partner found! You can start chatting now.");
    await bot.sendMessage(
      userId,
      "_It's a match 🐣_\n" +
      "_\\/next \\— Find new partner 🛑_\n" +
      "_\\/end \\— Leave partner topic 💬_",
      { parse_mode: "Markdown" }
    );
    await bot.sendMessage(
      partnerId,
      "_It's a match 🐣_\n" +
      "_\\/next \\— Find new partner 🛑_\n" +
      "_\\/end \\— Leave partner topic 💬_",
      { parse_mode: "Markdown" }
    );
  } else {
    Logger.userAction(userId, 'WAITING_FOR_PARTNER', { userName, previous_partner: currentPartnerId });
    // await bot.sendMessage(userId, "Waiting for someone to join...");
    await bot.sendMessage(userId, "_Searching a new partner 🤙_", { parse_mode: "Markdown" });

  }
});