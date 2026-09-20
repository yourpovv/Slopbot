import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../../types';
import { titled } from '../../services/embeds';
import { pick, rand } from './random';

const GRASS_GIFS = [
  'https://c.tenor.com/mXYLkm8bhXIAAAAC/tenor.gif'
];

const RESPONSES = [
  'touched grass for **{n}** seconds before running back inside',
  'went outside and immediately got hit by a frisbee',
  'touched grass successfully. the grass was not impressed',
  'tried to touch grass but it was artificial turf',
  'held a single blade of grass for **{n}** minutes. progress',
  'went outside, saw the sun, hissed, and went back in',
  'touched grass and it was wet. never again',
  'pet a dog while touching grass. 10/10 experience',
];

const cmd: Command = {
  name: 'touchgrass',
  aliases: ['grass', 'gooutside'],
  description: 'go touch some grass',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('touchgrass')
    .setDescription('go touch some grass'),

  async run(i: ChatInputCommandInteraction) {
    const text = pick(RESPONSES).replace('{n}', rand(1, 60).toString());
    const gif = pick(GRASS_GIFS);
    await i.reply({ embeds: [titled(i.guildId!, 'success', '🌿 touch grass', `${i.user} ${text}`).setImage(gif)] });
  },

  async prefix(msg: Message) {
    const text = pick(RESPONSES).replace('{n}', rand(1, 60).toString());
    const gif = pick(GRASS_GIFS);
    await msg.reply({ embeds: [titled(msg.guildId!, 'success', '🌿 touch grass', `${msg.author} ${text}`).setImage(gif)] });
  },
};

export default cmd;
