import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types';
import { brandEmbed } from '../../services/embeds';
import * as rep from '../../data/rep';

const cmd: Command = {
  name: 'rep',
  aliases: ['+rep'],
  description: 'give someone rep or check yours',
  cooldown: 0,
  permissions: [],
  staffOnly: false,
  slash: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('give rep or check your own')
    .addUserOption(o => o.setName('user').setDescription('who to rep').setRequired(false)),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getUser('user');
    const guild = i.guildId!;

    if (!target) {
      const total = rep.count(guild, i.user.id);
      await i.reply({ embeds: [brandEmbed(guild, 'info', `${i.user} has **${total}** rep`)] });
      return;
    }

    if (target.id === i.user.id) {
      await i.reply({ embeds: [brandEmbed(guild, 'error', "can't rep yourself")], flags: MessageFlags.Ephemeral });
      return;
    }
    if (target.bot) {
      await i.reply({ embeds: [brandEmbed(guild, 'error', "bots don't need rep")], flags: MessageFlags.Ephemeral });
      return;
    }

    if (!rep.give(guild, target.id, i.user.id)) {
      await i.reply({ embeds: [brandEmbed(guild, 'warn', `you already repped ${target}`)], flags: MessageFlags.Ephemeral });
      return;
    }

    const total = rep.count(guild, target.id);
    await i.reply({ embeds: [brandEmbed(guild, 'success', `${i.user} gave +rep to ${target} (**${total}** total)`)] });
  },

  async prefix(msg: Message) {
    const guild = msg.guildId!;
    const target = msg.mentions.users.first();

    if (!target) {
      const total = rep.count(guild, msg.author.id);
      await msg.reply({ embeds: [brandEmbed(guild, 'info', `${msg.author} has **${total}** rep`)] });
      return;
    }

    if (target.id === msg.author.id) {
      await msg.reply({ embeds: [brandEmbed(guild, 'error', "can't rep yourself")] });
      return;
    }
    if (target.bot) {
      await msg.reply({ embeds: [brandEmbed(guild, 'error', "bots don't need rep")] });
      return;
    }

    if (!rep.give(guild, target.id, msg.author.id)) {
      await msg.reply({ embeds: [brandEmbed(guild, 'warn', `you already repped ${target}`)] });
      return;
    }

    const total = rep.count(guild, target.id);
    await msg.reply({ embeds: [brandEmbed(guild, 'success', `${msg.author} gave +rep to ${target} (**${total}** total)`)] });
  },
};

export default cmd;
