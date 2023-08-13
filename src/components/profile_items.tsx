import React, { Component } from 'react';
import { Table, Icon, Pagination, Dropdown, Input, Checkbox } from 'semantic-ui-react';
import { Link, navigate } from 'gatsby';

import { exportItems, exportItemsAlt, mergeItems } from '../utils/itemutils';
import { IConfigSortData, IResultSortDataBy, sortDataBy } from '../utils/datasort';

import CONFIG from '../components/CONFIG';
import { MergedData, MergedContext } from '../context/mergedcontext';
import ItemDisplay from './itemdisplay';
import { EquipmentCommon, EquipmentItem } from '../model/equipment';
import { calculateRosterDemands } from '../utils/equipment';
import { TinyStore } from '../utils/tiny';
import { downloadData } from '../utils/crewutils';

type ProfileItemsProps = {
	/** List of equipment items */
	data?: EquipmentCommon[] | EquipmentItem[];
	
	/** Optional alternative navigation method */
	navigate?: (symbol: string) => void;
	
	/** Hide features for owned items */
	hideOwnedInfo?: boolean;

	/** Hide search bar */
	hideSearch?: boolean;
	
	/** Add needed but unowned items to list */
	addNeeded?: boolean;

	pageName?: string;
};

type ProfileItemsState = {
	column: any;
	direction: 'descending' | 'ascending' | null;
	data?: (EquipmentCommon | EquipmentItem)[];
	filteredData?: (EquipmentCommon | EquipmentItem)[];
	filterText?: string;
	pagination_rows: number;
	pagination_page: number;
	
	/** Add needed but unowned items to list */
	addNeeded?: boolean;
};

const pagingOptions = [
	{ key: '0', value: '10', text: '10' },
	{ key: '1', value: '25', text: '25' },
	{ key: '2', value: '50', text: '50' },
	{ key: '3', value: '100', text: '100' }
];

class ProfileItems extends Component<ProfileItemsProps, ProfileItemsState> {
	static contextType = MergedContext;
	context!: React.ContextType<typeof MergedContext>;
	readonly tiny: TinyStore; 

	constructor(props: ProfileItemsProps) {
		super(props);
		this.tiny = TinyStore.getStore((props.pageName ? props.pageName + "_": "") + 'profile_items');

		this.state = {
			column: null,
			direction: null,
			filterText: this.tiny.getValue('filterText', '') ?? '',
			pagination_rows: 10,
			pagination_page: 1,
			data: props.data,
			addNeeded: props.addNeeded ?? this.tiny.getValue<boolean>('addNeeded', false)
		};
	}

	componentDidMount() {
		this.initData();
	}
	componentDidUpdate() {
		this.initData();
	}
	initData() {
		if (this.state.data?.length && this.state.data?.length > 0) return;

		fetch('/structured/items.json')
			.then(response => response.json())
			.then(items => {
				let data = mergeItems(this.context.playerData.player.character.items, items);
				const { playerData } = this.context;
				let { hideOwnedInfo } = this.props;

				if (!hideOwnedInfo && !!playerData?.player?.character?.crew?.length && !!data?.length){
					const demandos = calculateRosterDemands(playerData.player.character.crew, data as EquipmentItem[]);
					for (let item of data) {
						if (item.type === 8) {
							let scheme = playerData.player.character.ships.find(f => f.symbol + "_schematic" === item.symbol);
							if (scheme && scheme.schematic_gain_cost_next_level && scheme.schematic_gain_cost_next_level > 0) {
								item.needed = scheme.schematic_gain_cost_next_level;
								item.factionOnly = false;
							}
							else {
								item.needed = 0;
								item.factionOnly = false;
							}
						}
						else if (item.type === 2 || item.type === 3) {
							const fitem = demandos?.demands?.find(f => f.symbol === item.symbol);
							if (fitem) {
								item.needed = fitem.count;
								item.factionOnly = fitem.equipment?.item_sources?.every(i => i.type === 1) ?? item.factionOnly;
							}
							else {
								item.needed = 0;
								item.factionOnly = false;
							}
						}
					}
					if (demandos?.demands.length && this.state.addNeeded === true) {
						for (let item of demandos.demands) {
							if (!data.find(f => f.symbol === item.symbol) && this.context.items) {
								item.equipment = this.context.items.find(f => f.symbol === item.symbol);
								if (item.equipment){
									let eq = JSON.parse(JSON.stringify(item.equipment)) as EquipmentItem;
									eq.needed = item.count;
									eq.factionOnly = item.equipment?.item_sources?.every(i => i.type === 1) ?? item.factionOnly;
									eq.quantity = 0;
									data.push(eq);
								}
							}
						}
					}
				}
				this.setState({ data });
			});
	}

	private _onChangePage(activePage) {
		this.setState({ pagination_page: activePage });
	}


	private _handleSort(clickedColumn) {
		const { column, direction } = this.state;
		let { data } = this.state;
		if (!data) return;
		
		const sortConfig: IConfigSortData = {
			field: clickedColumn,
			direction: clickedColumn === column ? direction : (clickedColumn === 'quantity' ? 'ascending' : null)
		};

		const sorted: IResultSortDataBy = sortDataBy(data, sortConfig);
		this.setState({
			column: sorted.field,
			direction: sorted.direction,
			pagination_page: 1,
			data: sorted.result
		});
	}

	private _handleNavigate = (symbol: string) => {
		if (this.props.navigate) {
			this.props.navigate(symbol);
		}
		else {
			navigate("/item_info?symbol=" + symbol);
		}
	}

	private _handleFilter = (text: string | undefined) => {
		this.tiny.setValue('filterText', text ?? '');
		this.setState({ ...this.state, filterText: text ?? '' });
	}

	private _handleAddNeeded = (value: boolean | undefined) => {
		if (this.state.addNeeded === value) return;		
		this.tiny.setValue('addNeeded', value ?? false);
		this.setState({ ...this.state, data: undefined, addNeeded: value ?? false });
	}

	render() {
		const { addNeeded, column, direction, pagination_rows, pagination_page } = this.state;
		let { data } = this.state;
		const filterText = this.state.filterText?.toLocaleLowerCase();

		const { hideOwnedInfo, hideSearch } = this.props;		
		let totalPages = 0;
		if (data !== undefined) {
			if (filterText && filterText !== '') {
				data = data.filter(f => f.name?.toLowerCase().includes(filterText) || 
					f.short_name?.toLowerCase().includes(filterText) ||
					f.flavor?.toLowerCase().includes(filterText) ||
					CONFIG.RARITIES[f.rarity].name.toLowerCase().includes(filterText) ||
					CONFIG.REWARDS_ITEM_TYPE[f.type].toLowerCase().includes(filterText)
					);
			}

			totalPages = Math.ceil(data.length / this.state.pagination_rows);

			// Pagination
			data = data.slice(pagination_rows * (pagination_page - 1), pagination_rows * pagination_page);
		}		
		return (
			<div style={{margin:0,padding:0}}>
			<div className='ui segment' style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
				{!hideSearch && <div style={{ display: "flex", height: "3em", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", marginLeft: "0.25em"}}>
					<Input		
						style={{width:"22em"}}
						label={"Search Items"}
						value={filterText}
						onChange={(e, { value }) => this._handleFilter(value as string)}
						/>
					<i className='delete icon'								
						title={"Clear Searches and Comparison Marks"} 							    
						style={{
							cursor: "pointer", 
							marginLeft: "0.75em"
						}} 								
						onClick={(e) => {
								this._handleFilter(undefined); 
							} 
						} 
					/>

				</div>}
				{!hideOwnedInfo && <div style={{display:'flex', flexDirection:'row', justifyItems: 'flex-end', alignItems: 'center'}}>
					<Checkbox checked={addNeeded} onChange={(e, { value }) => this._handleAddNeeded(!addNeeded)} /><span style={{marginLeft:"0.5em", cursor: "pointer"}} onClick={(e) => this._handleAddNeeded(!addNeeded)}>Show Unowned Needed Items</span>
				</div>}
			</div>
			{!data &&<div className='ui medium centered text active inline loader'>{"Loading data..."}</div>}
			{data && <Table sortable celled selectable striped collapsing unstackable compact="very">
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell
							width={3}
							sorted={column === 'name' ? direction ?? undefined : undefined}
							onClick={() => this._handleSort('name')}
						>
							Item
						</Table.HeaderCell>
						{!hideOwnedInfo && <Table.HeaderCell
							width={1}
							sorted={column === 'quantity' ? direction ?? undefined : undefined}
							onClick={() => this._handleSort('quantity')}
						>
							Quantity
						</Table.HeaderCell>}
						{!hideOwnedInfo &&
						<Table.HeaderCell
							width={1}
							sorted={column === 'needed' ? direction ?? undefined : undefined}
							onClick={() => this._handleSort('needed')}
						>
							Needed
						</Table.HeaderCell>}
						<Table.HeaderCell
							width={1}
							sorted={column === 'type' ? direction ?? undefined : undefined}
							onClick={() => this._handleSort('type')}
						>
							Item type
						</Table.HeaderCell>
						<Table.HeaderCell
							width={1}
							sorted={column === 'rarity' ? direction ?? undefined : undefined}
							onClick={() => this._handleSort('rarity')}
						>
							Rarity
						</Table.HeaderCell>
						{!hideOwnedInfo &&
						<Table.HeaderCell
							width={1}
							sorted={column === 'factionOnly' ? direction ?? undefined : undefined}
							onClick={() => this._handleSort('factionOnly')}
						>
							Faction Only
						</Table.HeaderCell>}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{data.map((item, idx) => (
						<Table.Row key={idx}>
							<Table.Cell>
								<div
									title={item.name + (!hideOwnedInfo ? (!item.quantity ? ' (Unowned)' : ` (${item.quantity})`) : "")}
									style={{
										display: 'grid',
										gridTemplateColumns: '60px auto',
										gridTemplateAreas: `'icon stats' 'icon description'`,
										gridGap: '1px'
									}}
								>
									<div style={{ gridArea: 'icon' }}>
									<ItemDisplay
										style={{
											opacity: !item.quantity && !hideOwnedInfo ? '0.20' : '1'
										}}
										rarity={item.rarity}
										maxRarity={item.rarity}
										size={48} 
										src={`${process.env.GATSBY_ASSETS_URL}${item.imageUrl}`} />
										
									</div>
									<div style={{ gridArea: 'stats', cursor: "pointer" }}>
										<a onClick={(e) => this._handleNavigate(item.symbol)}>
											<span style={{ fontWeight: 'bolder', fontSize: '1.25em' }}>
												{item.rarity > 0 && (
													<span>
														{item.rarity} <Icon name="star" />{' '}
													</span>
												)}
												{item.name}
											</span>
										</a>
									</div>
									<div style={{ gridArea: 'description' }}>{item.flavor}</div>
								</div>
							</Table.Cell>
							{!hideOwnedInfo && <Table.Cell>{item.quantity}</Table.Cell>}
							{!hideOwnedInfo && <Table.Cell>{item.needed ?? 'N/A'}</Table.Cell>}
							<Table.Cell>{CONFIG.REWARDS_ITEM_TYPE[item.type]}</Table.Cell>
							<Table.Cell>{CONFIG.RARITIES[item.rarity].name}</Table.Cell>
							{!hideOwnedInfo && <Table.Cell>{item.factionOnly === undefined ? '' : (item.factionOnly === true ? 'Yes' : 'No')}</Table.Cell>}
						</Table.Row>
					))}
				</Table.Body>
				<Table.Footer>
					<Table.Row>
						<Table.HeaderCell colSpan="8">
							<Pagination
								totalPages={totalPages}
								activePage={pagination_page}
								onPageChange={(event, { activePage }) => this._onChangePage(activePage)}
							/>
							<span style={{ paddingLeft: '2em' }}>
								Items per page:{' '}
								<Dropdown
									inline
									options={pagingOptions}
									value={pagination_rows}
									onChange={(event, { value }) =>
										this.setState({ pagination_page: 1, pagination_rows: value as number })
									}
								/>
							</span>
						</Table.HeaderCell>
					</Table.Row>
				</Table.Footer>
			</Table>}
			<br />
				{!hideOwnedInfo && <div 
					className='ui button' 
					onClick={(e) => { if (this.state.data) this._exportItems(this.state.data)}}
					style={{display:'inline', flexDirection:'row', justifyContent:'space-evenly', cursor: 'pointer'}}
					>
					<span style={{margin: '0 2em 0 0'}}>Export to CSV</span><i className='download icon' />
				</div>}
			<br />
			<br />
			</div>
		);
	}
	
	_exportItems(data: (EquipmentCommon | EquipmentItem)[]) {
		const { playerData } = this.context;

		let text = exportItemsAlt(data);
		downloadData(`data:text/csv;charset=utf-8,${encodeURIComponent(text)}`, 'items.csv');
	}
}

export default ProfileItems;
