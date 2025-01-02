import { Logger } from '../logger.js';
import { getMessageType, getMessageContent } from '../utils/messageTypes.js';

export class AdminBroadcast {
  constructor(bot, adminIds) {
    this.bot = bot;
    this.adminIds = adminIds;
  }

  async broadcastMessage(fromUserId, toUserId, message) {
    const messageInfo = getMessageContent(message);
    const headerText = this.formatHeader(fromUserId, toUserId);

    for (const adminId of this.adminIds) {
      try {
        await this.sendMessageToAdmin(adminId, headerText, messageInfo);
      } catch (error) {
        Logger.error(error, { 
          action: 'admin_broadcast',
          adminId,
          fromUserId,
          toUserId,
          messageType: messageInfo.type
        });
      }
    }
  }

  formatHeader(fromUserId, toUserId) {
    return `👥 *Chat Broadcast*\n` +
           `From: \`${fromUserId}\`\n` +
           `To: \`${toUserId}\`\n\n`;
  }

  async sendMessageToAdmin(adminId, headerText, messageInfo) {
    switch (messageInfo.type) {
      case 'text':
        await this.bot.sendMessage(adminId, 
          `${headerText}${messageInfo.content}`, 
          { parse_mode: "Markdown" }
        );
        break;

      case 'photo':
        await this.bot.sendPhoto(adminId, 
          messageInfo.content,
          { 
            caption: `${headerText}${messageInfo.caption || ''}`,
            parse_mode: "Markdown"
          }
        );
        break;

      case 'sticker':
        await this.bot.sendMessage(adminId, headerText, { parse_mode: "Markdown" });
        await this.bot.sendSticker(adminId, messageInfo.content);
        break;

      case 'video':
        await this.bot.sendVideo(adminId,
          messageInfo.content,
          {
            caption: `${headerText}${messageInfo.caption || ''}`,
            parse_mode: "Markdown"
          }
        );
        break;

      case 'voice':
        await this.bot.sendMessage(adminId, headerText, { parse_mode: "Markdown" });
        await this.bot.sendVoice(adminId, messageInfo.content);
        break;

      case 'document':
        await this.bot.sendDocument(adminId,
          messageInfo.content,
          {
            caption: `${headerText}${messageInfo.caption || ''}`,
            parse_mode: "Markdown"
          }
        );
        break;

      default:
        await this.bot.sendMessage(adminId,
          `${headerText}[Unsupported message type]`,
          { parse_mode: "Markdown" }
        );
    }
  }
}