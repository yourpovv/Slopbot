import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { shipEmbed } from '../../services/embeds';

const HASH_SHIFT = 5;
const PCT_RANGE = 101;

const cmd: Command = {
  name: 'ship',
  aliases: ['love', 'compat'],
  description: 'ship two users together',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('ship two users together')
    .addUserOption(o => o.setName('user1').setDescription('first person').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('second person').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const u1 = i.options.getUser('user1', true);
    const u2 = i.options.getUser('user2', true);
    const pct = seededRandom(u1.id, u2.id);
    const { embed, file } = shipEmbed(i.guildId!, u1.toString(), u2.toString(), pct);
    await i.reply({ embeds: [embed], files: [file] });
  },

  async prefix(msg: Message) {
    const users = msg.mentions.users;
    if (users.size < 2) return void await msg.reply('mention two people');
    const [u1, u2] = [...users.values()];
    const pct = seededRandom(u1.id, u2.id);
    const { embed, file } = shipEmbed(msg.guildId!, u1.toString(), u2.toString(), pct);
    await msg.reply({ embeds: [embed], files: [file] });
  },
};

function seededRandom(a: string, b: string): number {
  const sorted = [a, b].sort().join('');
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = ((hash << HASH_SHIFT) - hash + sorted.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PCT_RANGE;
}

export default cmd;
