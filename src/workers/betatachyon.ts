import CONFIG from "../components/CONFIG";
import { BaseSkills, ComputedBuff, CrewMember, Skill } from "../model/crew";
import { PlayerCrew, PlayerData } from "../model/player";
import { BuffStatTable } from "../utils/voyageutils";

interface CoreSkill {
    core: number;
    skill: string;
}
interface CrewSkill {
    crew: PlayerCrew | CrewMember;
    skills: CoreSkill[];
}

const amSeats = ["Astrophysicist",
                "Bajoran",
                "Borg",
                "Brutal",
                "Cardassian",
                "Civilian",
                "Communicator",
                "Costumed",
                "Crafty",
                "Cultural Figure",
                "Cyberneticist",
                "Desperate",
                "Diplomat",
                "Duelist",
                "Exobiology",
                "Explorer",
                "Federation",
                "Ferengi",
                "Gambler",
                "Hero",
                "Hologram",
                "Human",
                "Hunter",
                "Innovator",
                "Inspiring",
                "Jury Rigger",
                "Klingon",
                "Marksman",
                "Maverick",
                "Physician",
                "Pilot",
                "Prodigy",
                "Resourceful",
                "Romantic",
                "Romulan",
                "Saboteur",
                "Scoundrel",
                "Starfleet",
                "Survivalist",
                "Tactician",
                "Telepath",
                "Undercover Operative",
                "Veteran",
                "Villain",
                "Vulcan"];

const BetaTachyon = {        

    scanCrew: (playerData: PlayerData, allCrew: CrewMember[], buffs: BuffStatTable, magic: number = 5) => {
        
        return new Promise((resolve, reject) => {

            function applyCrewBuffs(crew: PlayerCrew | CrewMember, buffConfig: BuffStatTable, nowrite?: boolean) {
                const getMultiplier = (skill: string, stat: string) => {
                    return buffConfig[`${skill}_${stat}`].multiplier + buffConfig[`${skill}_${stat}`].percent_increase;
                };
            
                for (let skill in CONFIG.SKILLS) {
                    crew[skill] = { core: 0, min: 0, max: 0 };
                }
                let bs = {} as BaseSkills;
                // Apply buffs
                for (let skill in crew.base_skills) {
                    let core = 0;
                    let min = 0;
                    let max = 0;
            
                    core = Math.round(crew.base_skills[skill].core * getMultiplier(skill, 'core'));
                    min = Math.round(crew.base_skills[skill].range_min * getMultiplier(skill, 'range_min'));
                    max = Math.round(crew.base_skills[skill].range_max * getMultiplier(skill, 'range_max'));
            
                    if (nowrite !== true) {
                        crew[skill] = {
                            core: core,
                            min: min,
                            max: max
                        };	
                    }
                    bs[skill] = {
                        core: core,
                        range_min: min,
                        range_max: max
                    };
                }
                return bs;
            }
            
            function oneCrewCopy<T extends CrewMember>(crew: T): T {
                let result = JSON.parse(JSON.stringify(crew)) as T;
                if (typeof crew.date_added === 'string') {
                    crew.date_added = new Date(crew.date_added);
                }
            
                return result;
            }
            
            
            const skills = ["command_skill", "diplomacy_skill", "science_skill", "engineering_skill", "security_skill", "medicine_skill"];
            const shortskills = ["CMD", "DIP", "SCI", "ENG", "SEC", "MED"];
            const voyskills = ["command", "diplomacy", "science", "engineering", "security", "medicine"];
            const skillPairs = [] as string[][];
            const skillTriplets = [] as string[][];

            for (let s1 of skills) {
                for (let s2 of skills) {
                    if (s2 === s1) continue;
                    skillPairs.push([s1, s2]);
                }
            }            

            for (let s1 of skills) {
                for (let s2 of skills) {
                    for (let s3 of skills) {
                        if (s3 === s2 || s3 === s1 || s2 === s1) continue;
                        skillTriplets.push([s1, s2, s3]);
                    }
                }
            }            

            function getAMSeats(crew: PlayerCrew | CrewMember) {
                return crew.traits_named.filter(tn => amSeats.includes(tn)).length;
            }
            function countSkills(crew: PlayerCrew) {
                let x = 0;
                for (let skill of skills) {
                    if (skill in crew && crew[skill].core) {
                        x++;
                    }
                }
                return x;
            }

            function skillOrder(crew: PlayerCrew) {
                const sk = [] as ComputedBuff[];
                let x = 0;
                for (let skill of skills) {
                    if (skill in crew) {
                        sk.push({ ...crew[skill], skill: voyskills[x] });
                    }
                    x++;
                }
                sk.sort((a, b) => b.core - a.core);
                const output = {
                    crew: crew,
                    skills: [],
                } as CrewSkill;
                if (sk.length > 0 && sk[0].skill) {
                    output.skills.push({ core: sk[0].core, skill: sk[0].skill });
                }
                if (sk.length > 1 && sk[1].skill) {
                    output.skills.push({ core: sk[1].core, skill: sk[1].skill });
                }
                if (sk.length > 2 && sk[2].skill) {
                    output.skills.push({ core: sk[2].core, skill: sk[2].skill });
                }

                return output;
            }

            function makeVoys(crew: PlayerCrew) {
                const ovoys = [] as string[];
                if (!crew.voyScores) return [];
                
                Object.keys(crew.voyScores).forEach((sk) => {
                    if (crew.voyScores && crew.voyScores[sk]) {
                        let b = sk.split("/");
                        let voy = `${b[0].replace("_skill", "")}/${b[1].replace("_skill", "")}`;
                        if (!ovoys.includes(voy)) ovoys.push(voy);
                    }
                });
                return ovoys;
            }

            const findBest = (crew: PlayerCrew[], skills: string[], top: number) => {
                
                if (skills.length === 2) {                
                    const skillcrew = crew.filter(crew => skills[0] in crew && crew[skills[0]].core && skills[1] in crew && crew[skills[1]].core)
                        .sort((a, b) => {
                            return (b[skills[0]].core + b[skills[1]].core) - (a[skills[0]].core + a[skills[1]].core);                                
                        });
                    return skillcrew.slice(0, top);
                }
                else {
                    const skillcrew = crew.filter(crew => skills[0] in crew && crew[skills[0]].core && skills[1] in crew && crew[skills[1]].core && skills[2] in crew && crew[skills[2]].core)
                        .sort((a, b) => {
                            return (b[skills[0]].core + b[skills[1]].core + b[skills[2]].core) - (a[skills[0]].core + a[skills[1]].core + a[skills[2]].core);                                
                        });
                    return skillcrew.slice(0, top);
                }
            };
            
            const acc = {} as { [key: string]: CrewMember };

            const compareCrew = (crewSymbol: string, skills: string[], allCrew: CrewMember[], best: (PlayerCrew | CrewMember)[], buffs: BuffStatTable) => {
            
                if (!(crewSymbol in acc)) {
                    let cfe = allCrew.find(c => c.symbol === crewSymbol);
                    if (!cfe) return -1;
                    acc[crewSymbol] = cfe;    
                }

                let cf = acc[crewSymbol];
            
                if (!cf) return -1;
                
                const crew = oneCrewCopy(cf as PlayerCrew);
                applyCrewBuffs(crew, buffs);
        
                let core = crew[skills[0]].core + crew[skills[1]].core + ((skills.length > 2 && skills[2] in crew) ? crew[skills[2]].core : 0) as number;
                if (skills.length > 2 && (!(skills[2] in crew) || !(crew[skills[2]].core))) {
                    let so = skillOrder(crew);
                    core += so.skills[2].core * 0.75;
                }

                let c = best.length;
                let v = -1;
        
                for (let i = 0; i < c; i++) {
                    let comp = best[i][skills[0]].core + best[i][skills[1]].core + ((skills.length > 2 && skills[2] in best[i]) ? best[i][skills[2]].core : 0) as number;                    
                    if (core > comp) v = i;
                    else if (core < comp) v = i + 1;
                    else v = i;
                }
                
                return v;
            };

            const isImmortal = (c) => {
                return c.level === 100 && c.equipment?.length === 4 && c.rarity === c.max_rarity;    
            }

            if (playerData.citeMode && playerData.citeMode.rarities?.length) {
                playerData = JSON.parse(JSON.stringify(playerData));
                playerData.player.character.crew = playerData.player.character.crew
                .filter((crew) => playerData.citeMode?.rarities?.includes(crew.max_rarity));
            }

            const evalCrew = playerData.player.character.crew.filter((crew) => !isImmortal(crew) && countSkills(crew) === 3);

            const skillbest = {} as { [key: string]: PlayerCrew[] };
            const besttrips = {} as { [key: string]: PlayerCrew[] };
            const skillout = {} as { [key: string]: PlayerCrew[] };

            let immo1 = playerData.player.character.crew.filter(c => isImmortal(c));
            
            const immoCrew = immo1?.length ? immo1 : playerData.player.character.crew;

            skillPairs.forEach((sk) => {
                skillbest[`${sk[0]}/${sk[1]}`] = findBest(immoCrew, sk, magic);
            });

            skillTriplets.forEach((sk) => {
                besttrips[`${sk[0]}/${sk[1]}/${sk[2]}`] = findBest(immoCrew, sk, magic * 2);
            });

            const glitch = {} as { [key: string]: number };

            Object.keys(skillbest).forEach(skill => {                
                const skp = skill.split("/");                                
                skillout[skill] ??= [];
                const triplets = [] as string[];
                Object.keys(besttrips).forEach(trip => {
                    if (trip.includes(skill)) {
                        triplets.push(trip);
                    }
                });

                evalCrew.forEach((crew) => {
                    let c = compareCrew(crew.symbol, skp, allCrew, skillbest[skill], buffs);
                    if (c >= 0 && c < magic) {                        
                        skillout[skill].push(crew);
                        crew.voyScores ??= {};
                        crew.voyScores[skill] ??= 0;
                        crew.voyScores[skill]++;
        
                    }                    
        
                    for (let t of triplets) {
                        let d = compareCrew(crew.symbol, t.split("/"), allCrew, besttrips[t], buffs);
                        if (d >= 0 && d < 1) {
                            crew.voyScores ??= {};
                            let vt = t.split("/").slice(0, 2).reduce((a, b) => a + "/" + b);
                            crew.voyScores[vt] ??= 0;
                            crew.voyScores[vt]++;
                        }
                    }
    
                });

                skillout[skill] = skillout[skill].filter(c => !isImmortal(c));
            });

            const rc1 = Object.values(skillout).reduce((p, c) => p ? p.concat(c) : c);
            const resultCrew = rc1.filter((fc, idx) => rc1.findIndex(g => g.symbol === fc.symbol) === idx);

            for (let crew of resultCrew) {
                let cf = allCrew.find(c => c.symbol === crew.symbol);
                if (!cf) return -1;
                const copycrew = oneCrewCopy(cf as PlayerCrew);
                applyCrewBuffs(copycrew, buffs);
                let so = skillOrder(copycrew);

                crew.voyagesImproved = makeVoys(crew);   
                let evibe = ((so.skills[0].core * 0.35) + (so.skills[1].core * 0.25)) / 2;
                crew.totalEVContribution = evibe;
                crew.evPerCitation = evibe / crew.max_rarity;
                crew.totalEVRemaining = crew.evPerCitation * (crew.max_rarity - crew.rarity);
                crew.amTraits = getAMSeats(crew);
            }
            const maxvoy = resultCrew.map(c => c.voyagesImproved?.length ?? 0).reduce((a, b) => a > b ? a : b);
            const maxev = resultCrew.map(c => c.totalEVContribution ?? 0).reduce((a, b) => a > b ? a : b);
            const minremain = resultCrew.map(c => c.totalEVRemaining ?? 0).reduce((a, b) => a < b ? a : b);
            const maxam = resultCrew.map(c => c.amTraits ?? 0).reduce((a, b) => a > b ? a : b);
            
            resultCrew.sort((a, b) => {
                let r = 0; // (b.amTraits ?? 0) - (a.amTraits ?? 0);

                let anum = (a.voyagesImproved?.length ?? 0) / maxvoy;
                let bnum = (a.totalEVContribution ?? 0) / maxev;
                let cnum = (a.totalEVRemaining ?? 0) / minremain;
                let dnum = (a.amTraits ?? 0) / maxam;

                let fanum = (100 * (anum + bnum + cnum + dnum)) / 4;

                anum = (b.voyagesImproved?.length ?? 0) / maxvoy;
                bnum = (b.totalEVContribution ?? 0) / maxev;
                cnum = (b.totalEVRemaining ?? 0) / minremain;
                dnum = (b.amTraits ?? 0) / maxam;

                let fbnum = (100 * (anum + bnum + cnum + dnum)) / 4;

                r = fbnum - fanum;

                return r;
            });

            resolve({
                crewToCite: resultCrew.filter(f => f.rarity !== f.max_rarity),
                crewToTrain: resultCrew.filter(f => f.rarity === f.max_rarity || ((f.rarity > f.max_rarity / 2 && f.level < 60)))
            });
        });
    },
    
}

export default BetaTachyon;