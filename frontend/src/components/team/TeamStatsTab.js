import React from 'react';
import TeamStatsDisplay from '../TeamStatsDisplay';

const TeamStatsTab = ({ team, events = [] }) => {
    return <TeamStatsDisplay teamId={team.id} />;
};

export default TeamStatsTab;
