import React from 'react';
import { navigate } from "gatsby";
import { Menu, Dropdown, Icon, Sidebar, Grid, Container } from "semantic-ui-react";
import { v4 } from "uuid";
import { GlobalContext } from "../../context/globalcontext";
import { useOtherPages } from "../otherpages";
import { DEFAULT_MOBILE_WIDTH } from '../hovering/hoverstat';
import { NavItem, createSubMenu, DefaultOpts, DefaultOptsMobile, drawMenuItem, MaxMenuItems, MaxMobileItems, getAllOptions as getAllMenuOptions, parsePermalink, renderColumnsMenu } from './util';
import { useStateWithStorage } from '../../utils/storage';
import { PlayerMenu } from "./playermenu";


type NavigationProps = {
	requestPanel: (target: string, panel: string | undefined) => void;
    sidebarTarget?: React.RefObject<HTMLElement>;
    children: JSX.Element;
};


export const Navigation = (props: NavigationProps) => {
	const windowGlobal = typeof globalThis.window !== 'undefined' ? globalThis.window : undefined;

	const context = React.useContext(GlobalContext);
    const [isMobile, setIsMobile] = React.useState(typeof windowGlobal !== 'undefined' && windowGlobal.innerWidth < DEFAULT_MOBILE_WIDTH);
    const [openBar, setOpenBar] = React.useState(false);

	const [activeMenu, setActiveMenu] = useStateWithStorage('navigation/active', DefaultOpts, { rememberForever: true });
	const [mobileActiveMenu, setMobileActiveMenu] = useStateWithStorage('navigation/mobileActive', DefaultOptsMobile, { rememberForever: true });

	if (!!context.player.playerData && typeof windowGlobal !== 'undefined' && !!windowGlobal.location.search?.length) {
		let parm = new URLSearchParams(windowGlobal.location.search);
		if (parm.has('pmc')) {
			let result = parsePermalink(parm.get("pmc") ?? '');
			if (result) {
				const res = result;
				windowGlobal.setTimeout(() => {
					if (JSON.stringify(res) !== JSON.stringify([activeMenu, mobileActiveMenu])) {
						setActiveMenu(res[0]);
						setMobileActiveMenu(res[1]);
					}
				});
			}
		}
	}
	// const requestPanel = (target: string, panel: string | undefined) => {
	// 	props.requestPanel(target, panel);
	// 	setOpenBar(false);
	// }
	let portrait = `${process.env.GATSBY_ASSETS_URL}${context.player.playerData?.player?.character?.crew_avatar
		? (context.player.playerData?.player?.character?.crew_avatar?.portrait?.file ?? context.player.playerData?.player?.character?.crew_avatar?.portrait ?? 'crew_portraits_cm_empty_sm.png')
		: 'crew_portraits_cm_empty_sm.png'}`;

	if (portrait.includes("crew_portraits") && !portrait.endsWith("_sm.png")) {
		portrait = portrait.replace("_icon.png", "_sm.png");
	}

	const avatar = portrait;

	const toolsSubMenu: NavItem[] = [
		{ optionKey: 'behold', src: '/media/portal.png', title: "Behold Helper", link: "/behold", sidebarRole: 'item' },	// Behold available at launch
		{ optionKey: 'shuttles', src: '/media/shuttle_icon.png', title: "Shuttle Helper", link: "/shuttlehelper", sidebarRole: 'item' },	// Shuttles available at launch
		{ optionKey: 'faction', title: "Factions", src: '/media/faction.png', link: "/factions", sidebarRole: 'item' },	// Factions available at launch
		// { optionKey: 'fleet', title: "Fleet", src: '/media/fleet_icon.png', link: "/fleet", sidebarRole: 'item' },	// Factions available at launch
		{ optionKey: 'event', src: '/media/event.png', title: "Event Planner", link: "/eventplanner", sidebarRole: 'item' },	// Events added post-launch
		{ optionKey: 'gauntlet', src: '/media/gauntlet.png', title: "Gauntlet", link: "/gauntlets", sidebarRole: 'item' },	// Gauntlet added v1.7
		{ optionKey: 'cite', src: `${process.env.GATSBY_ASSETS_URL}/atlas/star_reward.png`, title: "Citation Optimizer", link: "/cite-opt", sidebarRole: 'item' },	// Citations added 1.9
		{ optionKey: 'voyage', src: "/media/voyage.png", title: "Voyage Calculator", link: "/voyage", sidebarRole: 'item' },	// Voyages added v3
		{ optionKey: 'voyhist', src: "/media/antimatter_icon.png", title: "Voyage History", link: "/voyagehistory", sidebarRole: 'item' },	// Voyages added v3
		{ optionKey: 'collection', src: '/media/vault.png', title: "Collection Planner", link: "/collections", sidebarRole: 'item' },	// Collections added v4
		{ optionKey: 'retrieval', src: '/media/retrieval.png', title: "Crew Retrieval", link: "/retrieval", sidebarRole: 'item' },	// Crew retrieval added v8
		{ optionKey: 'fbb', src: '/media/fbb.png', title: "Fleet Boss Battles", link: "/fbb", sidebarRole: 'item' },	// Fleet boss battles added v9
		{ optionKey: 'continuum', src: '/media/continuum.png', title: "Continuum Helper", link: "/continuum", sidebarRole: 'item' },	// Continuum missions added v10
	];

	
	const pages = [
		{
			src: '/media/logo.png',
			customAction: (e, data) => {
				if (isMobile) setOpenBar(!openBar);
				else (navigate("/"))
			}
		},
		{
			icon: 'paste',
			tooltip: "Paste or upload player data",
			checkVisible: (data) => {
				return !!context.player.playerData;
			},
			customAction: (e, data) => props.requestPanel('player', 'input'),
			customRender: (data) => {
				return <Menu.Item key={'customInput'} onClick={() => props.requestPanel('player', 'input')}>
				<img
					style={{height:"24px", width: "24px"}}
					src={`${avatar}`}
				/>
				</Menu.Item>
			}
		},
		{
			src: `${process.env.GATSBY_ASSETS_URL}${'crew_portraits_cm_empty_sm.png'}`,
			title: isMobile ? undefined : 'Import Player Data ...',
			customAction: () => props.requestPanel('player', 'input'),
			checkVisible: (data) => {
				return !context.player.playerData;
			},
		},
		{
			title: context.player.playerData?.player?.display_name ?? 'Player',
			checkVisible: (data) => {
				return !!context.player.playerData && !isMobile;
			},
			customRender: (data) => {
				return (
					<PlayerMenu key={v4()}
						navConfig={{
							current: activeMenu,
							mobileCurrent: mobileActiveMenu,
							maxItems: MaxMenuItems,
							defaultOptions: DefaultOpts,
							defaultMobileOptions: DefaultOptsMobile,
							setCurrent: setActiveMenu,
							setMobileCurrent: setMobileActiveMenu,
							maxItemsMobile: MaxMobileItems,
							menu: pages
						}}
						requestPanel={
							props.requestPanel
						}
					/>
				);
			}
		},
		{
			checkVisible: () => isMobile,
			title: 'Player',
            sidebarRole: 'heading',
            subMenu: [
				{
					sidebarRole: 'item',
					checkVisible: (data) => {
						return !!context.player.playerData && !isMobile;
					},
					customRender: (data) => {
						return (<PlayerMenu key={v4()}
							vertical
							requestPanel={props.requestPanel}
						/>)
					}
				}
			]
		},
		{
			checkVisible: () => isMobile,
			title: 'Worfle',
			sidebarRole: 'heading',
			subMenu: [
				{ title: 'Worfle', link: '/crewchallenge' }
			]
		},
		{ optionKey: '_option0', checkVisible: () => false },
		{ optionKey: '_option1', checkVisible: () => false },
		{ optionKey: '_option2', checkVisible: () => false },
		{ optionKey: '_option3', checkVisible: () => false },
		{ optionKey: '_option4', checkVisible: () => false },
		{
			title: 'Roster',
            sidebarRole: 'heading',
			subMenu: [
				{ optionKey: 'crew', src: '/media/crew_icon.png', title: 'Crew', link: '/', sidebarRole: 'item' },
				{ optionKey: 'ship', src: '/media/ship_icon.png', title: 'Ships', link: '/ships', sidebarRole: 'item' },
				{ optionKey: 'items', src: '/media/equipment_icon.png', title: 'Items', link: '/items', sidebarRole: 'item' },
				{ optionKey: 'unneeded_items', src: '/media/equipment_icon.png', title: 'Unneeded Items', link: '/unneeded', sidebarRole: 'item' },
			]
		},
		{
			title: 'Tools',
			sidebarRole: 'heading',
			subMenu: toolsSubMenu,
			checkVisible: () => !isMobile,
			customRender: (data) => renderColumnsMenu(data, 2)
		},
		{
			title: 'Tools',
			sidebarRole: 'heading',
			subMenu: toolsSubMenu,
			checkVisible: () => isMobile
		},
		// {
		// 	title: 'Tools',
        //     sidebarRole: 'heading',
        //     subMenu: [
		// 		{
		// 			optionKey: 'crew_planning',
		// 			title: 'Crew Planning',
		// 			sidebarRole: 'heading',
		// 			src: '/media/crew_icon.png',
		// 			subMenu: [
		// 				{ optionKey: 'behold', src: '/media/portal.png',title: "Behold Helper", link: "/behold", sidebarRole: 'item' },	// Behold available at launch
		// 				{ optionKey: 'cite', src: `${process.env.GATSBY_ASSETS_URL}/atlas/star_reward.png`, title: "Citation Optimizer", link: "/cite-opt", sidebarRole: 'item' },	// Citations added 1.9
		// 				{ optionKey: 'collection', src: '/media/vault.png', title: "Collection Planner", link: "/collections", sidebarRole: 'item' },	// Collections added v4
		// 				{ optionKey: 'retrieval', src: '/media/retrieval.png', title: "Crew Retrieval", link: "/retrieval", sidebarRole: 'item' },	// Crew retrieval added v8
		// 			]
		// 		},

		// 		{
		// 			optionKey: 'game_play',
		// 			title: 'Game Play',
		// 			sidebarRole: 'heading',
		// 			src: '/media/event2.png',
		// 			subMenu: [
		// 				{ optionKey: 'faction', title: "Factions", src: '/media/faction.png', link: "/factions", sidebarRole: 'item' },	// Factions available at launch
		// 				{ optionKey: 'event', src: '/media/event.png', title: "Event Planner", link: "/eventplanner", sidebarRole: 'item' },	// Events added post-launch
		// 				{ optionKey: 'gauntlet', src: '/media/gauntlet.png', title: "Gauntlet", link: "/gauntlets", sidebarRole: 'item' },	// Gauntlet added v1.7
		// 				{ optionKey: 'fbb', src: '/media/fbb.png', title: "Fleet Boss Battles", link: "/fbb", sidebarRole: 'item' },	// Fleet boss battles added v9
		// 				{ optionKey: 'continuum', src: '/media/continuum.png', title: "Continuum Helper", link: "/continuum", sidebarRole: 'item' },	// Continuum missions added v10
		// 			]
		// 		},
		// 		{
		// 			optionKey: 'voyage_submenu',
		// 			title: 'Voyages',
		// 			sidebarRole: 'heading',
		// 			src: '/media/voyage.png',
		// 			subMenu: [
		// 				{ optionKey: 'voyage', src: "/media/voyage.png", title: "Voyage Calculator", link: "/voyage", sidebarRole: 'item' },	// Voyages added v3
		// 				{ optionKey: 'voyhist', src: "/media/voyagehist.png", title: "Voyage History", link: "/voyagehistory", sidebarRole: 'item' },	// Voyages added v3
		// 			]
		// 		},
		// 		// { optionKey: 'fleet', title: "Fleet", src: '/media/fleet_icon.png', link: "/fleet", sidebarRole: 'item' },	// Factions available at launch

		// 	]
		// },
		{
			title: 'Game Info',
            sidebarRole: 'heading',
            subMenu: [
				{ title: 'Episodes', link: '/episodes', sidebarRole: 'item' },
				{ title: 'Events', link: '/events', sidebarRole: 'item' },
				{ title: 'Voyage Hall of Fame', link: '/hall_of_fame', sidebarRole: 'item' },
				{ title: "Misc Game Stats", link: "/stats", sidebarRole: 'item' },
				{ title: "Bridge Crew Tool", link: "/bridgecrew", sidebarRole: 'item' },
			]
		},
		// TODO: Use later?
		// {
		// 	title: 'Search',
		// 	right: true,
		// 	customRender: (data) => {
		// 		return <Input />
		// 	},
		// 	customAction: (e, data) => { return true; },
		// 	checkVisible: (data) => !isMobile
		// },
		{
			title: 'Worfle',
			right: true,
			link: '/crewchallenge',
			checkVisible: (data) => !isMobile
		},
		{
			title: <Icon name='bug' />,
			textTitle: 'Switch between Production and Beta',
			right: true,
			customAction: (e, data) => {
				if (typeof window !== 'undefined') {
					if (window.location.href.includes("beta.datacore.app")) {
						window.location.href = "https://datacore.app/";
					}
					else {
						window.location.href = "https://beta.datacore.app/";
					}
				}
			},
			checkVisible: (data) => !isMobile
		},
	] as NavItem[];

	const popts = getAllMenuOptions(pages);

	const pc = pages.length;
	const actmnu = isMobile ? mobileActiveMenu : activeMenu;
	const cmax = isMobile ? MaxMobileItems : MaxMenuItems;

	for (let p = 0; p < pc; p++) {
		const page = pages[p];
		if (!page) continue;
		if (page.optionKey?.startsWith("_option")) {
			let xkey = Number.parseInt(page.optionKey.slice(7));

			if (xkey < actmnu.length && xkey < cmax) {
				let fopt = popts.find(o => o.optionKey === actmnu[xkey]);
				if (fopt) {
					pages[p] = {
						... fopt,
						title: undefined,
						optionKey: undefined,
						tooltip: fopt.textTitle ?? (typeof fopt.title === 'string' ? fopt.title : ''),
						sidebarRole: undefined
					}
				}
			}
		}
	}

	const otherPages = useOtherPages();
	const about = [
		{ title: 'About DataCore', link: '/about', sidebarRole: 'item' },
		{ title: 'Announcements', link: '/announcements', sidebarRole: 'item' }
	] as NavItem[];

	let now = new Date();
	if (now.getMonth() === 3 && now.getDate() === 1) {
		about.unshift({
			title: 'Toggle Acute Peripheral Reflective Inversion Loop',
			sidebarRole: 'item',
			customAction: (e, d) => {
				if (typeof localStorage !== undefined) {
					let b = localStorage.getItem("hahaDone");
					if (b && b === '1') {
						localStorage.removeItem("hahaDone");
					}
					else {
						localStorage.setItem("hahaDone", "1");
					}

					document.location = document.location;
				}
			}
		})
	}

	otherPages.map((page) => {
		about.push(
			{ title: page.title, link: page.slug, sidebarRole: 'item' }
		);
	});

	const sidebarItems = [] as JSX.Element[];
	const menuItems = [] as JSX.Element[];
	const rightItems = [] as JSX.Element[];

	for (let page of pages) {
		if (page.right) continue;
		if (page.optionKey) {
			if (page.optionKey.startsWith("_option")) continue;
			if (isMobile && !mobileActiveMenu.includes(page.optionKey)) continue;
			else if (!isMobile && !activeMenu.includes(page.optionKey)) continue;
		}

		if (page.checkVisible && !page.checkVisible(page)) continue;
		if (isMobile) {
			if (page.sidebarRole === undefined) {
				if (page.customRender) {
					menuItems.push(page.customRender(page));
				}
				else if (page.subMenu) {
					menuItems.push(createSubMenu(page.textTitle ?? (typeof page.title === 'string' ? page.title : ''), page.subMenu));
				}
				else {
					menuItems.push(drawMenuItem(page));
				}
			}
			else {
				if (page.customRender) {
					sidebarItems.push(page.customRender(page));
				}
				else if (page.subMenu) {
					sidebarItems.push(createSubMenu(page.textTitle ?? (typeof page.title === 'string' ? page.title : ''), page.subMenu, true));
				}
				else {
					sidebarItems.push(drawMenuItem(page));
				}
			}
		}
		else {
			if (page.customRender) {
				menuItems.push(page.customRender(page));
			}
			else if (page.subMenu) {
				menuItems.push(createSubMenu(page.textTitle ?? (typeof page.title === 'string' ? page.title : ''), page.subMenu));
			}
			else {
				menuItems.push(drawMenuItem(page));
			}
		}
	}

	for (let page of pages) {
		if (!page.right) continue;
		if (page.optionKey) {
			if (page.optionKey.startsWith("_option")) continue;
			if (isMobile && !mobileActiveMenu.includes(page.optionKey)) continue;
			else if (!isMobile && !activeMenu.includes(page.optionKey)) continue;
		}

		if (page.checkVisible && !page.checkVisible(page)) continue;
		if (page.customRender) {
			rightItems.push(page.customRender(page));
		}
		else if (page.subMenu) {
			rightItems.push(createSubMenu(page.textTitle ?? (typeof page.title === 'string' ? page.title : ''), page.subMenu));
		}
		else {
			rightItems.push(drawMenuItem(page));
		}
	}

	if (!isMobile) {
		rightItems.unshift(createSubMenu('About', about));

	}
	else {
		sidebarItems.push(createSubMenu('About', about, true));
	}

	if (typeof windowGlobal !== 'undefined') {
		windowGlobal.addEventListener('resize', (e) => {
			setIsMobile(typeof windowGlobal !== 'undefined' && windowGlobal.innerWidth < DEFAULT_MOBILE_WIDTH);
		});
	}

	const sref = React.useRef<HTMLDivElement>(null);

	return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: "sticky", top: "0px", zIndex: "1000" }}>
                <Container>
					<Menu style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center'}}>
						{menuItems}
							{rightItems}

					</Menu>
				</Container>
            </div>
			<div ref={sref} onClick={(e) => setOpenBar(false)} style={{flexGrow: 1}}>
				<Sidebar.Pushable style={{ minHeight:"100vh"}}>
					<Sidebar
						as={Grid}
						animation='overlay'
						onHide={() => setOpenBar(false)}
						vertical="true"
						visible={openBar}>
						<Menu size={'large'} vertical style={{width: "300px"}}>
							{sidebarItems}
						</Menu>
					</Sidebar>
					<div>
					{props.children}
					</div>
				</Sidebar.Pushable>
			</div>
        </>
	);
};
