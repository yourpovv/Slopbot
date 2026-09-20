import { Guild, GuildMember, PermissionFlagsBits } from 'discord.js';

export function canNick(guild: Guild, target: GuildMember): string | null {
  const me = guild.members.me;
  if (!me) return 'bot member not cached - try again';

  if (!me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return 'bot is missing the **Manage Nicknames** permission - add it in server settings → roles';
  }

  if (target.id === guild.ownerId) {
    return 'discord doesn\'t let bots change the **server owner\'s** nickname - this is a platform limitation';
  }

  if (target.roles.highest.position >= me.roles.highest.position) {
    return `can't change **${target.displayName}**'s nickname - their highest role is above (or equal to) the bot's role. drag the bot's role higher in server settings → roles`;
  }

  return null;
}
