import CONFIG from '../components/CONFIG';
import { EquipmentCommon, EquipmentItem, EquipmentItemSource } from '../model/equipment';
import { Mission } from '../model/missions';
import { PlayerEquipmentItem } from '../model/player';
import { simplejson2csv, ExportField } from './misc';

export function mergeItems(player_items: PlayerEquipmentItem[], items: EquipmentItem[]) {
	let data = [] as EquipmentCommon[];
	player_items.forEach(item => {
		let itemEntry = items.find(i => i.symbol === item.symbol);
		if (itemEntry) {
			data.push({
				... itemEntry,
				name: itemEntry.name,
				type: itemEntry.type,
				rarity: itemEntry.rarity,
				flavor: itemEntry.flavor,
				bonuses: itemEntry.bonuses,
				imageUrl: itemEntry.imageUrl,
				symbol: item.symbol,
				quantity: item.quantity
			});
		} else {
			data.push({
				...item,
				name: item.name ?? "",
				type: item.type ?? 0,
				rarity: item.rarity,
				flavor: item.flavor ?? "",
				bonuses: undefined,
				imageUrl: item.imageUrl ?? "",
				symbol: item.symbol,
				quantity: item.quantity
			});
		}
	});
	return data;
}

export function exportItemFields(): ExportField[] {
	return [
		{
			label: 'Name',
			value: (row: EquipmentItem) => row.name
		},
		{
			label: 'Rarity',
			value: (row: EquipmentItem) => row.rarity
		},
		{
			label: 'Quantity',
			value: (row: EquipmentItem) => row.quantity
		},
		{
			label: 'Type',
			value: (row: EquipmentItem) => row.type
		},
		{
			label: 'Flavor',
			value: (row: EquipmentItem) => row.flavor
		},
		{
			label: 'Symbol',
			value: (row: EquipmentItem) => row.symbol
		},
		{
			label: 'Bonuses',
			value: (row: EquipmentItem) => (row.bonuses ? JSON.stringify(row.bonuses) : '')
		},
		{
			label: 'Image',
			value: (row: EquipmentItem) => row.imageUrl
		}
	];
}

export function exportItems(items: EquipmentCommon[]): string {
	return simplejson2csv(items, exportItemFields());
}

// Alternative, simplified export, below.
// Inspired by Bernard

export function exportItemFieldsAlt(): ExportField[] {
	return [
		{
			label: 'Name',
			value: (row: EquipmentItem) => row.name
		},
		{
			label: 'Quantity',
			value: (row: EquipmentItem) => row.quantity ?? ""
		},
		{
			label: 'Needed',
			value: (row: EquipmentItem) => row.needed ?? ""
		},
		{
			label: 'Type',
			value: (row: EquipmentItem) => CONFIG.REWARDS_ITEM_TYPE[row.type]
		},
		{
			label: 'Rarity',
			value: (row: EquipmentItem) => CONFIG.RARITIES[row.rarity].name
		},
		{
			label: 'Faction Only',
			value: (row: EquipmentItem) => row.factionOnly === undefined ? '' : (row.factionOnly ? 'Yes' : 'No')
		}
	];
}

export function exportItemsAlt(items: EquipmentCommon[]): string {
	return simplejson2csv(items, exportItemFieldsAlt());
}

export function populateItemCadetSources(items: EquipmentItem[], episodes: Mission[]) {
	for(const item of items) {					
		for (let ep of episodes) {
			let quests = ep.quests.filter(q => q.quest_type === 'ConflictQuest' && q.mastery_levels?.some(ml => ml.rewards?.some(r => r.potential_rewards?.some(px => px.symbol === item.symbol))));
			if (quests?.length) {
				for (let quest of quests) {
					if (quest.mastery_levels?.length) {
						let x = 0;
						for (let ml of quest.mastery_levels) {
							if (ml.rewards?.some(r => r.potential_rewards?.some(pr => pr.symbol === item.symbol))) {
								let mx = ml.rewards.map(r => r.potential_rewards?.length).reduce((prev, curr) => Math.max(prev ?? 0, curr ?? 0)) ?? 0;
								mx = (1/mx) * 1.80;
								let qitem = {
									type: 4,
									mastery: x,											
									name: quest.name,
									energy_quotient: 1,
									chance_grade: 5 * mx,						
									mission_symbol: quest.symbol,
									cost: 1,
									avg_cost: 1/mx,
									cadet_mission: ep.episode_title,
									cadet_symbol: ep.symbol
								} as EquipmentItemSource;
								if (!item.item_sources.find(f => f.mission_symbol === quest.symbol)) {
									item.item_sources.push(qitem);
								}									
							}
							x++;
						}
					}
				}
			}					
		}
	}
}



