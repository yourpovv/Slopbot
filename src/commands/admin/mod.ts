import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel, MessageFlags, EmbedBuilder } from 'discord.js';
import { Command } from '../../types';
import { brandEmbed, asset } from '../../services/embeds';
import { COLORS, PREFIX } from '../../config';
import { getBrand } from '../../data/brand';

const P = PREFIX;

function modEmbed(guildId: string): EmbedBuilder {
  const cmds = [
    `🔨 \`/ban\` · \`${P}b\` - ban a member`,
    `👢 \`/kick\` · \`${P}k\` - kick a member`,
    `🔇 \`/mute\` · \`${P}stfu\` - timeout a member`,
    `🔊 \`/unmute\` · \`${P}untimeout\` - remove timeout`,
    `⚠️ \`/warn\` · \`${P}w\` - warn a member`,
    `📋 \`/warnings\` · \`${P}warns\` - view warnings`,
    `🧹 \`/purge\` · \`${P}clear\` - bulk delete messages`,
  ].join('\n');

  const tools = [
    `✏️ \`/forcenick\` · \`${P}fn\` - force a nickname`,
    `🎭 \`/impersonate\` · \`${P}fake\` - webhook impersonation`,
    `🤡 \`/fakekick\` · \`${P}bick\` - fake kick`,
    `🤡 \`/fakeban\` · \`${P}bean\` - fake ban`,
    `🎉 \`/giveaway\` · \`${P}gw\` - start a giveaway`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setDescription(
      `## moderation commands\n` +
      `staff-only commands for server management\n\n` +
      `### ╰ moderation\n${cmds}\n\n` +
      `### ╰ tools\n${tools}`
    )
    .setImage('attachment://moderation.png')
    .setFooter({ text: getBrand(guildId) });
}

const cmd: Command = {
  name: 'mod',
  aliases: ['modcmds', 'modhelp'],
  description: 'post the moderation commands menu',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('post the moderation commands menu'),

  async run(i: ChatInputCommandInteraction) {
    const ch = i.channel as TextChannel;
    const file = asset('moderation.png');
    await ch.send({ embeds: [modEmbed(i.guildId!)], files: [file] });
    await i.reply({ embeds: [brandEmbed(i.guildId!, 'success', 'mod menu posted')], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message) {
    const ch = msg.channel as TextChannel;
    const file = asset('moderation.png');
    await msg.delete().catch(() => {});
    await ch.send({ embeds: [modEmbed(msg.guildId!)], files: [file] });
  },
};

export default cmd;
