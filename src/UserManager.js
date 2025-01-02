export class UserManager {
  constructor() {
    this.waitingUsers = new Set();
    this.chatPairs = new Map(); // userId -> partnerId
    this.allUsers = new Set(); // Track all users who have ever used the bot
  }

  findPartner(userId) {
    // Add to total users list
    this.allUsers.add(userId);

    // If user is already in chat, return null
    if (this.chatPairs.has(userId)) {
      return null;
    }

    // Remove user from waiting list if they were waiting
    this.waitingUsers.delete(userId);

    // Find a partner from waiting users
    for (const waitingUserId of this.waitingUsers) {
      if (waitingUserId !== userId) {
        // Create chat pair
        this.chatPairs.set(userId, waitingUserId);
        this.chatPairs.set(waitingUserId, userId);
        this.waitingUsers.delete(waitingUserId);
        return waitingUserId;
      }
    }

    // No partner found, add user to waiting list
    this.waitingUsers.add(userId);
    return null;
  }

  getPartner(userId) {
    return this.chatPairs.get(userId);
  }

  isUserInChat(userId) {
    return this.chatPairs.has(userId);
  }

  isUserWaiting(userId) {
    return this.waitingUsers.has(userId);
  }

  endChat(userId) {
    const partnerId = this.chatPairs.get(userId);
    if (partnerId) {
      this.chatPairs.delete(userId);
      this.chatPairs.delete(partnerId);
    }
    this.waitingUsers.delete(userId);
  }

  getStats() {
    return {
      totalUsers: this.allUsers.size,
      waitingUsers: this.waitingUsers.size,
      activeChats: this.chatPairs.size / 2, // Divide by 2 since each chat has 2 users
      connectedUsers: this.chatPairs.size
    };
  }

  getOnlineUsers() {
    // Return all users who are either in a chat or waiting
    return [...new Set([...this.waitingUsers, ...this.chatPairs.keys()])];
  }
}