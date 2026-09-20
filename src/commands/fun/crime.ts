import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';
import { pick } from './random';

const CRIMES = [
  'stole {target}\'s lunch money',
  'hacked into {target}\'s minecraft account',
  'put a whoopee cushion on {target}\'s chair',
  'replaced {target}\'s shampoo with mayo',
  'signed {target} up for 47 newsletters',
  'stole all the left shoes from {target}\'s closet',
  'changed {target}\'s phone language to latin',
  'put googly eyes on everything in {target}\'s room',
  'swapped {target}\'s sugar with salt',
  'rickrolled {target} in front of their crush',
  'sent {target}\'s embarrassing photos to the group chat',
  'ate {target}\'s last slice of pizza',
  'unplugged {target}\'s phone charger at 2%',
  'spoiled the ending of {target}\'s favorite show',
  'replaced {target}\'s wifi password',
];

const cmd: Command = {
  name: 'crime',
  aliases: [],
  description: 'commit a random crime against someone',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('crime')
    .setDescription('commit a random crime')
    .addUserOption(o => o.setName('user').setDescription('the victim').setRequired(true)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user', true);
    const crime = pick(CRIMES).replace('{target}', target.toString());
    await i.reply({ embeds: [titled(i.guildId!, 'default', '🔫 crime', `${i.user} ${crime}`)] });
  },

  async prefix(msg: Message) {
    const target = msg.mentions.users.first();
    if (!target) return void await msg.reply('mention someone');
    const crime = pick(CRIMES).replace('{target}', target.toString());
    await msg.reply({ embeds: [titled(msg.guildId!, 'default', '🔫 crime', `${msg.author} ${crime}`)] });
  },
};

export default cmd;
