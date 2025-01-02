export function getMessageType(message) {
  if (message.text) return 'text';
  if (message.photo) return 'photo';
  if (message.sticker) return 'sticker';
  if (message.video) return 'video';
  if (message.voice) return 'voice';
  if (message.document) return 'document';
  return 'unknown';
}

export function getMessageContent(message) {
  const type = getMessageType(message);
  switch (type) {
    case 'text':
      return { type, content: message.text };
    case 'photo':
      return { 
        type,
        content: message.photo[message.photo.length - 1].file_id,
        caption: message.caption
      };
    case 'sticker':
      return { type, content: message.sticker.file_id };
    case 'video':
      return { 
        type,
        content: message.video.file_id,
        caption: message.caption
      };
    case 'voice':
      return { type, content: message.voice.file_id };
    case 'document':
      return { 
        type,
        content: message.document.file_id,
        caption: message.caption
      };
    default:
      return { type: 'unknown', content: null };
  }
}