import React from "react";
import { PlayerData } from "../../model/player";
import { Link } from "gatsby";
import { Item, Label } from "semantic-ui-react";



export interface PlayerBadgeProps {
    playerData: PlayerData;
    style?: React.CSSProperties;
}

export const PlayerBadge = (props: PlayerBadgeProps) => {

    const { playerData, style } = props;
    if (!playerData) return <></>;

    let portrait = `${process.env.GATSBY_ASSETS_URL}${playerData?.player?.character?.crew_avatar
        ? (playerData?.player?.character?.crew_avatar?.portrait?.file ?? playerData?.player?.character?.crew_avatar?.portrait ?? 'crew_portraits_cm_empty_sm.png')
        : 'crew_portraits_cm_empty_sm.png'}`;

    if (portrait.includes("crew_portraits") && !portrait.endsWith("_sm.png")) {
        portrait = portrait.replace("_icon.png", "_sm.png");
    }

    const avatar = portrait;

    return <Item.Group style={style}>
        <Item>
            <Item.Image
                size='tiny'
                src={avatar}
            />

            <Item.Content>
                <Item.Header>{playerData.player.character.display_name}</Item.Header>
                <Item.Meta style={{marginLeft: 0, marginTop: "0.25em"}}>
                    <Label style={{marginLeft: 0, marginTop: "0.25em"}}>VIP {playerData.player.vip_level}</Label>
                    <Label style={{marginLeft: 0, marginTop: "0.25em"}}>Level {playerData.player.character.level}</Label>
                    <Label style={{marginLeft: 0, marginTop: "0.25em"}}>{playerData.calc?.numImmortals} crew</Label>
                    <Label style={{marginLeft: 0, marginTop: "0.25em"}}>{playerData.player.character.shuttle_bays} shuttles</Label>
                </Item.Meta>
                <Item.Description>
                    {playerData.player.fleet && (
                        <p>
                            Fleet{' '}
                            <Link to={`/fleet_info?fleetid=${playerData.player.fleet.id}`}>
                                <b>{playerData.player.fleet.slabel}</b>
                            </Link>{' '}<br/>
                            ({playerData.player.fleet.rank})<br/> Starbase level {playerData.player.fleet.nstarbase_level}{' '}
                        </p>
                    )}
                </Item.Description>
            </Item.Content>
        </Item>
    </Item.Group>

}