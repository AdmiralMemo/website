import React from 'react';

import { GlobalContext } from '../../context/globalcontext';

export const RetrievalEnergy = () => {
	const globalContext = React.useContext(GlobalContext);
	const { playerData } = globalContext.player;

	if (!playerData) return <></>;

	const energy = playerData.crew_crafting_root.energy;

	const qTarget = 900;
	const qPerFullDay = (24*60*60)/(energy.regeneration?.seconds ?? 1); // 48
	const qPerBoost = 50;

	let energyMessage = 'You can guarantee a legendary crew retrieval now!';
	if (energy.quantity < qTarget) {
		const regenerationTime = getSecondsRemaining(qTarget, energy.quantity);
		energyMessage = `You will regenerate enough quantum to reach ${qTarget} in ${formatTime(regenerationTime)};`;
		let daysCanBoost = 0, qTotal = energy.quantity;
		while (qTotal < qTarget) {
			daysCanBoost++;
			qTotal += qPerBoost+qPerFullDay;
		}
		const timeBoosted = getSecondsRemaining(qTarget, energy.quantity+(daysCanBoost*qPerBoost));
		energyMessage += ` spend 90 dilithium ${daysCanBoost > 1 ? 'daily' : ''} to reach ${qTarget}`
			+ ` ${timeBoosted <= 0 ? 'immediately' : `in ${formatTime(timeBoosted)}`}.`;
	}

	return (
		<p>Quantum: <strong>{energy.quantity}</strong>. {energyMessage}</p>
	);

	function getSecondsRemaining(target: number, quantity: number): number {
		return ((target-quantity)*(energy.regeneration.seconds ?? 0))+energy.regenerated_at;
	}

	function formatTime(seconds: number): string {
		let d = Math.floor(seconds/(3600*24)),
			h = Math.floor(seconds%(3600*24)/3600),
			m = Math.floor(seconds%3600/60);
		if (d == 0) return `${h}h ${m}m`;
		return `${d}d ${h}h ${m}m`;
	}
};
