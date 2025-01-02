import { Logger } from '../logger.js';

export class AdminCommands {
  constructor(bot, userManager) {
    this.bot = bot;
    this.userManager = userManager;
    this.adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => Number(id)) : [];
  }

  init() {
    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const userId = msg.from.id;
      
      if (!this.isAdmin(userId)) {
        Logger.userAction(userId, 'STATS_REJECTED', { reason: 'not_admin' });
        return;
      }

      const stats = this.userManager.getStats();
      const message = this.formatStats(stats);
      
      Logger.userAction(userId, 'STATS_REQUESTED', stats);
      await this.bot.sendMessage(userId, message);
    });

    // Announce command
    this.bot.onText(/\/announce (.+)/, async (msg, match) => {
      const userId = msg.from.id;
      const announcementText = match[1];
      
      if (!this.isAdmin(userId)) {
        Logger.userAction(userId, 'ANNOUNCE_REJECTED', { reason: 'not_admin' });
        return;
      }

      await this.sendAnnouncement(userId, announcementText);
    });
  }

  async sendAnnouncement(adminId, text) {
    const onlineUsers = this.userManager.getOnlineUsers();
    const formattedMessage = this.formatAnnouncement(text);
    let sentCount = 0;

    Logger.userAction(adminId, 'ANNOUNCEMENT_STARTED', { 
      text,
      targetUsers: onlineUsers.length 
    });

    for (const userId of onlineUsers) {
      try {
        await this.bot.sendMessage(userId, formattedMessage, { parse_mode: "Markdown" });
        sentCount++;
      } catch (error) {
        Logger.error(error, { 
          adminId,
          targetUserId: userId,
          action: 'send_announcement'
        });
      }
    }

    // Send confirmation to admin
    const confirmationMsg = `✅ Announcement sent to ${sentCount} users`;
    await this.bot.sendMessage(adminId, confirmationMsg);

    Logger.userAction(adminId, 'ANNOUNCEMENT_COMPLETED', { 
      text,
      sentCount,
      totalTargeted: onlineUsers.length 
    });
  }

  formatAnnouncement(text) {
    return `📢 *Announcement*\n\n${text}`;
  }

  isAdmin(userId) {
    return this.adminIds.includes(userId);
  }

  formatStats(stats) {
    return `📊 Bot Statistics\n\n` +
           `👥 Total Users: ${stats.totalUsers}\n` +
           `⏳ Waiting Users: ${stats.waitingUsers}\n` +
           `🔄 Active Chats: ${stats.activeChats}\n` +
           `💬 Connected Users: ${stats.connectedUsers}`;
  }
}