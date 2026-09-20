import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
	Message,
	SlashCommandBuilder
} from 'discord.js';
import type { Command } from '../../types';
import { getBrand } from '../../data/brand';

interface Card {
	suit: string;
	rank: string;
	value: number;
	emoji: string;
}

interface GameState {
	deck: Card[];
	playerHand: Card[];
	dealerHand: Card[];
	bet: number;
	doubled: boolean;
	split: boolean;
	guildId: string;
}

const CARD_EMOJIS: { [key: string]: { [key: string]: string } } = {
	'Spades': {
		'A': '🂡', '2': '🂢', '3': '🂣', '4': '🂤', '5': '🂥',
		'6': '🂦', '7': '🂧', '8': '🂨', '9': '🂩', '10': '🂪',
		'J': '🂫', 'Q': '🂭', 'K': '🂮'
	},
	'Hearts': {
		'A': '🂱', '2': '🂲', '3': '🂳', '4': '🂴', '5': '🂵',
		'6': '🂶', '7': '🂷', '8': '🂸', '9': '🂹', '10': '🂺',
		'J': '🂻', 'Q': '🂽', 'K': '🂾'
	},
	'Diamonds': {
		'A': '🃁', '2': '🃂', '3': '🃃', '4': '🃄', '5': '🃅',
		'6': '🃆', '7': '🃇', '8': '🃈', '9': '🃉', '10': '🃊',
		'J': '🃋', 'Q': '🃍', 'K': '🃎'
	},
	'Clubs': {
		'A': '🃑', '2': '🃒', '3': '🃓', '4': '🃔', '5': '🃕',
		'6': '🃖', '7': '🃗', '8': '🃘', '9': '🃙', '10': '🃚',
		'J': '🃛', 'Q': '🃝', 'K': '🃞'
	}
};

const HELP_TEXT = `**How to Play Blackjack:**

**Objective:** Get closer to 21 than the dealer without going over.

**Card Values:**
• Number cards (2-10): Face value
• Face cards (J, Q, K): Worth 10
• Aces: Worth 1 or 11 (automatically optimized)

**Actions:**
• **Hit**: Draw another card
• **Stand**: Keep your current hand
• **Double Down**: Double your bet and draw exactly one more card

**Dealer Rules:**
• Dealer must hit on 16 or less
• Dealer must stand on 17 or more

**Payouts:**
• Blackjack (21 with 2 cards): 1.5x bet
• Regular win: 1x bet
• Push (tie): Bet returned
• Loss: Bet lost

Good luck! 🎰`;

function createDeck(): Card[] {
	const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
	const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
	const deck: Card[] = [];

	for (const suit of suits) {
		for (const rank of ranks) {
			let value = parseInt(rank);
			if (isNaN(value)) {
				value = rank === 'A' ? 11 : 10;
			}
			deck.push({ 
				suit, 
				rank, 
				value,
				emoji: CARD_EMOJIS[suit][rank]
			});
		}
	}

	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}

	return deck;
}

async function startGame(msg: ChatInputCommandInteraction, playerTag: string, bet: number, guildId: string): Promise<Message | void> {
	if (bet < 1) {
		return void await msg.reply({
			content: 'Bet must be at least 1.',
			ephemeral: true
		});
	}

	const deck = createDeck();
	const playerHand = [deck.pop()!, deck.pop()!];
	const dealerHand = [deck.pop()!, deck.pop()!];

	const state: GameState = {
		deck,
		playerHand,
		dealerHand,
		bet,
		doubled: false,
		split: false,
		guildId
	};

	return await updateGame(msg, playerTag, state);
}

function calculateScore(hand: Card[]): number {
	let score = hand.reduce((sum, card) => sum + card.value, 0);
	let aces = hand.filter(card => card.rank === 'A').length;

	while (score > 21 && aces > 0) {
		score -= 10;
		aces--;
	}

	return score;
}

function isSoft(hand: Card[]): boolean {
	const score = hand.reduce((sum, card) => sum + card.value, 0);
	const hasAce = hand.some(card => card.rank === 'A');
	return hasAce && score <= 21 && calculateScore(hand) !== score;
}

function isBlackjack(hand: Card[]): boolean {
	return hand.length === 2 && calculateScore(hand) === 21;
}

function handToString(hand: Card[], hideFirst = false): string {
	return hand.map((card, i) => {
		if (i === 0 && hideFirst) return '🂠';
		return card.emoji;
	}).join(' ');
}

async function updateGame(
	msg: ChatInputCommandInteraction,
	playerTag: string,
	state: GameState,
	result?: 'win' | 'lose' | 'push' | 'blackjack'
): Promise<Message> {
	const playerScore = calculateScore(state.playerHand);
	const dealerScore = calculateScore(state.dealerHand);
	const brand = await getBrand(state.guildId);

	let title = '🎰 Blackjack';
	let color = 0x3498db;
	let description = '';

	if (result) {
		const hideDealer = false;
		let payout = 0;

		if (result === 'blackjack') {
			title = '🎉 Blackjack!';
			color = 0x2ecc71;
			payout = Math.floor(state.bet * 1.5);
			description = `**You hit Blackjack!**\nYou won **${payout}** coins! 🎊`;
		} else if (result === 'win') {
			title = '✅ You Win!';
			color = 0x2ecc71;
			payout = state.bet;
			description = `You beat the dealer!\nYou won **${payout}** coins!`;
		} else if (result === 'lose') {
			title = '❌ You Lose';
			color = 0xe74c3c;
			description = `The dealer wins.\nYou lost **${state.bet}** coins.`;
		} else if (result === 'push') {
			title = '🤝 Push';
			color = 0x95a5a6;
			description = `It's a tie!\nYour bet of **${state.bet}** coins has been returned.`;
		}

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setColor(color)
			.setDescription(description)
			.addFields(
				{
					name: `${playerTag}'s Hand (${playerScore})${isSoft(state.playerHand) ? ' - Soft' : ''}`,
					value: handToString(state.playerHand),
					inline: true
				},
				{
					name: `Dealer's Hand (${dealerScore})${isSoft(state.dealerHand) ? ' - Soft' : ''}`,
					value: handToString(state.dealerHand, hideDealer),
					inline: true
				}
			)
			.setFooter({ text: brand })
			.setTimestamp();

		return await msg.editReply({ embeds: [embed], components: [] });
	}

	const canDoubleDown = state.playerHand.length === 2 && !state.doubled;
	
	const visibleDealerScore = state.dealerHand.slice(1).reduce((sum, card) => sum + card.value, 0);

	const embed = new EmbedBuilder()
		.setTitle(title)
		.setColor(color)
		.addFields(
			{
				name: `${playerTag}'s Hand (${playerScore})${isSoft(state.playerHand) ? ' - Soft' : ''}`,
				value: handToString(state.playerHand),
				inline: true
			},
			{
				name: `Dealer's Hand (${visibleDealerScore})`,
				value: handToString(state.dealerHand, true),
				inline: true
			}
		)
		.setFooter({ text: `${brand} • Bet: ${state.bet} coins` })
		.setTimestamp();

	const hitButton = new ButtonBuilder()
		.setCustomId('bj_hit')
		.setLabel('Hit')
		.setStyle(ButtonStyle.Primary);

	const standButton = new ButtonBuilder()
		.setCustomId('bj_stand')
		.setLabel('Stand')
		.setStyle(ButtonStyle.Success);

	const doubleButton = new ButtonBuilder()
		.setCustomId('bj_double')
		.setLabel('Double Down')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(!canDoubleDown);

	const helpButton = new ButtonBuilder()
		.setCustomId('bj_help')
		.setLabel('Help')
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		hitButton,
		standButton,
		doubleButton,
		helpButton
	);

	const response = await msg.editReply({
		embeds: [embed],
		components: [row]
	});

	const collector = response.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 60_000,
		filter: (i) => i.user.id === msg.user.id
	});

	collector.on('collect', async (i) => {
		if (i.customId === 'bj_hit') {
			await onHit(i, msg, playerTag, state);
		} else if (i.customId === 'bj_stand') {
			await onStand(i, msg, playerTag, state);
		} else if (i.customId === 'bj_double') {
			await onDouble(i, msg, playerTag, state);
		} else if (i.customId === 'bj_help') {
			await onHelp(i);
		}
		collector.stop();
	});

	collector.on('end', async (collected) => {
		if (collected.size === 0) {
			await msg.editReply({ components: [] });
		}
	});

	return response;
}

async function onHit(
	i: any,
	msg: ChatInputCommandInteraction,
	playerTag: string,
	state: GameState
) {
	await i.deferUpdate();
	state.playerHand.push(state.deck.pop()!);
	const playerScore = calculateScore(state.playerHand);

	if (playerScore > 21) {
		await updateGame(msg, playerTag, state, 'lose');
	} else if (playerScore === 21) {
		await onStand(i, msg, playerTag, state);
	} else {
		await updateGame(msg, playerTag, state);
	}
}

async function onStand(
	i: any,
	msg: ChatInputCommandInteraction,
	playerTag: string,
	state: GameState
) {
	await i.deferUpdate();
	
	while (calculateScore(state.dealerHand) < 17) {
		state.dealerHand.push(state.deck.pop()!);
	}

	const playerScore = calculateScore(state.playerHand);
	const dealerScore = calculateScore(state.dealerHand);

	let result: 'win' | 'lose' | 'push' | 'blackjack';

	if (isBlackjack(state.playerHand) && !isBlackjack(state.dealerHand)) {
		result = 'blackjack';
	} else if (dealerScore > 21) {
		result = 'win';
	} else if (playerScore > dealerScore) {
		result = 'win';
	} else if (playerScore < dealerScore) {
		result = 'lose';
	} else {
		result = 'push';
	}

	await updateGame(msg, playerTag, state, result);
}

async function onDouble(
	i: any,
	msg: ChatInputCommandInteraction,
	playerTag: string,
	state: GameState
) {
	await i.deferUpdate();
	
	state.bet *= 2;
	state.doubled = true;
	state.playerHand.push(state.deck.pop()!);
	
	const playerScore = calculateScore(state.playerHand);
	
	if (playerScore > 21) {
		await updateGame(msg, playerTag, state, 'lose');
	} else {
		await onStand(i, msg, playerTag, state);
	}
}

async function onHelp(i: any) {
	const helpEmbed = new EmbedBuilder()
		.setTitle('🎰 Blackjack Rules')
		.setDescription(HELP_TEXT)
		.setColor(0x3498db);

	await i.reply({
		embeds: [helpEmbed],
		ephemeral: true
	});
}

const cmd: Command = {
	name: 'blackjack',
	aliases: ['bj'],
	description: 'Play a game of blackjack',
	cooldown: 0,
	permissions: [],
	staffOnly: false,
	slash: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription('Play a game of blackjack')
		.addIntegerOption(o => o
			.setName('bet')
			.setDescription('Amount to bet')
			.setRequired(false)
			.setMinValue(1)
		),

	async run(msg: ChatInputCommandInteraction) {
		const bet = msg.options.getInteger('bet') ?? 10;
		const playerTag = msg.user.tag;
		const guildId = msg.guildId!;

		await msg.deferReply();
		await startGame(msg, playerTag, bet, guildId);
	},

	async prefix() {
	}
};

export default cmd;
