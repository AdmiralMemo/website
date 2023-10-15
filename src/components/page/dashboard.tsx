import React from 'react';

import { GlobalContext } from '../../context/globalcontext';
import Announcement from '../../components/announcement';

import { PlayerInfo } from '../../components/playerdata/playerinfo';
import { PlayerShareNotifications, PlayerSharePanel } from '../../components/playerdata/playershare';

type DashboardProps = {
	activePanel: string | undefined;
	setActivePanel: (panel: string | undefined) => void;
};

const Dashboard = (props: DashboardProps) => {
	const globalContext = React.useContext(GlobalContext);
	const { playerData } = globalContext.player;
	const { activePanel, setActivePanel } = props;
	const [dbidHash, setDbidHash] = React.useState<string | undefined>(undefined);

	return (
		<React.Fragment>
			<Announcement />
			{playerData &&
				<PlayerShareNotifications
					dbidHash={dbidHash}
					setDbidHash={setDbidHash}
					dbid={`${playerData.player.dbid}`}
					activePanel={activePanel}
					setActivePanel={setActivePanel}
				/>
			}

			{activePanel === 'share' &&
				<PlayerSharePanel
					dbidHash={dbidHash}
					requestDismiss={() => { setActivePanel(undefined); }}
				/>
			}
			{activePanel === 'info' &&
				<PlayerInfo
					requestDismiss={() => { setActivePanel(undefined); }}
				/>
			}
		</React.Fragment>
	);
};

export default Dashboard;