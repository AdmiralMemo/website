import React from 'react';
import { Header, Icon, Button, Popup, Modal, Grid, Label, SemanticWIDTHS } from 'semantic-ui-react';

import { ListedTraits } from './listedtraits';
import { getStyleByRarity } from './fbbutils';

import ItemDisplay from '../itemdisplay';

import allTraits from '../../../static/structured/translation_en.json';
import { BossCrew, Optimizer, RarityStyle, Solver, SolverNode, SolverTrait } from '../../model/boss';
import { MergedContext } from '../../context/mergedcontext';
import { FinderContext } from './findercontext';
import { ShipSkill, getActionColor, getActionIcon, getShipBonusIcon } from '../item_presenters/shipskill';
import { getShipBonus } from '../../utils/crewutils';
import CONFIG from '../CONFIG';

type MarkGroupProps = {
	node: SolverNode;
	traits: string[];
	solver: Solver;
	optimizer: Optimizer;
	solveNode: (nodeIndex: number, traits: string[]) => void;
};

export const MarkGroup = (props: MarkGroupProps) => {
	const { node, traits } = props;

	const [modalIsOpen, setModalIsOpen] = React.useState(false);
	const [firstTrait, setFirstTrait] = React.useState('');

	React.useEffect(() => {
		if (!modalIsOpen) setFirstTrait('');
	}, [modalIsOpen]);

	const nodeRarities = props.optimizer.rarities[`node-${node.index}`];
	const comboRarity = nodeRarities.combos;
	const traitRarity = nodeRarities.traits;

	const GroupSolvePicker = () => {
		const solveOptions = comboRarity.filter(rarity => rarity.combo.includes(firstTrait) && rarity.crew.length > 0)
			.sort((a, b) => b.crew.length - a.crew.length)
			.map((rarity, idx) => {
				return {
					key: idx,
					value: rarity.combo,
					rarity: rarity.crew.length
				};
		});

		return (
			<Modal
				open={true}
				onClose={() => setModalIsOpen(false)}
				size='tiny'
			>
				<Modal.Header>
					Confirm the traits used to solve Node {node.index+1}
				</Modal.Header>
				<Modal.Content scrolling style={{ textAlign: 'center' }}>
					<Header as='h4'>
						{node.traitsKnown.map((trait, traitIndex) => (
							<span key={traitIndex}>
								{traitIndex > 0 ? ' + ': ''}{allTraits.trait_names[trait]}
							</span>
						)).reduce((prev, curr) => <>{prev} {curr}</>, <></>)}
					</Header>
					{solveOptions.map(option => (
						<div key={option.key} style={{ marginBottom: '.5em' }}>
							<SolveButton node={node}
								traits={option.value ?? []} rarity={option.rarity} onehand={true}
								traitData={props.solver.traits} solveNode={handleSolveClick}
							/>
						</div>
					)).reduce((prev, curr) => <>{prev} {curr}</>, <></>)}
					<div style={{ marginTop: '2em' }}>
						<Header as='h4'>Partial Solve</Header>
						<SolveButton node={node}
							traits={[firstTrait, '?']} rarity={traitRarity[firstTrait]} onehand={false}
							traitData={props.solver.traits} solveNode={handleSolveClick}
						/>
					</div>
				</Modal.Content>
				<Modal.Actions>
					<ColorsLegendPopup />
					<Button onClick={() => setModalIsOpen(false)}>
						Close
					</Button>
				</Modal.Actions>
			</Modal>
		);

		function handleSolveClick(nodeIndex: number, traits: string[]): void {
			props.solveNode(node.index, getUpdatedSolve(node, traits));
			setModalIsOpen(false);
		}
	};

	return (
		<React.Fragment>
			{(traits.sort((a, b) => allTraits.trait_names[a].localeCompare(allTraits.trait_names[b])).map(trait => (
				<SolveButton key={trait} node={node}
					traits={[trait]} rarity={traitRarity[trait]} onehand={false}
					traitData={props.solver.traits} solveNode={handleSingleTrait}
					compact={true}
				/>
			)) as JSX.Element[]).reduce((prev, curr) => <>{prev} {curr}</>, <></>)}
			{modalIsOpen && <GroupSolvePicker />}
		</React.Fragment>
	);

	function handleSingleTrait(nodeIndex: number, traits: string[]): void {
		const trait = traits[0];

		// Always auto-solve when only 1 trait required
		if (node.hiddenLeft === 1) {
			props.solveNode(node.index, getUpdatedSolve(node, [trait]));
			return;
		}

		// Otherwise show confirmation dialog
		setFirstTrait(trait);
		setModalIsOpen(true);
	}
};

type MarkCrewProps = {
	crew: BossCrew;
	trigger: string;
	solver: Solver;
	optimizer: Optimizer;
	solveNode: (nodeIndex: number, traits: string[]) => void;
	markAsTried: (crewSymbol: string) => void;
};

export const MarkCrew = (props: MarkCrewProps) => {
	const { crew, trigger } = props;

	const [showPicker, setShowPicker] = React.useState(false);
	const context = React.useContext(MergedContext);
	const groupsContext = React.useContext(FinderContext);

	return (
		<React.Fragment>
			{trigger === 'card' && renderCard()}
			{trigger === 'trial' && renderTrialButtons()}
			{showPicker &&
				<SolvePicker crew={crew} solver={props.solver} optimizer={props.optimizer}
					solveNode={props.solveNode} markAsTried={props.markAsTried} setModalIsOpen={setShowPicker}
				/>
			}
		</React.Fragment>
	);

	function renderCard(): JSX.Element {
		const imageUrlPortrait = crew.imageUrlPortrait ?? `${crew.portrait.file.substring(1).replace(/\//g, '_')}.png`;

		return (
			<Grid.Column key={crew.symbol} textAlign='center'>
				<span style={{ display: 'inline-block', cursor: 'pointer' }} onClick={() => setShowPicker(true)}>
					<ItemDisplay
						src={`${process.env.GATSBY_ASSETS_URL}${imageUrlPortrait}`}
						size={60}
						maxRarity={crew.max_rarity}
						rarity={crew.highest_owned_rarity ?? 0}
					/>
				</span>
				<div>
					<span style={{ cursor: 'pointer' }} onClick={() => setShowPicker(true)}>
						{crew.only_frozen && <Icon name='snowflake' />}
						<span style={{ fontStyle: crew.nodes_rarity > 1 ? 'italic' : 'normal' }}>
							{crew.name}<br />
							{props.optimizer.filtered.settings.shipAbility === 'show' &&
							<div style={{display:"flex",flexDirection:"column",justifyContent:"center", alignItems: "center"}}>
								<div style={{display:"flex", flexDirection: "row", color: getActionColor(crew.action.bonus_type)}}>								
									<span>+ {crew.action.bonus_amount}</span>								
								</div>

								{crew.action.ability && <div style={{ lineHeight: "1.3em"}}> 
									{getShipBonus(crew.action)}
								</div>}
								{!!crew.action.ability?.condition && <i style={{fontSize:"0.8em"}}>({
                                                    CONFIG.CREW_SHIP_BATTLE_TRIGGER[
                                                        crew.action.ability.condition
                                                    ]
                                                })</i>}

								{!!crew.action.charge_phases?.length && <i style={{fontSize:"0.8em"}}>(+{crew.action.charge_phases.length} charge phases)</i>}
							</div>}
						</span>
					</span>
				</div>
			</Grid.Column>
		);
	}

	function renderTrialButtons(): JSX.Element {
		return (
			<Button.Group>
				<Popup
					content={`${crew.name} solved a node!`}
					mouseEnterDelay={500}
					hideOnScroll
					trigger={
						<Button icon compact onClick={() => trySolve()}>
							<Icon name='check' color='green' />
						</Button>
					}
				/>
				<Popup
					content={`Mark as tried`}
					mouseEnterDelay={500}
					hideOnScroll
					trigger={
						<Button icon compact onClick={() => props.markAsTried(crew.symbol)}>
							<Icon name='x' color='red' />
						</Button>
					}
				/>
			</Button.Group>
		);
	}

	function trySolve(): void {
		// Always auto-solve when only 1 solution possible
		if (!crew.node_matches) return;
		if (Object.values(crew.node_matches).length === 1) {
			const match = Object.values(crew.node_matches)[0];
			const node = props.solver.nodes.find(n => n.index === match.index);
			if (node) {
				if (match.traits.length === node.hiddenLeft) {
					props.solveNode(node.index, getUpdatedSolve(node, match.traits));
					return;
				}
			}
		}
		setShowPicker(true);
	}
};

type SolvePickerProps = {
	crew: BossCrew;
	solver: Solver;
	optimizer: Optimizer;
	solveNode: (nodeIndex: number, traits: string[]) => void;
	markAsTried: (crewSymbol: string) => void;
	setModalIsOpen: (modalIsOpen: boolean) => void;
};

const SolvePicker = (props: SolvePickerProps) => {
	const { crew, setModalIsOpen } = props;

	const nodeMatches = Object.values(crew.node_matches);

	return (
		<Modal
			open={true}
			onClose={() => setModalIsOpen(false)}
			size={nodeMatches.length === 1 ? 'tiny' : 'small'}
		>
			<Modal.Header>
				Identify the traits solved by {crew.name}
			</Modal.Header>
			<Modal.Content scrolling>
				{renderOptions()}
			</Modal.Content>
			<Modal.Actions>
				<ColorsLegendPopup />
				<Button icon='x' color='red' content='Mark as tried' onClick={() => handleTriedClick()} />
				<Button onClick={() => setModalIsOpen(false)}>
					Close
				</Button>
			</Modal.Actions>
		</Modal>
	);

	function renderOptions(): JSX.Element {
		let traitId = 0;
		const nodes = nodeMatches.map(node => {
			const open = props.solver.nodes.find(n => n.index === node.index);

			const comboRarities = props.optimizer.rarities[`node-${node.index}`].combos;
			const solveOptions = node.combos.map((combo, idx) => {
				const rarity = comboRarities.find(rarity => rarity.combo.every(trait => combo.includes(trait)));
				return {
					key: idx,
					value: combo,
					rarity: rarity ? rarity.crew.length : 0
				};
			}).sort((a, b) => b.rarity - a.rarity);

			return {
				...open,
				possible: node.traits.map(trait => { return { id: traitId++, trait: trait }; }),
				solveOptions
			};
		}) as SolverNode[];

		return (
			<Grid doubling columns={nodes.length as SemanticWIDTHS} textAlign='center'>
				{nodes.map(node => {
					return (
						<Grid.Column key={node.index}>
							<Header as='h4' style={{ marginBottom: '0' }}>
								{node.traitsKnown.map((trait, traitIndex) => (
									<span key={traitIndex}>
										{traitIndex > 0 ? ' + ': ''}{allTraits.trait_names[trait]}
									</span>
								)).reduce((prev, curr) => <>{prev} {curr}</>, <></>)}
							</Header>
							<p>Node {node.index+1}</p>
							{node.solveOptions?.map(option => (
								<div key={option.key} style={{ marginBottom: '.5em' }}>
									<SolveButton node={node}
										traits={option.value ?? []} rarity={option.rarity} onehand={true}
										traitData={props.solver.traits} solveNode={handleSolveClick}
									/>
								</div>
							)).reduce((prev, curr) => <>{prev} {curr}</>, <></>)}
						</Grid.Column>
					);
				})}
			</Grid>
		);
	}

	function handleTriedClick(): void {
		props.markAsTried(crew.symbol);
		setModalIsOpen(false);
	}

	function handleSolveClick(nodeIndex: number, traits: string[]): void {
		const node = props.solver.nodes.find(n => n.index === nodeIndex);
		if (!node) return;
		props.solveNode(node.index, getUpdatedSolve(node, traits));
		setModalIsOpen(false);
	}
};

type SolveButtonProps = {
	node: SolverNode;
	traits: string[];
	rarity: number;
	onehand: boolean;
	traitData: SolverTrait[];
	compact?: boolean;
	solveNode: (nodeIndex: number, traits: string[]) => void;
};

const SolveButton = (props: SolveButtonProps) => {
	const { node, traits, rarity, onehand, traitData, compact } = props;

	return (
		<Button compact={compact} style={getTraitsStyle(rarity)} onClick={() => props.solveNode(node.index, traits)}>
			<div style={{
				display: 'flex',
				flexDirection: 'row',
				flexWrap: 'nowrap',
				gap: '.5em'
			}}>
				{onehand && rarity > 5 && <Icon name='hand paper' />}
				<ListedTraits traits={traits} traitData={traitData} />
			</div>
		</Button>
	);

	function getTraitsStyle(rarity: number): RarityStyle {
		// Traits include alpha rule exception
		if (traits.filter(trait => trait !== '?' && trait.localeCompare(node.alphaTest, 'en') === -1).length > 0) {
			return {
				background: '#f2711c',
				color: 'white'
			};
		}
		return getStyleByRarity(rarity);
	}
};

const getUpdatedSolve = (node: SolverNode, traits: string[]) => {
	// Replace first remaining ? on partial solves
	if (node.solve.length > 1 && traits.length === 1) {
		const solve = node.solve.map(hiddenTrait => {
			if (hiddenTrait === '?') return traits[0];
			return hiddenTrait;
		});
		return solve;
	}
	return traits;
};

const ColorsLegendPopup = () => {
	return (
		<Popup
			content={renderContent()}
			trigger={
				<span>
					Colors
					<Icon name='question' />
				</span>
			}
		/>
	);

	function renderContent(): JSX.Element {
		return (
			<React.Fragment>
				<p>Colors help visualize the rarity of each possible solution for this node:</p>
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center'
				}}>
					{[6, 5, 4, 3, 2].map(rarity => renderLabel(rarity))}
				</div>
			</React.Fragment>
		);
	}

	function renderLabel(rarity: number): JSX.Element {
		const rarityStyle = getStyleByRarity(rarity);
		const rarityNumber = rarity > 5 ? '6+' : rarity;
		return (
			<Label key={rarity} style={{...rarityStyle, marginBottom: '.5em', textAlign: 'center'}}>
				{rarityNumber} in-portal crew share this solution.
			</Label>
		);
	}
};

