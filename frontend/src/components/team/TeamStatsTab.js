import React from 'react';
import TeamStatsDisplay from '../TeamStatsDisplay';

const TeamStatsTab = ({ team, events = [], teams = [] }) => {
    return <TeamStatsDisplay teamId={team.id} teams={teams} />;
};

export default TeamStatsTab;
