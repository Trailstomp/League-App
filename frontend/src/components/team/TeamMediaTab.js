import React from 'react';
import MediaManager from '../MediaManager';
import TeamGalleryDisplay from '../TeamGalleryDisplay';

const TeamMediaTab = ({ team, currentUser = null, canEdit = false }) => {
    const YouTubeGallery = React.lazy(() => import('../YouTubeGallery'));

    return (
        <div className="space-y-6">
            {/* Self-service Media Manager */}
            <MediaManager
                ownerType="team"
                ownerId={team.id}
                canEdit={canEdit}
                currentUser={currentUser}
            />

            <React.Suspense fallback={<div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">Loading media...</div>}>
                {/* Legacy team galleries from Google Drive */}
                <TeamGalleryDisplay 
                    teamId={team.id}
                    pageType="team"
                />
                
                {/* Team YouTube Videos */}
                <YouTubeGallery 
                    teamId={team.id}
                    title={`${team.name} YouTube Videos`} 
                />
            </React.Suspense>
        </div>
    );
};

export default TeamMediaTab;
