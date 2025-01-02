import { Logger } from '../logger.js';
import { getUserDisplayName } from '../utils/userInfo.js';

export class MessageHandler {
  constructor(bot, userManager) {
    this.bot = bot;
    this.userManager = userManager;
  }

  async handleMessage(msg) {
    try {
      const userId = msg.from.id;
      const userName = getUserDisplayName(msg.from);
      const partnerId = this.userManager.getPartner(userId);

      // Ignore command messages
      if (msg.text?.startsWith('/')) return;

      if (!partnerId) {
        return this.handleUnconnectedUserMessage(userId, userName);
      }

      const messageInfo = this.getMessageInfo(msg);
      await this.logAndForwardMessage(userId, userName, partnerId, messageInfo);
    } catch (error) {
      Logger.error(error, { userId: msg.from.id });
      await this.bot.sendMessage(msg.from.id, "Sorry, there was an error processing your message.");
    }
  }

  async handleUnconnectedUserMessage(userId, userName) {
    Logger.userAction(userId, 'MESSAGE_REJECTED', { 
      userName,
      reason: this.userManager.isUserWaiting(userId) ? 'waiting' : 'no_partner' 
    });
    
    const message = this.userManager.isUserWaiting(userId)
      ? "Please wait while we find a partner for you. Your message will not be delivered until you're matched."
      : "You are not connected to anyone. Use /start to find a partner.";
    
    await this.bot.sendMessage(userId, message);
  }

  async logAndForwardMessage(userId, userName, partnerId, messageInfo) {
    if (!messageInfo) return;

    // Log message details
    Logger.chatEvent(userId, partnerId, 'MESSAGE_SENT', {
      userName,
      type: messageInfo.type,
      content: messageInfo.content,
      timestamp: new Date().toISOString()
    });

    // Forward message to partner
    await messageInfo.forward(partnerId);
  }
}