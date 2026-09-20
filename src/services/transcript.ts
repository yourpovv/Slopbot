import { TextChannel, Message, AttachmentBuilder, PublicThreadChannel, AnyThreadChannel } from 'discord.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getBrand } from '../data/brand';

const TRANSCRIPTS_DIR = join(__dirname, '..', '..', 'transcripts');

if (!existsSync(TRANSCRIPTS_DIR)) {
  mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

interface TranscriptMessage {
  authorId: string;
  authorTag: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  attachments: string[];
  embeds: { title?: string; description?: string; fields: { name: string; value: string }[] }[];
  isBot: boolean;
}

export async function generateTranscript(channel: TextChannel | PublicThreadChannel | AnyThreadChannel, ticketNumber: number, guildId: string): Promise<AttachmentBuilder> {
  const messages = await fetchAllMessages(channel);
  const html = createHTML(messages, channel.name, ticketNumber, guildId);
  
  const filename = `ticket-${ticketNumber}-${Date.now()}.html`;
  const filepath = join(TRANSCRIPTS_DIR, filename);
  
  writeFileSync(filepath, html, 'utf-8');
  
  return new AttachmentBuilder(filepath, { name: filename });
}

async function fetchAllMessages(channel: TextChannel | PublicThreadChannel | AnyThreadChannel): Promise<TranscriptMessage[]> {
  const messages: TranscriptMessage[] = [];
  let lastId: string | undefined;

  while (true) {
    const options: { limit: number; before?: string } = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    batch.forEach((msg: Message) => {
      const embedData = msg.embeds.map(embed => ({
        title: embed.title ?? undefined,
        description: embed.description ?? undefined,
        fields: embed.fields.map(f => ({ name: f.name, value: f.value })),
      }));

      messages.push({
        authorId: msg.author.id,
        authorTag: msg.author.tag,
        authorDisplayName: msg.member?.displayName ?? msg.author.username,
        authorAvatar: msg.author.displayAvatarURL({ size: 128 }),
        content: msg.content || '',
        timestamp: msg.createdAt,
        attachments: msg.attachments.map(a => a.url),
        embeds: embedData,
        isBot: msg.author.bot,
      });
    });

    lastId = batch.last()?.id;
    if (batch.size < 100) break;
  }

  return messages.reverse();
}

function createHTML(messages: TranscriptMessage[], channelName: string, ticketNumber: number, guildId: string): string {
  const messagesHTML = messages.map(msg => createMessageHTML(msg)).join('\n');
  const brand = getBrand(guildId);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket #${ticketNumber} Transcript</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0c0b10 0%, #18171c 100%);
      color: #eae6f2;
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
      animation: aurora 8s ease infinite;
      pointer-events: none;
      z-index: 0;
    }

    @keyframes aurora {
      0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
      33% { opacity: 0.5; transform: scale(1.1) rotate(5deg); }
      66% { opacity: 0.4; transform: scale(1.05) rotate(-5deg); }
    }

    @keyframes unfold {
      0% { opacity: 0; transform: perspective(800px) rotateX(-70deg) scaleY(0.85); }
      100% { opacity: 1; transform: perspective(800px) rotateX(0deg) scaleY(1); }
    }

    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 20px rgba(167, 139, 250, 0.15); }
      50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.3); }
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      animation: unfold 0.8s cubic-bezier(0.23, 1, 0.32, 1) both;
    }

    .header {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      animation: glow-pulse 4s ease-in-out infinite;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 25%, #c4b5fd 50%, #e0e7ff 75%, #ddd6fe 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 6s ease infinite;
      margin-bottom: 0.5rem;
    }

    @keyframes gradient-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .header .meta {
      color: #a78bfa;
      font-size: 1rem;
      opacity: 0.8;
    }

    .messages {
      background: rgba(24, 23, 28, 0.6);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.5rem;
      overflow: hidden;
    }

    .message {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      transition: background 0.2s;
      margin-bottom: 0.5rem;
    }

    .message:hover {
      background: rgba(54, 57, 63, 0.3);
    }

    .message .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2px solid rgba(139, 92, 246, 0.2);
    }

    .message .content-wrapper {
      flex: 1;
      min-width: 0;
    }

    .message .header-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .message .username {
      font-weight: 600;
      font-size: 0.9rem;
      color: #dcddde;
    }

    .message.bot .username {
      color: #5865f2;
    }

    .message .bot-badge {
      background: #5865f2;
      color: white;
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .message .timestamp {
      color: #72767d;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .message .text {
      color: #dcddde;
      font-size: 0.9rem;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message .embed {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: rgba(47, 49, 54, 0.4);
      border-left: 4px solid #a78bfa;
      border-radius: 4px;
    }

    .message .embed-title {
      font-weight: 600;
      color: #dcddde;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .message .embed-description {
      color: #b9bbbe;
      font-size: 0.875rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    .message .embed-fields {
      margin-top: 0.5rem;
    }

    .message .embed-field {
      margin-bottom: 0.5rem;
    }

    .message .field-name {
      font-weight: 600;
      color: #dcddde;
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
    }

    .message .field-value {
      color: #b9bbbe;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .message .attachments {
      margin-top: 0.5rem;
    }

    .message .attachment {
      display: inline-block;
      max-width: 400px;
      margin: 0.25rem 0.5rem 0.25rem 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .message .attachment img {
      width: 100%;
      height: auto;
      display: block;
    }

    .footer {
      text-align: center;
      margin-top: 2rem;
      padding: 1.5rem;
      color: #a78bfa;
      font-size: 0.85rem;
      opacity: 0.6;
    }

    .glass-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.3), transparent);
      margin: 1.5rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 Ticket #${ticketNumber}</h1>
      <p class="meta">${channelName} • ${messages.length} messages • ${new Date().toLocaleString()}</p>
    </div>

    <div class="messages">
      ${messagesHTML}
    </div>

    <div class="footer">
      <div class="glass-line"></div>
      <p>transcript generated by ${brand} • ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;
}

function createMessageHTML(msg: TranscriptMessage): string {
  const time = msg.timestamp.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const embedsHTML = msg.embeds.length > 0
    ? msg.embeds.map(embed => {
        const titleHTML = embed.title ? `<div class="embed-title">${escapeHTML(embed.title)}</div>` : '';
        const descHTML = embed.description ? `<div class="embed-description">${escapeHTML(embed.description)}</div>` : '';
        const fieldsHTML = embed.fields.length > 0
          ? `<div class="embed-fields">${embed.fields.map(f => 
              `<div class="embed-field"><div class="field-name">${escapeHTML(f.name)}</div><div class="field-value">${escapeHTML(f.value)}</div></div>`
            ).join('')}</div>`
          : '';
        return `<div class="embed">${titleHTML}${descHTML}${fieldsHTML}</div>`;
      }).join('')
    : '';

  const attachmentsHTML = msg.attachments.length > 0
    ? `<div class="attachments">${msg.attachments.map(url => 
        `<div class="attachment"><img src="${url}" alt="attachment" loading="lazy" /></div>`
      ).join('')}</div>`
    : '';

  const textHTML = msg.content ? `<div class="text">${escapeHTML(msg.content)}</div>` : '';
  const contentHTML = textHTML || embedsHTML || '<div class="text">[no content]</div>';

  const botClass = msg.isBot ? ' bot' : '';
  const botBadge = msg.isBot ? '<span class="bot-badge">BOT</span>' : '';

  return `
    <div class="message${botClass}">
      <img class="avatar" src="${msg.authorAvatar}" alt="${msg.authorTag}" />
      <div class="content-wrapper">
        <div class="header-row">
          <span class="username">${escapeHTML(msg.authorDisplayName)}</span>
          ${botBadge}
          <span class="timestamp">${time}</span>
        </div>
        ${contentHTML}
        ${embedsHTML && msg.content ? embedsHTML : ''}
        ${attachmentsHTML}
      </div>
    </div>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
