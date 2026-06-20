import { PluginOrder, type PluginOrderOpt } from './types';

export interface PluginOrderedContribution {
	order?: PluginOrderOpt;
	sequence: number;
}

export interface PluginOrderSequence {
	nextContributionSequence: number;
}

export function nextPluginContributionSequence(sequence: PluginOrderSequence) {
	return sequence.nextContributionSequence++;
}

export function orderedPluginContributions<T extends PluginOrderedContribution>(contributions: readonly T[]): T[] {
	return [...contributions].sort(comparePluginOrder);
}

function comparePluginOrder(left: PluginOrderedContribution, right: PluginOrderedContribution) {
	const leftBand = orderBand(left.order);
	const rightBand = orderBand(right.order);
	if (leftBand !== rightBand) return leftBand - rightBand;

	if (leftBand === 1 && typeof left.order === 'number' && typeof right.order === 'number') {
		const numeric = left.order - right.order;
		if (numeric !== 0) return numeric;
	}

	return left.sequence - right.sequence;
}

function orderBand(order: PluginOrderOpt | undefined) {
	if (order === PluginOrder.Before) return 0;
	if (typeof order === 'number') return 1;
	if (order === PluginOrder.After) return 3;
	return 2;
}
