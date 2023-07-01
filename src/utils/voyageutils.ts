/* All relevant voyage utils have been moved to voyagehelpers.ts. The few things that remain here should find a new place to live! */

import CONFIG from '../components/CONFIG';
import { CrewMember } from '../model/crew';
import { CompactCrew, Player, PlayerCrew, PlayerData } from '../model/player';

/* TODO: move IBuffStat, calculateBuffConfig to crewutils.ts (currently not used by voyage calculator) */
export interface IBuffStat {
	multiplier: number;
	percent_increase: number;
}

export interface BuffStatTable {
	[key: string]: IBuffStat;
}

export function calculateMaxBuffs(playerData: Player): BuffStatTable {
	let result: BuffStatTable = {};

	const parseBuff = (value: string) => {
		let i = value.indexOf(",");
		if (i !== -1) {
			let skill = value.slice(0, i);
			let type =  value.slice(i+1);

			return {
				skill,
				type
			};
		}
		return undefined;
	};

	Object.keys(playerData.character.all_buffs_cap_hash)
		.filter(z => z.includes("skill"))
		.forEach(buff => {
			let p = parseBuff(buff);			
			if (p) result[p.skill] = {} as IBuffStat;
			if (p && p.type === 'percent_increase') {
				result[p.skill].multiplier = 1;
				result[p.skill].percent_increase = playerData.character.all_buffs_cap_hash[buff];
			}
			else if (p && p.type === 'multiplier') {
				result[p.skill].multiplier = playerData.character.all_buffs_cap_hash[buff];
			}
		});

	return result;
}

export function calculateBuffConfig(playerData: Player): BuffStatTable {
	const skills = ['command_skill', 'science_skill', 'security_skill', 'engineering_skill', 'diplomacy_skill', 'medicine_skill'];
	const buffs = ['core', 'range_min', 'range_max'];

	const buffConfig: BuffStatTable = {};

	for (let skill of skills) {
		for (let buff of buffs) {
			buffConfig[`${skill}_${buff}`] = {
				multiplier: 1,
				percent_increase: 0
			};
		}
	}

	for (let buff of playerData.character.crew_collection_buffs.concat(playerData.character.starbase_buffs)) {
		if (buffConfig[buff.stat]) {
			if (buff.operator === 'percent_increase') {
				buffConfig[buff.stat].percent_increase += buff.value;
			} else if (buff.operator === 'multiplier') {
				buffConfig[buff.stat].multiplier = buff.value;
			} else {
				console.warn(`Unknown buff operator '${buff.operator}' for '${buff.stat}'.`);
			}
		}
	}

	return buffConfig;
}

/* TODO: move remapSkills, formatCrewStats to crewpopup.tsx (only used in that component) */
// 	When is remapSkills needed?
const remapSkills = skills =>
	Object.fromEntries(Object.entries(skills)
		.map(([key, value]) =>
			[{core: 'core', min: 'range_min', max: 'range_max'}[key], value]));

export function formatCrewStats(crew: PlayerCrew, use_base:boolean = false): string {
	let result = '';

	for (let skillName in CONFIG.SKILLS) {
		let skill = use_base ? crew.base_skills[skillName] : crew.skills[skillName];

		if (skill && skill.core && (skill.core > 0)) {
			result += `${CONFIG.SKILLS_SHORT.find(c => c.name === skillName)?.short} (${Math.floor(skill.core + (skill.range_min + skill.range_max) / 2)}) `;
		}
	}
	return result;
}