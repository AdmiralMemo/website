import React, { Component } from "react";
import { CompletionState } from "../../model/player";
import { Dropdown, Header, Rating } from "semantic-ui-react";
import { isImmortal, printImmoText } from "../../utils/crewutils";
import { TinyStore } from "../../utils/tiny";
import { DEFAULT_MOBILE_WIDTH } from "../hovering/hoverstat";
import { EquipmentItem } from "../../model/equipment";
import ItemDisplay from "../itemdisplay";
import ItemSources from "../itemsources";
import { MergedContext } from "../../context/mergedcontext";
import { navigate } from "gatsby";
import { PresenterProps } from "./ship_presenter";

export type DemandMode = "all" | "immediate";

export interface ItemPresenterProps extends PresenterProps {
    item: EquipmentItem;
    openItem?: (item: EquipmentItem) => void;
    crewTargetGroup?: string;
}

export interface ItemPresenterState {
    mobileWidth: number;
}

export class ItemPresenter extends Component<ItemPresenterProps, ItemPresenterState> {
    static contextType = MergedContext;
    context!: React.ContextType<typeof MergedContext>;

    tiny: TinyStore;

    constructor(props: ItemPresenterProps) {
        super(props);        
        this.state = {
            ... this.state,
            mobileWidth: props.mobileWidth ?? DEFAULT_MOBILE_WIDTH
        }

        this.tiny = TinyStore.getStore(props.storeName)
    }    
    
    public get demandMode(): DemandMode {
        return this.tiny.getValue<DemandMode>("demandMode", "all") ?? "all"
    }
    
    public set demandMode(value: DemandMode) {
        if (this.demandMode === value) return;
        this.tiny.setValue("demandMode", value);
        this.forceUpdate();
    }

    render(): JSX.Element {
        const { item: item, touched, tabs, showIcon } = this.props;
        const { playerData, items } = this.context;
        const { mobileWidth } = this.state;
        const compact = this.props.hover;    
        const roster = playerData?.player?.character?.crew;
        const mode = this.demandMode;

        if (!item) {
            return <></>
        } 
        item.item_sources?.sort((a, b) => {
            let r = (a.avg_cost ?? 0) - (b.avg_cost ?? 0);
            if (!r) r = a.name.localeCompare(b.name);
            return r;
        });
        const frozenStyle: React.CSSProperties = {
            background: 'transparent',
            color: 'white',            
            cursor: "default",
            marginRight: "0px"
        }

        const checkedStyle: React.CSSProperties = {
            color: "lightgreen",
            marginRight: "0px"
        }

        var me = this;
    
        const demandOpts = [{
            key: "all",
            value: "all",
            text: "All Upcoming Demands"
        },
        {
            key: "immediate",
            value: "immediate",
            text: "Immediate Demands"
        }];

        const navClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, altItem?: EquipmentItem) => {
            altItem ??= item;
            if (!altItem) return;
            if (this.props.openItem) {
                this.props.openItem(altItem);
            }
        }
        
        let mt = true;
        const dcrew = item.demandCrew?.map(sym => {
            const crew = roster.find(f => {
                    if (f.symbol !== sym || (f.level === 100 && f.equipment?.length === 4)) return false;
                    // if (mode === 'immediate') {
                    //     let startlevel = Math.floor(f.level / 10) * 4;
                    //     if (f.level % 10 == 0 && f.equipment.length >= 1) startlevel = startlevel - 4;

                    //     for (let bd of Object.values(f.equipment)) {
                    //         let eqnum = startlevel + (bd as number);
                    //         f.equipment_slots[eqnum].symbol
                    //     }

                    // }
                    return f;
                });
            if (crew) mt = false;
            return (<>
                {crew && <div 
                    onClick={(e) => navigate("/crew/"+crew.symbol)}
                    style={{
                        cursor: "pointer", 
                        textAlign:"center",
                        display:"flex", 
                        width:"96px", 
                        margin: "1em", 
                        flexDirection: "column", 
                        justifyContent: "center", 
                        alignItems: "center"}}>
                        <ItemDisplay
                            targetGroup={this.props.crewTargetGroup}
                            playerData={playerData}
                            allCrew={this.context.allCrew}
                            itemSymbol={sym}
                            rarity={crew.rarity}
                            maxRarity={crew.max_rarity}
                            size={64}
                            src={`${process.env.GATSBY_ASSETS_URL}${crew.imageUrlPortrait}`}
                        />
                        <i>{crew?.name}</i>
                    </div> || <></>}
            </>)
        });

        const empty = mt;
 
        return item ? (<div style={{ 
                        fontSize: "12pt", 
                        display: "flex", 
                        flexDirection: window.innerWidth < mobileWidth ? "column" : "row",
                        //width: window.innerWidth < mobileWidth ? "calc(100vw - 16px)" : undefined
                        
                        }}>
                            <div style={{display: "flex", flexDirection:"row", justifyContent:"flex-start"}}>
                        {touched && <>
                            <i className='close icon' style={{cursor: "pointer"}} onClick={(e) => this.props.close ? this.props.close() : undefined} />
                        </>}    
                    </div> 
                <div style={{ display: "flex", flexDirection: "column"}}>                    
                    <div style={{flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection:"row"}}>
                        <ItemDisplay
                            src={`${process.env.GATSBY_ASSETS_URL}${item.imageUrl}`}
                            size={compact ? 128 : 128}
                            rarity={item.rarity}
                            maxRarity={item.rarity}
                            style={{ maxWidth: "calc(100vw - 32px)", marginRight: "8px"}}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", marginBottom:"8px"}}>
                        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around", fontStyle: "italic", fontSize: "0.8em" }}>
                            {!!item.quantity && !!item.needed && <div>{item.quantity} Owned, {item.needed} Needed</div>}
                            {!!item.quantity && !item.needed && <div>{item.quantity} Owned</div>}
                            {!item.quantity && !!item.needed && <div>{item.needed} Needed</div>}                                                    
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "8em",
                        justifyContent: "space-between",                        
                        maxWidth: window.innerWidth < mobileWidth ? "15m" : "32em",
                        minWidth: "15m",
                    }}
                >
                    <div style={{display: "flex", flexDirection: window.innerWidth < mobileWidth ? "column" : "row", justifyContent: "space-between"}}>
                        <h3 style={{margin:"2px 8px", padding: "8px", marginLeft: "0px", paddingLeft: "0px"}}>
                            <a onClick={(e) => navClick(e)} style={{cursor: "pointer"}} title={item.name}>
                                {item.name}
                            </a>
                        </h3>
                        <div style={{margin: "4px", marginLeft: 0, display: "flex", flexDirection: "row", alignItems: "center"}}>
                            <Rating
                                icon='star' 
                                rating={item.rarity} 
                                maxRating={item.rarity} 
                                size='large' 
                                disabled />
                        </div>
                    </div>
                    <div
                        style={{
                            textAlign: "left",
                            fontStyle: "italic",
                            fontSize: "0.85em",
                            marginTop: "2px",
                            marginBottom: "4px",
                        }}
                    >
                       <i>{item.flavor}</i>
                    </div>
                    <div>
                    {!!((item.item_sources?.length ?? 0) > 0) && (
                            <div style={{fontSize: "8pt",marginRight: "1em"}}>
                                <Header as="h3">Item sources:</Header>
                                <ItemSources refItem={item.symbol} brief={true} item_sources={item.item_sources} />
                                <br />
                            </div>
                        )}
                    </div>

                    <div style={{display: "flex", flexDirection: "column", marginBottom:"1em"}}>
                    {!!(item.recipe?.list?.length) && (
                            <div style={{fontSize: "8pt"}}>
                                <Header as="h3">Recipe:</Header>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "top",
                                    textAlign: "center",
                                    justifyContent: "flex-start",
                                    flexWrap: "wrap",
                                    overflow: "auto",
                                    maxHeight: "320px"
                                }}>
                                {item.recipe.list.map((ing, idx) => {
                                    const ingitem = items?.find(f=>f.symbol === ing.symbol);
                                    if (!ingitem) return <></>
                                    return (
                                    <div key={"recipe_component_hover_"+ing.symbol+item.symbol+idx}
                                        style={{
                                            width:"96px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "flex-start",
                                            textAlign: "center",
                                            margin: "1em",
                                            padding: 0                                 
                                        }}>
                                        <a onClick={(e) => navClick(e, ingitem)} style={{cursor: "pointer"}} title={ingitem.name}>
                                        <ItemDisplay 
                                            src={`${process.env.GATSBY_ASSETS_URL}${ingitem.imageUrl}`}
                                            rarity={ingitem.rarity}
                                            maxRarity={ingitem.rarity}
                                            size={48}
                                            />
                                            </a>
                                        <i>{ingitem.name}&nbsp;({ing.count})</i>
                                    </div>)
                                })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{display: "flex", flexDirection: "column", marginBottom:"1em"}}>
                    {!empty && 
                        (<div>
                            <div style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between"
                            }}>
                            <Header as="h3">Current Roster Demands:</Header>
                                {/* <div style={{fontSize: "0.8em"}}>
                                <Dropdown 
                                    options={demandOpts} 
                                    value={this.demandMode} 
                                    onChange={(e, { value }) => this.demandMode = value as DemandMode}
                                    />
                                </div> */}
                            </div>
                            <div style={{
                                display: "flex", 
                                flexDirection: "row", 
                                justifyContent: "flex-start", 
                                alignItems: "flex-start", 
                                maxHeight: "320px",
                                overflow: "auto",
                                flexWrap: "wrap"}}>

                                {dcrew}                                
                            </div>
                        </div>)}
                    </div>
                </div>
            </div>) : <></>
        
    }
    
}