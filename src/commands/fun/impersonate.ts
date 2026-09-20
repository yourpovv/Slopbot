import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';

const cmd: Command = {
  name: 'impersonate',
  aliases: ['fake'],
  description: 'impersonate a user with a webhook',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('impersonate')
    .setDescription('impersonate a user with a webhook')
    .addUserOption(o => o.setName('user').setDescription('who to impersonate').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('what to say').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    const text = i.options.getString('message', true);
    await send(i.channel as TextChannel, target.displayName, target.displayAvatarURL(), text);
    await i.reply({ embeds: [titled(i.guildId!, 'success', '🎭 done', 'message sent')], flags: MessageFlags.Ephemeral });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.users.first();
    if (!target) return void await msg.reply('mention someone');
    const text = args.slice(1).join(' ');
    if (!text) return void await msg.reply('type a message');
    await msg.delete().catch(() => {});
    const member = msg.guild?.members.cache.get(target.id);
    const name = member?.displayName ?? target.displayName;
    await send(msg.channel as TextChannel, name, target.displayAvatarURL(), text);
  },
};

async function send(channel: TextChannel, name: string, avatar: string, content: string): Promise<void> {
  const webhook = await channel.createWebhook({ name, avatar });
  await webhook.send({ content });
  await webhook.delete();
}

export default cmd;
