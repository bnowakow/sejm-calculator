import {committees, constituencies, pastSupport} from './data';
import {Constituency} from './types';

const calculateLocalSupport = (
	support: number[],
	pastSupportProjection: number[],
	constituency: Constituency,
): number[] => {
	const localPastSupport = constituency.pastSupport;
	const localPastSupportProjection = committees.map((committee) => (
		committee.pastSupportEquivalence
			.map((pastCommittee) => localPastSupport[pastCommittee[0]] * pastCommittee[1])
			.reduce((a, b) => a + b, 0)
	));
	const localSupportDeviation = pastSupportProjection
		.map((pastCommitteSupportProjection, index) => (
			localPastSupportProjection[index] / pastCommitteSupportProjection
		));
	const localSupport = support.map((committeeSupport, index) => (
		committeeSupport * localSupportDeviation[index]
	));
	if (constituency.name === 'Opole') {
		localSupport.push(7.9);
	}
	return localSupport;
};

export default (support: number[]): number[] => {
	const pastSupportProjection = committees.map((committee) => (
		committee.pastSupportEquivalence
			.map((pastCommittee) => pastSupport[pastCommittee[0]] * pastCommittee[1])
			.reduce((a, b) => a + b, 0)
	));
	const mandates: number[] = new Array(support.length + 1).fill(0);
	constituencies.forEach((constituency) => {
		const localSupport = calculateLocalSupport(support, pastSupportProjection, constituency);
		constituency.support = localSupport;
		constituency.mandates = new Array(localSupport.length).fill(0);
		const filteredLocalSupport = localSupport.map((localCommitteeSupport, index) => {
			if (support[index] < committees[index].threshold) return 0;
			return localCommitteeSupport;
		});
		const quotients: {quotient: number; committeeIndex: number}[] = [];
		for (let divisor = 1; divisor <= constituency.size; divisor += 1) {
			for (let committeeIndex = 0; committeeIndex < localSupport.length; committeeIndex += 1) {
				quotients.push({
					quotient: filteredLocalSupport[committeeIndex] / divisor,
					committeeIndex,
				});
			}
		}
		quotients.sort((a, b) => b.quotient - a.quotient);
		quotients.slice(0, constituency.size).forEach((quotient) => {
			if (quotient.quotient > 0) {
				mandates[quotient.committeeIndex] += 1;
				constituency.mandates![quotient.committeeIndex] += 1;
			}
		});
	});
	return mandates;
};
