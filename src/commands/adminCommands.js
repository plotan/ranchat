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