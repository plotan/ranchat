export function getUserDisplayName(user) {
  return user.username || user.first_name || 'None';
}