import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  GuildMember,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
} from 'discord.js';
import { Command } from '../../types';
import { COLORS, BRAND } from '../../config';
import { asset } from '../../services/embeds';
import { getBrand } from '../../data/brand';

const REVEAL_DELAY = 4000;

function dmEmbed(action: string, guild: string, reason: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const imageName = action === 'banned' ? 'banned.png' : 'kicked.png';
  const file = asset(imageName);
  const embed = new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`you have been ${action}`)
    .setDescription(`you were ${action} from **${guild}**\n\n**reason:** ${reason}`)
    .setImage(`attachment://${imageName}`)
    .setFooter({ text: BRAND })
    .setTimestamp();
  return { embed, file };
}

function fakeEmbed(guildId: string, action: string, tag: string, reason: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const imageName = action === 'banned' ? 'banned.png' : 'kicked.png';
  const file = asset(imageName);
  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`${action} **${tag}** - ${reason}`)
    .setImage(`attachment://${imageName}`)
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

function psych(guildId: string, tag: string): { embed: EmbedBuilder; file: AttachmentBuilder } {
  const file = asset('it was a joke.png');
  const embed = new EmbedBuilder()
    .setColor(COLORS.warn)
    .setDescription(`**${tag}** wasn't actually banned or kicked lmao`)
    .setImage('attachment://it was a joke.png')
    .setFooter({ text: getBrand(guildId) })
    .setTimestamp();
  return { embed, file };
}

async function fakeMod(
  target: GuildMember,
  guildId: string,
  action: string,
  reason: string,
  reply: (embed: EmbedBuilder, file: AttachmentBuilder) => Promise<{ edit: (opts: object) => Promise<unknown> }>,
): Promise<void> {
  const guild = target.guild.name;
  const tag = target.user.tag;

  const dmInitial = dmEmbed(action, guild, reason);
  await target.send({ embeds: [dmInitial.embed], files: [dmInitial.file] }).catch(() => {});

  const fakeMsg = fakeEmbed(guildId, action, tag, reason);
  const sent = await reply(fakeMsg.embed, fakeMsg.file);

  setTimeout(async () => {
    const psychMsg = psych(guildId, tag);
    await sent.edit({ embeds: [psychMsg.embed], files: [psychMsg.file] }).catch(() => {});
    
    const dmJoke = asset('it was a joke.png');
    await target.send({ 
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.warn)
          .setDescription(`jk you weren't actually ${action} from **${guild}** 💀`)
          .setImage('attachment://it was a joke.png')
          .setFooter({ text: getBrand(guildId) }),
      ],
      files: [dmJoke]
    }).catch(() => {});
  }, REVEAL_DELAY);
}

const fakekick: Command = {
  name: 'fakekick',
  aliases: ['fk', 'bick'],
  description: 'fake kick someone',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('fakekick')
    .setDescription('fake kick someone')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why')),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const reason = i.options.getString('reason') ?? 'no reason';
    if (!target) return void await i.reply({ content: 'user not found', flags: MessageFlags.Ephemeral });

    await fakeMod(target, i.guildId!, 'kicked', reason, async (embed, file) => {
      await i.reply({ embeds: [embed], files: [file] });
      return { edit: (opts: object) => i.editReply(opts) };
    });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply('mention someone');
    const reason = args.slice(1).join(' ') || 'no reason';

    await fakeMod(target, msg.guildId!, 'kicked', reason, async (embed, file) => {
      const sent = await msg.reply({ embeds: [embed], files: [file] });
      return { edit: (opts: object) => sent.edit(opts) };
    });
  },
};

const fakeban: Command = {
  name: 'fakeban',
  aliases: ['fb', 'bean'],
  description: 'fake ban someone',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('fakeban')
    .setDescription('fake ban someone')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why')),

  async run(i: ChatInputCommandInteraction) {
    const target = i.options.getMember('user') as GuildMember | null;
    const reason = i.options.getString('reason') ?? 'no reason';
    if (!target) return void await i.reply({ content: 'user not found', flags: MessageFlags.Ephemeral });

    await fakeMod(target, i.guildId!, 'banned', reason, async (embed, file) => {
      await i.reply({ embeds: [embed], files: [file] });
      return { edit: (opts: object) => i.editReply(opts) };
    });
  },

  async prefix(msg: Message, args: string[]) {
    const target = msg.mentions.members?.first();
    if (!target) return void await msg.reply('mention someone');
    const reason = args.slice(1).join(' ') || 'no reason';

    await fakeMod(target, msg.guildId!, 'banned', reason, async (embed, file) => {
      const sent = await msg.reply({ embeds: [embed], files: [file] });
      return { edit: (opts: object) => sent.edit(opts) };
    });
  },
};

const bick: Command = {
  name: 'bick',
  aliases: [],
  description: 'fake kick someone',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('bick')
    .setDescription('fake kick someone')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why')),
  run: fakekick.run,
  prefix: fakekick.prefix,
};

const bean: Command = {
  name: 'bean',
  aliases: [],
  description: 'fake ban someone',
  cooldown: 0,
  permissions: [],
  staffOnly: true,
  slash: new SlashCommandBuilder()
    .setName('bean')
    .setDescription('fake ban someone')
    .addUserOption(o => o.setName('user').setDescription('who').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('why')),
  run: fakeban.run,
  prefix: fakeban.prefix,
};

export { fakekick, fakeban, bick, bean };
