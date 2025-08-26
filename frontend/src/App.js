import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, BarChart2, Users, Calendar, Shield, Menu, X, Settings, LogOut, Sun, Moon, ArrowUp, ArrowDown, Trophy, Swords, MessageSquare, Crown, LogIn, Mail, Edit, ToggleLeft, ToggleRight, Plus, Trash2, Twitter, Instagram, Facebook, Image, Video, UserCheck, MapPin, Palette } from 'lucide-react';
import "./App.css";

// --- ASSETS ---
const MlblLogo = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzE4MTgyOCIvPjxwYXRoIGQ9Ik0zMCAyMEw3MCAyMFY4MEw1MCA5MEwzMCA4MFoiIGZpbGw9IiNkYzI2MjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9InNlcmlmIiBmaWxsPSJ3aGl0ZSI+TUxCTDwvdGV4dD48L3N2Zz4=";

// --- DATA IMPORTED FROM SPREADSHEETS ---
const initialMockUsers = [
    { id: 1, name: 'Admin Ali', roles: ['admin'], teamId: null, email: 'admin@mlbl.org' },
    { id: 2, name: 'Coach Chandler (OH10)', roles: ['coach'], teamId: 'oh10-lacrosse', email: 'cschrudder23@gmail.com' },
    { id: 3, name: 'Player Pat (Dayton)', roles: ['player'], teamId: 'dayton-eagles', email: 'pat@test.com' },
    { id: 4, name: 'Coach Dave (Dads)', roles: ['coach'], teamId: 'american-dads', email: 'dave@test.com' },
];

const initialTeams = [
    { id: 'oh10-lacrosse', name: 'OH10 Lacrosse', logo: 'https://lh3.googleusercontent.com/d/12Piww7Y46hHbAbnDZwxsFDBfuSKbq2RR', wins: 4, losses: 2, ties: 0, pf: 65, pa: 59, contactEmail: 'cschrudder23@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#ff0000', backgroundColor: '#fef2f2' } },
    { id: 'american-dads', name: 'American Dads', logo: 'https://lh3.googleusercontent.com/d/1_YssV72EQ9Y3gtXzjM8S0eAJCGQMFpJ6', wins: 4, losses: 0, ties: 0, pf: 56, pa: 10, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#1d4ed8', backgroundColor: '#eff6ff' } },
    { id: 'indiana-lacers', name: 'Indiana Lacers', logo: 'https://lh3.googleusercontent.com/d/1grpa4h9wlU21hDZGMYjiWUZOHQEttN1U', wins: 4, losses: 3, ties: 0, pf: 55, pa: 63, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#047857', backgroundColor: '#ecfdf5' } },
    { id: 'cincinnati-trash-pandas', name: 'Cincinnati Trash Pandas', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 2, losses: 1, ties: 0, pf: 21, pa: 25, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#4b5563', backgroundColor: '#f3f4f6' } },
    { id: 'columbus-ball-hawgs', name: 'Columbus Ball Hawgs', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 1, losses: 0, ties: 0, pf: 17, pa: 7, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#f59e0b', backgroundColor: '#fffbeb' } },
    { id: 'indy-sabers', name: 'Indy Sabers', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 1, losses: 4, ties: 0, pf: 40, pa: 48, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#be185d', backgroundColor: '#fdf2f8' } },
    { id: 'dayton-eagles', name: 'Dayton Eagles', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 0, losses: 6, ties: 0, pf: 37, pa: 79, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], style: { bannerUrl: '', primaryColor: '#581c87', backgroundColor: '#f5f3ff' } },
];

const initialPlayersList = [
    { id: 1, firstName: 'Chandler', lastName: 'Schrudder', nickname: 'Chan', email: 'cschrudder23@gmail.com', phone: '555-0101', number: 10, positions: ['Attack'], teams: ['oh10-lacrosse'], photo: `https://placehold.co/200x200/ff0000/FFFFFF?text=CS`, active: true },
    { id: 2, firstName: 'John', lastName: 'Smith', nickname: 'Dad', email: 'j.smith@example.com', phone: '555-0102', number: 22, positions: ['Defense'], teams: ['american-dads'], photo: `https://placehold.co/200x200/1d4ed8/FFFFFF?text=JS`, active: true },
    { id: 3, firstName: 'Mike', lastName: 'Miller', nickname: 'Lacer', email: 'm.miller@example.com', phone: '555-0103', number: 15, positions: ['Middie'], teams: ['indiana-lacers'], photo: `https://placehold.co/200x200/047857/FFFFFF?text=MM`, active: true },
    { id: 4, firstName: 'Alex', lastName: 'Williams', nickname: 'Panda', email: 'a.williams@example.com', phone: '555-0104', number: 7, positions: ['Goalie'], teams: ['cincinnati-trash-pandas'], photo: `https://placehold.co/200x200/4b5563/FFFFFF?text=AW`, active: true },
    { id: 5, firstName: 'Brian', lastName: 'Davis', nickname: 'Hawg', email: 'b.davis@example.com', phone: '555-0105', number: 99, positions: ['Attack'], teams: ['columbus-ball-hawgs'], photo: `https://placehold.co/200x200/f59e0b/FFFFFF?text=BD`, active: true },
    { id: 6, firstName: 'Kevin', lastName: 'Brown', nickname: 'Saber', email: 'k.brown@example.com', phone: '555-0106', number: 1, positions: ['Defense'], teams: ['indy-sabers'], photo: `https://placehold.co/200x200/be185d/FFFFFF?text=KB`, active: true },
    { id: 7, firstName: 'Tom', lastName: 'Wilson', nickname: 'Eagle', email: 't.wilson@example.com', phone: '555-0107', number: 23, positions: ['Middie'], teams: ['dayton-eagles'], photo: `https://placehold.co/200x200/581c87/FFFFFF?text=TW`, active: false },
];

const initialGameTickerData = [
    { id: 1, homeTeam: 'oh10-lacrosse', awayTeam: 'american-dads', homeScore: 3, awayScore: 16, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 2, homeTeam: 'dayton-eagles', awayTeam: 'cincinnati-trash-pandas', homeScore: 5, awayScore: 10, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 3, homeTeam: 'indiana-lacers', awayTeam: 'american-dads', homeScore: 0, awayScore: 14, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 4, homeTeam: 'indy-sabers', awayTeam: 'cincinnati-trash-pandas', homeScore: 7, awayScore: 9, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 5, homeTeam: 'columbus-ball-hawgs', awayTeam: 'dayton-eagles', homeScore: 17, awayScore: 7, location: 'Columbus', type: 'League Game', tournamentName: null, status: 'Final' },
];

const initialLeagueSchedule = [
    { date: '2025-08-09', games: [ 
        { id: 1, home: 'oh10-lacrosse', away: 'american-dads', time: '1:00 PM', location: 'Dayton' },
        { id: 2, home: 'dayton-eagles', away: 'cincinnati-trash-pandas', time: '2:00 PM', location: 'Dayton' },
        { id: 3, home: 'indiana-lacers', away: 'american-dads', time: '3:00 PM', location: 'Dayton' },
    ] },
    { date: '2025-08-02', games: [ 
        { id: 6, home: 'indiana-lacers', away: 'oh10-lacrosse', time: '6:00 PM', location: 'Indy' },
        { id: 7, home: 'indy-sabers', away: 'dayton-eagles', time: '7:00 PM', location: 'Indy' },
    ] },
     { date: '2025-07-10', games: [ { id: 8, home: 'columbus-ball-hawgs', away: 'dayton-eagles', time: '7:00 PM', location: 'Columbus' } ] },
];

const newsFeed = [
    { id: 1, title: 'American Dads Dominate Dayton Classic', date: '2025-08-10', snippet: 'The American Dads team swept the competition at the Dayton Classic tournament this past weekend, securing the championship with a decisive 13-5 victory...' },
    { id: 2, title: 'Indy Gauntlet Tournament Recap', date: '2025-08-03', snippet: 'OH10 and the Indy Lacers came out on top in a hard-fought weekend of lacrosse at the Indy Gauntlet tournament...' },
];

// --- Helper Components ---
const GameTicker = ({teams, gameTickerData, onTeamClick}) => {
    const getTeam = (id) => teams.find(t => t.id === id);
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement) return;

        let animationFrameId;

        const scroll = () => {
            if (!isHovering) {
                tickerElement.scrollLeft -= 1; // Scroll right to left
                if (tickerElement.scrollLeft <= 0) {
                    tickerElement.scrollLeft = tickerElement.scrollWidth / 2;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };
        
        animationFrameId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovering]);
    
    return (
        <div 
            className="bg-slate-800 text-white py-2 overflow-hidden shadow-lg"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div ref={tickerRef} className="flex space-x-6 overflow-x-auto no-scrollbar">
                {[...gameTickerData, ...gameTickerData].map((game, index) => {
                    const home = getTeam(game.homeTeam);
                    const away = getTeam(game.awayTeam);
                    if (!home || !away) return null;
                    return (
                        <div key={index} className="flex-shrink-0 w-72 bg-slate-700 rounded-lg p-2 border border-slate-600">
                            <div className="text-xs text-slate-400 mb-1 flex justify-between">
                                <span>{game.location}</span>
                                <span className={`font-bold text-xs ${game.type === 'Tournament' ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {game.type === 'Tournament' ? game.tournamentName : 'Regular Season'}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <button onClick={() => onTeamClick(home.id)} className="flex items-center gap-2 hover:opacity-80">
                                        <img src={home.logo} alt={home.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                        <span className="font-medium">{home.name}</span>
                                    </button>
                                    <span className="font-bold text-lg">{game.homeScore ?? '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <button onClick={() => onTeamClick(away.id)} className="flex items-center gap-2 hover:opacity-80">
                                        <img src={away.logo} alt={away.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                        <span className="font-medium">{away.name}</span>
                                    </button>
                                    <span className="font-bold text-lg">{game.awayScore ?? '-'}</span>
                                </div>
                            </div>
                             <div className="text-center text-xs font-bold text-green-400 mt-1 tracking-wider">{game.status}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md text-center ${color}`}>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
);

const PlayerCard = ({ player, teamStyle }) => (
    <div
        className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 border-4"
        style={{ borderColor: teamStyle?.primaryColor || '#cccccc' }}
    >
        <div className="relative w-full h-48 bg-slate-200 flex items-center justify-center">
            <img src={player.photo} alt={`${player.firstName} ${player.lastName}`} className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Player'; }} />
            <div
                className="absolute bottom-0 right-0 px-3 py-1 rounded-tl-lg"
                style={{ backgroundColor: teamStyle?.primaryColor ? `${teamStyle.primaryColor}e6` : 'rgba(0,0,0,0.75)' }} // Add some transparency
            >
                <p className="text-white text-2xl font-bold tracking-tighter">#{player.number}</p>
            </div>
        </div>
        <div className="p-4">
            <h3 className="text-xl font-bold text-slate-800">{player.firstName} "{player.nickname}" {player.lastName}</h3>
            <div className="flex justify-between items-center mt-2">
                <p
                    className="text-sm font-semibold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: teamStyle?.primaryColor || '#475569' }}
                >
                    {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                </p>
            </div>
        </div>
    </div>
);

const ContactCard = ({ entity }) => {
    const [messageSent, setMessageSent] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`Message sent to ${entity.name}`);
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 3000);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact {entity.name}</h2>
            {messageSent ? (
                <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">Message Sent!</div>
            ) : (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Your Name" className="w-full p-2 border rounded" required />
                    <input type="email" placeholder="Your Email" className="w-full p-2 border rounded" required />
                    <textarea placeholder="Your Message" rows="4" className="w-full p-2 border rounded" required></textarea>
                    <button type="submit" className="w-full bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Send Message</button>
                </form>
            )}
        </div>
    );
};

const SocialCard = ({ entity }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Follow Us</h2>
        <div className="flex space-x-6 justify-center">
            <a href={entity.social.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors"><Twitter size={32} /></a>
            <a href={entity.social.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition-colors"><Instagram size={32} /></a>
            <a href={entity.social.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors"><Facebook size={32} /></a>
        </div>
    </div>
);

// --- Page Components ---
const HomePage = ({teams, leagueSchedule, onTeamClick}) => {
    const [selectedTeamSchedule, setSelectedTeamSchedule] = useState('all');
    const getTeam = (id) => teams.find(t => t.id === id);
    const filteredSchedule = leagueSchedule.map(day => {
        if (selectedTeamSchedule === 'all') return day;
        const games = day.games.filter(g => g.home === selectedTeamSchedule || g.away === selectedTeamSchedule);
        return { ...day, games };
    }).filter(day => day.games.length > 0);
    
    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">League Schedule</h1>
                <div className="mb-4">
                    <select onChange={(e) => setSelectedTeamSchedule(e.target.value)} value={selectedTeamSchedule} className="p-2 border border-slate-300 rounded-md shadow-sm">
                        <option value="all">All Teams</option>
                        {teams.filter(t => t.active).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                </div>
                <div className="space-y-6">
                    {filteredSchedule.map(day => (
                        <div key={day.date}>
                            <h2 className="text-xl font-semibold text-slate-700 pb-2 border-b-2 border-red-800 mb-3">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                            </h2>
                            <div className="space-y-4">
                                {day.games.map((game) => {
                                    const home = getTeam(game.home);
                                    const away = getTeam(game.away);
                                    if (!home || !away) return null;
                                    return (
                                        <div key={game.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                                            <div className="flex items-center">
                                                <button onClick={() => onTeamClick(away.id)} className="text-center w-32 hover:opacity-80">
                                                    <img src={away.logo} alt={away.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1"/>
                                                    <p className="font-bold text-sm mt-1">{away.name}</p>
                                                </button>
                                                <span className="text-2xl font-bold text-slate-400 mx-4">@</span>
                                                <button onClick={() => onTeamClick(home.id)} className="text-center w-32 hover:opacity-80">
                                                    <img src={home.logo} alt={home.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1"/>
                                                    <p className="font-bold text-sm mt-1">{home.name}</p>
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{game.time}</p>
                                                <p className="text-sm text-slate-500">{game.location}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-1">
                <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">Latest News</h1>
                <div className="space-y-4">
                    {newsFeed.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                            <p className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                            <h3 className="text-lg font-bold text-slate-800 hover:text-red-800 cursor-pointer">{item.title}</h3>
                            <p className="text-slate-600 mt-1">{item.snippet}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LeagueContactPage = ({ websiteStyle, leagueInfo }) => (
    <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <img src={websiteStyle.logoUrl} alt="MLBL Logo" className="h-40 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{leagueInfo.name}</h1>
            </div>
            <ContactCard entity={leagueInfo} />
        </div>
    </div>
);

const StandingsPage = ({teams, onTeamClick}) => {
    const sortedTeams = [...teams].filter(t => t.active).sort((a, b) => {
        const scoreA = a.wins * 2 + a.ties;
        const scoreB = b.wins * 2 + b.ties;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.pf - b.pa) - (a.pf - a.pa);
    });
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-6 tracking-tight">League Standings</h1>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6 text-left">Team</th>
                            <th className="py-3 px-6 text-center">W</th><th className="py-3 px-6 text-center">L</th><th className="py-3 px-6 text-center">T</th>
                            <th className="py-3 px-6 text-center">PF</th><th className="py-3 px-6 text-center">PA</th><th className="py-3 px-6 text-center">DIFF</th>
                            <th className="py-3 px-6 text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm font-light">
                        {sortedTeams.map(team => {
                            const differential = team.pf - team.pa;
                            const score = team.wins * 2 + team.ties;
                            return (
                                <tr key={team.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <button onClick={() => onTeamClick(team.id)} className="flex items-center hover:opacity-80">
                                            <img src={team.logo} alt={team.name} className="w-8 h-8 mr-3 rounded-full bg-white p-1" />
                                            <span className="font-medium">{team.name}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-6 text-center">{team.wins}</td><td className="py-3 px-6 text-center">{team.losses}</td><td className="py-3 px-6 text-center">{team.ties}</td>
                                    <td className="py-3 px-6 text-center text-green-600 font-semibold">{team.pf}</td><td className="py-3 px-6 text-center text-red-600 font-semibold">{team.pa}</td>
                                    <td className={`py-3 px-6 text-center font-semibold ${differential > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {differential > 0 ? `+${differential}` : differential}
                                    </td>
                                    <td className="py-3 px-6 text-center font-bold text-red-800">{score}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TeamDetailPage = ({ teamId, teams, players, leagueSchedule, currentUser, setPlayers, setTeams }) => {
    const team = teams.find(t => t.id === teamId);
    const teamPlayers = players.filter(p => p.teams.includes(teamId) && p.active);
    const [activeTab, setActiveTab] = useState('roster');
    const getTeam = (id) => teams.find(t => t.id === id);
    const isAuthorizedToManage = currentUser && (
        currentUser.roles.includes('admin') || 
        ((currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) && currentUser.teamId === teamId)
    );
    const teamSchedule = leagueSchedule.map(day => ({
        ...day,
        games: day.games.filter(g => g.home === teamId || g.away === teamId)
    })).filter(day => day.games.length > 0);

    if (!team) return <div className="p-8 text-center text-red-500">Team not found!</div>;

    const handleSocialSave = (newSocial) => {
        setTeams(prevTeams => prevTeams.map(t =>
            t.id === teamId ? { ...t, social: newSocial } : t
        ));
    };

    const TeamTab = ({tabName, label, isManagerTab = false}) => {
        if (isManagerTab && !isAuthorizedToManage) return null;
        return (
            <button 
                onClick={() => setActiveTab(tabName)} 
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tabName ? 'text-slate-800' : 'text-slate-500 border-transparent hover:border-slate-300'}`}
                style={{ borderColor: activeTab === tabName ? (team.style?.primaryColor || '#dc2626') : 'transparent' }}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="p-4 md:p-8">
            <div 
                className="bg-cover bg-center h-48 rounded-lg mb-6 flex items-end p-4 shadow-inner" 
                style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${team.style?.bannerUrl || 'https://placehold.co/1200x400/4A5568/FFFFFF?text=MLBL'})` }}
            >
                <div className="flex items-center">
                    <img src={team.logo} alt={team.name} className="w-24 h-24 mr-4 rounded-full bg-white p-2 shadow-lg" />
                    <div>
                        <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg">{team.name}</h1>
                    </div>
                </div>
            </div>
            <div className="flex border-b mb-6">
                <TeamTab tabName="roster" label="Roster & Stats" />
                <TeamTab tabName="schedule" label="Schedule" />
                <TeamTab tabName="media" label="Photos & Videos" />
                <TeamTab tabName="social" label="Social" />
                <TeamTab tabName="contact" label="Contact" />
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: team.style?.backgroundColor || 'transparent' }}>
                {activeTab === 'roster' && (
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <StatCard title="Wins" value={team.wins} color="text-green-500" />
                            <StatCard title="Losses" value={team.losses} color="text-red-500" />
                            <StatCard title="Points For" value={team.pf} color="text-slate-600" />
                            <StatCard title="Points Against" value={team.pa} color="text-orange-500" />
                        </div>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Roster</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {teamPlayers.map(player => <PlayerCard key={player.id} player={player} teamStyle={team.style} />)}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'schedule' && (
                     <div className="space-y-6">
                        {teamSchedule.map(day => (
                            <div key={day.date}>
                                <h2 className="text-xl font-semibold text-slate-700 pb-2 border-b-2 border-red-800 mb-3">
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </h2>
                                <div className="space-y-4">
                                    {day.games.map((game) => {
                                        const home = getTeam(game.home);
                                        const away = getTeam(game.away);
                                        if (!home || !away) return null;
                                        return (
                                            <div key={game.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="text-center w-32">
                                                        <img src={away.logo} alt={away.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1"/>
                                                        <p className="font-bold text-sm mt-1">{away.name}</p>
                                                    </div>
                                                    <span className="text-2xl font-bold text-slate-400 mx-4">@</span>
                                                    <div className="text-center w-32">
                                                        <img src={home.logo} alt={home.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1"/>
                                                        <p className="font-bold text-sm mt-1">{home.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{game.time}</p>
                                                    <p className="text-sm text-slate-500">{game.location}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'media' && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Media Gallery</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {team.media.length > 0 ? team.media.map(item => (
                                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    {item.type === 'photo' ? (
                                        <img src={item.url} alt={item.caption} className="w-full h-auto object-cover"/>
                                    ) : (
                                        <div className="aspect-w-16 aspect-h-9">
                                            <iframe src={item.url} title={item.caption} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                                        </div>
                                    )}
                                    <p className="p-3 text-slate-600 text-sm">{item.caption}</p>
                                </div>
                            )) : <p>No media has been added for this team yet.</p>}
                        </div>
                    </div>
                )}
                
                {activeTab === 'social' && ( <div className="max-w-2xl mx-auto"> <SocialCard entity={team} /> </div> )}
                {activeTab === 'contact' && ( <div className="max-w-2xl mx-auto"> <ContactCard entity={team} /> </div> )}
            </div>
        </div>
    );
};

const ChatPage = ({ currentUser }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Welcome to the league chat!', displayName: 'System', timestamp: new Date() },
        { id: 2, text: 'Great game last weekend!', displayName: 'Coach Mike', timestamp: new Date() }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [channel, setChannel] = useState('league');
    const messagesEndRef = useRef(null);
    
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;
        
        const message = {
            id: Date.now(),
            text: newMessage,
            timestamp: new Date(),
            displayName: currentUser.name,
            uid: currentUser.id
        };
        
        setMessages(prev => [...prev, message]);
        setNewMessage('');
    };

    return (
        <div className="p-4 md:p-8 flex flex-col h-full">
            <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">League Chat</h1>
            <div className="flex border rounded-lg shadow-md bg-white flex-grow">
                <div className="w-1/4 border-r bg-slate-50">
                    <div className="p-4 font-bold text-lg border-b">Channels</div>
                    <ul>
                        {['league', 'falcons', 'bears'].map(ch => (
                            <li key={ch} className={`p-4 cursor-pointer hover:bg-slate-200 ${channel === ch ? 'bg-red-100 font-semibold' : ''}`} onClick={() => setChannel(ch)}>
                                # {ch.charAt(0).toUpperCase() + ch.slice(1)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-3/4 flex flex-col">
                    <div className="flex-grow p-4 overflow-y-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex mb-4 ${msg.uid === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-lg ${msg.uid === currentUser?.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                    <p className="font-bold text-sm">{msg.displayName}</p>
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-75 mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-slate-100 border-t">
                        <form onSubmit={handleSendMessage} className="flex">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Message in #${channel}`} className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-800" />
                            <button type="submit" className="bg-red-800 text-white px-4 rounded-r-lg hover:bg-red-900">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN COMPONENTS ---
const PlayerForm = ({ initialPlayer, onSave, onCancel, managedTeams, isAdmin }) => {
    const [player, setPlayer] = useState(initialPlayer);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPlayer(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handlePositionChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setPlayer(prev => ({ ...prev, positions: selectedOptions }));
    };

    const handleTeamChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setPlayer(prev => ({ ...prev, teams: selectedOptions }));
    };
    
    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setPlayer(prev => ({...prev, photo: fileUrl}));
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(player);
    };
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-4">{player?.id ? 'Edit Player' : 'Add New Player'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="firstName" value={player.firstName || ''} onChange={handleChange} placeholder="First Name" className="w-full p-2 border rounded" required />
                        <input type="text" name="lastName" value={player.lastName || ''} onChange={handleChange} placeholder="Last Name" className="w-full p-2 border rounded" required />
                        <input type="text" name="nickname" value={player.nickname || ''} onChange={handleChange} placeholder="Nickname" className="w-full p-2 border rounded" />
                        <input type="email" name="email" value={player.email || ''} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
                        <input type="tel" name="phone" value={player.phone || ''} onChange={handleChange} placeholder="Cell Phone" className="w-full p-2 border rounded" />
                        <input type="number" name="number" value={player.number || ''} onChange={handleChange} placeholder="Player #" className="w-full p-2 border rounded" />
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team(s)</label>
                                <select multiple name="teams" value={player.teams || []} onChange={handleTeamChange} className="w-full p-2 border rounded h-24" required>
                                    {managedTeams.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position(s)</label>
                            <select multiple value={player.positions || []} onChange={handlePositionChange} className="w-full p-2 border rounded h-24" required>
                                <option>Attack</option><option>Middie</option><option>Defense</option><option>Goalie</option>
                            </select>
                             <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Player Photo</label>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="active" id="active" checked={player.active} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Player</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const PlayerManager = ({ players, setPlayers, teams, currentUser }) => {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const isAdmin = currentUser.roles.includes('admin');
    
    const managedTeams = isAdmin
        ? teams 
        : teams.filter(t => t.id === currentUser.teamId);
    const [managedTeamId, setManagedTeamId] = useState(isAdmin ? 'all' : currentUser.teamId);

    const handleSave = (playerToSave) => {
        if (playerToSave.id) {
             setPlayers(prevPlayers => prevPlayers.map(p => p.id === playerToSave.id ? playerToSave : p));
        } else {
            const newPlayer = { ...playerToSave, id: Date.now() };
            setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
        }
        setEditingPlayer(null);
    };
    const teamRoster = managedTeamId === 'all' 
        ? players 
        : players.filter(p => p.teams.includes(managedTeamId));
    return (
        <div>
            {editingPlayer && <PlayerForm 
                initialPlayer={editingPlayer} 
                onSave={handleSave} 
                onCancel={() => setEditingPlayer(null)} 
                managedTeams={managedTeams} 
                isAdmin={isAdmin}
            />}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label htmlFor="team-select" className="mr-2 font-semibold">Manage Roster for:</label>
                    <select id="team-select" value={managedTeamId} onChange={e => setManagedTeamId(e.target.value)} className="p-2 border rounded-md">
                        {isAdmin && <option value="all">All Players</option>}
                        {managedTeams.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <button onClick={() => setEditingPlayer({firstName: '', lastName: '', nickname: '', email: '', phone: '', number: '', positions: [], teams: [managedTeamId === 'all' ? managedTeams[0].id : managedTeamId], photo: '', active: true})} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"><Plus className="mr-2 h-4 w-4"/> Add Player</button>
            </div>
            <ul className="mt-4 space-y-2">
                {teamRoster.map(p => (
                    <li key={p.id} className={`flex items-center p-3 border rounded-lg bg-white shadow-sm ${!p.active && 'opacity-50 bg-slate-100'}`}>
                        <span className="flex-grow">{p.firstName} {p.lastName} (#{p.number}) - {Array.isArray(p.positions) ? p.positions.join(', ') : p.positions}</span>
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => setEditingPlayer(p)} className="text-slate-500 hover:text-slate-700 mr-2 p-1"><Edit size={18}/></button>
                            <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TeamManager = ({ teams, setTeams }) => {
    const [editingTeam, setEditingTeam] = useState(null);
    const handleSave = (e) => {
        e.preventDefault();
        if (editingTeam.id) {
            setTeams(teams.map(t => t.id === editingTeam.id ? editingTeam : t));
        } else {
            setTeams([...teams, { ...editingTeam, id: editingTeam.name.toLowerCase().replace(/\s/g, ''), wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, active: true, media: [], calendar: [] }]);
        }
        setEditingTeam(null);
    };
    const toggleActive = (team) => {
        setTeams(teams.map(t => t.id === team.id ? {...t, active: !t.active} : t));
    };

    const TeamForm = () => (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">{editingTeam?.id ? 'Edit Team' : 'Add New Team'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="text" value={editingTeam.name || ''} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} placeholder="Team Name" className="w-full p-2 border rounded" required />
                    <input type="text" value={editingTeam.logo || ''} onChange={e => setEditingTeam({...editingTeam, logo: e.target.value})} placeholder="Logo Image URL" className="w-full p-2 border rounded" required />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setEditingTeam(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Team</button>
                    </div>
                </form>
            </div>
        </div>
    );
    return (
        <div>
            {editingTeam && <TeamForm />}
            <div className="flex justify-end mb-4">
                <button onClick={() => setEditingTeam({name: '', logo: ''})} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"><Plus className="mr-2 h-4 w-4"/> Add Team</button>
            </div>
             <ul className="mt-4 space-y-2">
                {teams.map(t => (
                    <li key={t.id} className={`flex items-center p-3 border rounded-lg bg-white shadow-sm ${!t.active && 'opacity-50 bg-slate-100'}`}>
                        <div className="flex-grow flex items-center gap-3">
                            <img src={t.logo} alt={t.name} className="w-8 h-8 rounded-full bg-white p-1" />
                            <span className="font-semibold">{t.name}</span>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => toggleActive(t)} className={`mr-2 p-1 ${t.active ? 'text-green-500' : 'text-slate-500'}`}>
                                {t.active ? <ToggleRight size={22}/> : <ToggleLeft size={22} />}
                            </button>
                            <button onClick={() => setEditingTeam(t)} className="text-slate-500 hover:text-slate-700 mr-2 p-1"><Edit size={18}/></button>
                            <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ScoreManager = ({ leagueSchedule, gameTickerData, setGameTickerData, teams }) => {
    const [scores, setScores] = useState({});
    const handleScoreChange = (gameId, team, value) => {
        setScores(prev => ({ ...prev, [gameId]: { ...prev[gameId], [team]: value } }));
    };

    const handleSaveScore = (game) => {
        const gameId = game.id;
        const homeScore = parseInt(scores[gameId]?.home, 10);
        const awayScore = parseInt(scores[gameId]?.away, 10);
        if (isNaN(homeScore) || isNaN(awayScore)) {
            alert("Please enter valid scores for both teams.");
            return;
        }
        
        setGameTickerData(prevData => prevData.map(g => 
            g.id === gameId ? { ...g, homeScore, awayScore, status: 'Final' } : g
        ));
    };

    const getTeam = (id) => teams.find(t => t.id === id);
    return (
        <div>
            {leagueSchedule.map(day => (
                <div key={day.date} className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 pb-2 border-b mb-3">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    {day.games.map(game => {
                        const gameData = gameTickerData.find(g => g.id === game.id);
                        const home = getTeam(game.home);
                        const away = getTeam(game.away);
                        if (!home || !away) return null;

                        return (
                            <div key={game.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex-grow">
                                    <span className="font-semibold">{home.name}</span> vs <span className="font-semibold">{away.name}</span>
                                    <span className="text-sm text-slate-500 ml-2">({game.location})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder={home.logo} className="w-16 p-1 border rounded text-center" disabled={gameData?.status === 'Final'} defaultValue={gameData?.homeScore} onChange={e => handleScoreChange(game.id, 'home', e.target.value)} />
                                    <span>-</span>
                                    <input type="number" placeholder={away.logo} className="w-16 p-1 border rounded text-center" disabled={gameData?.status === 'Final'} defaultValue={gameData?.awayScore} onChange={e => handleScoreChange(game.id, 'away', e.target.value)} />
                                    {gameData?.status !== 'Final' ? (
                                        <button onClick={() => handleSaveScore(game)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Save</button>
                                    ) : (
                                        <span className="text-sm font-bold text-green-600 px-3">FINAL</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const UserManager = ({ users, setUsers, teams }) => {
    const [editingUser, setEditingUser] = useState(null);
    const handleSave = (e) => {
        e.preventDefault();
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };
    const handleRoleChange = (role, checked) => {
        const currentRoles = editingUser.roles || [];
        if (checked) {
            setEditingUser({...editingUser, roles: [...currentRoles, role]});
        } else {
            setEditingUser({...editingUser, roles: currentRoles.filter(r => r !== role)});
        }
    };

    const UserForm = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">Edit User: {editingUser.name}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block font-semibold mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['player', 'coach', 'player/coach', 'admin'].map(role => (
                               <label key={role} className="flex items-center space-x-2">
                                   <input type="checkbox" checked={editingUser.roles.includes(role)} onChange={e => handleRoleChange(role, e.target.checked)} />
                                   <span className="capitalize">{role}</span>
                               </label>
                           ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-semibold">Team</label>
                        <select value={editingUser.teamId || ''} onChange={e => setEditingUser({...editingUser, teamId: e.target.value})} className="w-full p-2 border rounded">
                            <option value="">(No Team)</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setEditingUser(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
    return (
        <div>
            {editingUser && <UserForm />}
            <ul className="mt-4 space-y-2">
                {users.map(user => (
                    <li key={user.id} className="flex items-center p-3 border rounded-lg bg-white shadow-sm">
                        <div className="flex-grow">
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <div className="flex-shrink-0 ml-4 flex items-center gap-4">
                            <span className={`font-semibold capitalize px-2 py-1 rounded-full text-xs ${user.roles.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {user.roles.length > 0 ? user.roles.join(', ') : 'Unassigned'}
                            </span>
                            <button onClick={() => setEditingUser(user)} className="text-slate-500 hover:text-slate-700 p-1"><Edit size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TeamStyleManager = ({ teams, setTeams, currentUser }) => {
    const [selectedTeamId, setSelectedTeamId] = useState(
        currentUser.roles.includes('admin') ? teams[0]?.id : currentUser.teamId
    );
    const [style, setStyle] = useState({});
    const [saved, setSaved] = useState(false);

    // Filter teams based on user role
    const availableTeams = currentUser.roles.includes('admin') 
        ? teams 
        : teams.filter(t => t.id === currentUser.teamId);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    // Initialize style when team changes
    React.useEffect(() => {
        if (selectedTeam) {
            setStyle(selectedTeam.style || {
                bannerUrl: '',
                primaryColor: '#dc2626',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontFamily: 'Inter, sans-serif'
            });
        }
    }, [selectedTeam]);

    const handleSave = (e) => {
        e.preventDefault();
        setTeams(prevTeams => prevTeams.map(team => 
            team.id === selectedTeamId ? { ...team, style } : team
        ));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleImageUpload = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setStyle(prev => ({...prev, [field]: fileUrl}));
        }
    };

    if (!selectedTeam) return <div>No team found.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {currentUser.roles.includes('admin') && (
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Select Team</label>
                        <select 
                            value={selectedTeamId} 
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg"
                        >
                            {availableTeams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6 bg-slate-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-slate-800">Style Controls</h3>
                    
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Team Logo</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'logoUrl')}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        {selectedTeam.logo && (
                            <img src={selectedTeam.logo} alt="Current Logo" className="w-16 h-16 mt-2 rounded-full border" />
                        )}
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Team Banner</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'bannerUrl')}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Primary Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.primaryColor }}
                                >
                                    <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        {style.primaryColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.primaryColor}
                                    onChange={(e) => setStyle(prev => ({...prev, primaryColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Background Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.backgroundColor }}
                                >
                                    <span className="text-slate-700 font-semibold text-sm bg-white bg-opacity-75 px-2 py-1 rounded">
                                        {style.backgroundColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.backgroundColor}
                                    onChange={(e) => setStyle(prev => ({...prev, backgroundColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Text Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3 bg-white"
                                >
                                    <span 
                                        className="font-semibold text-sm px-2 py-1 rounded"
                                        style={{ color: style.textColor }}
                                    >
                                        {style.textColor} Sample Text
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.textColor}
                                    onChange={(e) => setStyle(prev => ({...prev, textColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Font Family</label>
                            <select 
                                value={style.fontFamily}
                                onChange={(e) => setStyle(prev => ({...prev, fontFamily: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg"
                            >
                                <option value="Inter, sans-serif">Inter (Default)</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="'Oswald', sans-serif">Oswald (Sports)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end items-center space-x-4">
                        {saved && <span className="text-green-600 font-semibold">✓ Saved!</span>}
                        <button 
                            type="submit" 
                            className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 font-semibold"
                        >
                            Save Team Style
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden shadow-lg">
                    <div 
                        className="h-32 bg-cover bg-center flex items-end p-4 relative"
                        style={{ 
                            backgroundImage: style.bannerUrl ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${style.bannerUrl})` : `linear-gradient(45deg, ${style.primaryColor}, ${style.primaryColor}dd)`,
                            fontFamily: style.fontFamily
                        }}
                    >
                        <div className="flex items-center">
                            <img 
                                src={selectedTeam.logo} 
                                alt={selectedTeam.name} 
                                className="w-16 h-16 mr-3 rounded-full bg-white p-1 shadow-lg" 
                            />
                            <h2 className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: style.fontFamily }}>
                                {selectedTeam.name}
                            </h2>
                        </div>
                    </div>
                    <div className="p-4" style={{ backgroundColor: style.backgroundColor, fontFamily: style.fontFamily }}>
                        <div className="flex mb-4 border-b">
                            <button 
                                className="px-4 py-2 font-semibold border-b-2 transition-colors"
                                style={{ 
                                    borderColor: style.primaryColor, 
                                    color: style.primaryColor,
                                    fontFamily: style.fontFamily 
                                }}
                            >
                                Active Tab
                            </button>
                            <button 
                                className="px-4 py-2 font-semibold text-slate-500 border-b-2 border-transparent"
                                style={{ fontFamily: style.fontFamily }}
                            >
                                Inactive Tab
                            </button>
                        </div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                            Roster & Stats
                        </h4>
                        <p className="mb-4" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                            This is how your team page will look with the selected colors and fonts.
                        </p>
                        <button 
                            className="px-4 py-2 text-white rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: style.primaryColor, fontFamily: style.fontFamily }}
                        >
                            Example Button
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WebsiteStyleManager = ({ websiteStyle, setWebsiteStyle }) => {
    const [style, setStyle] = useState(websiteStyle);
    const [saved, setSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setWebsiteStyle(style);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleLogoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setStyle(prev => ({...prev, logoUrl: fileUrl}));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <form onSubmit={handleSave} className="space-y-6 bg-slate-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-slate-800">Global Website Style</h3>
                    
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Site Logo</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload} 
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        {style.logoUrl && (
                            <img src={style.logoUrl} alt="Site Logo" className="h-16 mt-2 border rounded" />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Primary Color (Sidebar)</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.primaryColor }}
                                >
                                    <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        {style.primaryColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.primaryColor} 
                                    onChange={(e) => setStyle(prev => ({...prev, primaryColor: e.target.value}))} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Accent Color (Highlights)</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.accentColor }}
                                >
                                    <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        {style.accentColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.accentColor} 
                                    onChange={(e) => setStyle(prev => ({...prev, accentColor: e.target.value}))} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center space-x-4">
                        {saved && <span className="text-green-600 font-semibold">✓ Saved!</span>}
                        <button 
                            type="submit" 
                            className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 font-semibold"
                        >
                            Save Website Style
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden shadow-lg bg-slate-100">
                    <aside 
                        className="text-white w-full py-6 px-4 space-y-4" 
                        style={{ backgroundColor: style.primaryColor }}
                    >
                        <div className="flex items-center justify-center border-b border-white border-opacity-20 pb-4">
                            <img src={style.logoUrl} alt="Logo" className="h-16" />
                        </div>
                        <nav className="space-y-2">
                            <button 
                                className="w-full flex items-center space-x-3 p-2 rounded-md text-left text-white font-semibold"
                                style={{ backgroundColor: style.accentColor }}
                            >
                                <Home size={20} />
                                <span>Selected Nav Item</span>
                            </button>
                            <button className="w-full flex items-center space-x-3 p-2 rounded-md text-left text-slate-300 hover:text-white">
                                <Users size={20} />
                                <span>Inactive Nav Item</span>
                            </button>
                        </nav>
                    </aside>
                    <div className="p-4 bg-white">
                        <h4 className="text-lg font-bold text-slate-800 mb-2">Main Content Area</h4>
                        <p className="text-slate-600">This preview shows how your website navigation will look with the selected colors.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminPage = ({ teams, setTeams, players, setPlayers, leagueSchedule, gameTickerData, setGameTickerData, currentUser, users, setUsers, websiteStyle, setWebsiteStyle, leagueInfo, setLeagueInfo }) => {
    const [activeTab, setActiveTab] = useState(currentUser.roles.includes('admin') ? 'users' : 'players');
    const hasPermission = (requiredRoles) => requiredRoles.some(role => currentUser.roles.includes(role));

    const AdminTab = ({tabName, label, requiredRoles}) => {
        if (!hasPermission(requiredRoles)) return null;
        return (
            <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === tabName ? 'bg-white text-red-800' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                {label}
            </button>
        );
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-6 tracking-tight">
                {currentUser.roles.includes('admin') ? 'Admin Portal' : 'Team Management Portal'}
            </h1>
            <div className="flex border-b border-slate-300 flex-wrap">
                <AdminTab tabName="users" label="User Management" requiredRoles={['admin']} />
                <AdminTab tabName="players" label="Player Management" requiredRoles={['admin', 'coach', 'player/coach']} />
                <AdminTab tabName="teams" label="Team Management" requiredRoles={['admin']} />
                <AdminTab tabName="scores" label="Score Entry" requiredRoles={['admin']} />
                <AdminTab tabName="team_style" label="Team Style" requiredRoles={['admin', 'coach', 'player/coach']} />
                <AdminTab tabName="site_style" label="Site Style" requiredRoles={['admin']} />
            </div>
            <div className="bg-white p-6 rounded-b-lg shadow-md">
                {activeTab === 'users' && hasPermission(['admin']) && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">User Management</h2>
                        <UserManager users={users} setUsers={setUsers} teams={teams} />
                    </div>
                )}
                {activeTab === 'players' && hasPermission(['admin', 'coach', 'player/coach']) && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Player Management</h2>
                        <PlayerManager players={players} setPlayers={setPlayers} teams={teams} currentUser={currentUser} />
                    </div>
                )}
                {activeTab === 'teams' && hasPermission(['admin']) && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Team Management</h2>
                        <TeamManager teams={teams} setTeams={setTeams} />
                    </div>
                )}
                {activeTab === 'scores' && hasPermission(['admin']) && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Score Entry</h2>
                        <ScoreManager leagueSchedule={leagueSchedule} gameTickerData={gameTickerData} setGameTickerData={setGameTickerData} teams={teams} />
                    </div>
                )}
                {activeTab === 'team_style' && hasPermission(['admin', 'coach', 'player/coach']) && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Team Style Management</h2>
                        <TeamStyleManager teams={teams} setTeams={setTeams} currentUser={currentUser} />
                    </div>
                )}
                {activeTab === 'site_style' && hasPermission(['admin']) && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Website Style Management</h2>
                        <WebsiteStyleManager websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} />
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [page, setPage] = useState('home');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 768);
    const [showLogin, setShowLogin] = useState(false);

    const [teams, setTeams] = useState(initialTeams);
    const [players, setPlayers] = useState(initialPlayersList);
    const [gameTickerData, setGameTickerData] = useState(initialGameTickerData);
    const [leagueSchedule, setLeagueSchedule] = useState(initialLeagueSchedule);
    const [users, setUsers] = useState(initialMockUsers);
    const [leagueInfo, setLeagueInfo] = useState({
        name: "Men's Lacrosse Beer League",
        contactEmail: "admin@mlbl.org",
        social: { twitter: '#', instagram: '#', facebook: '#' }
    });
    const [websiteStyle, setWebsiteStyle] = useState({
        logoUrl: MlblLogo,
        primaryColor: '#1e293b', // slate-800
        accentColor: '#991b1b' // red-800
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Call on initial load
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
        setShowLogin(false);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };
    
    const navigate = (targetPage, teamId = null) => {
        setPage(targetPage);
        setSelectedTeam(teamId);
        if (window.innerWidth < 768) setIsMenuOpen(false);
    };

    const handleAdminNav = () => {
        if (!currentUser) return;
        if (currentUser.roles.includes('admin')) {
            navigate('admin');
        } else if (currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) {
            navigate('team', currentUser.teamId);
        }
    };

    const LoginModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-4">Select a Role to Login</h2>
                <div className="space-y-3">
                    {users.filter(u => u.roles.length > 0).map(user => (
                        <button key={user.id} onClick={() => handleLogin(user)} className="w-full text-left p-3 bg-slate-100 hover:bg-red-100 rounded-md flex items-center gap-3">
                           <UserCheck className="text-slate-600" />
                           <div>
                               <p className="font-bold">{user.name}</p>
                               <p className="text-sm text-slate-500 capitalize">{user.roles.join(', ')}</p>
                           </div>
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowLogin(false)} className="w-full mt-4 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300">Cancel</button>
            </div>
        </div>
    );
    
    const NavItem = ({ icon, label, pageName }) => (
        <button onClick={() => navigate(pageName)}
            className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${
                (page === pageName && !selectedTeam)
                    ? 'text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            style={{backgroundColor: (page === pageName && !selectedTeam) ? websiteStyle.accentColor : 'transparent'}}
        >
            {icon}<span>{label}</span>
        </button>
    );
    
    const renderPage = () => {
        let pageComponent;

        if (page === 'team' && selectedTeam) {
            pageComponent = <TeamDetailPage teamId={selectedTeam} teams={teams} players={players} leagueSchedule={leagueSchedule} currentUser={currentUser} setPlayers={setPlayers} setTeams={setTeams} />;
        } else {
            switch (page) {
                case 'home': pageComponent = <HomePage teams={teams} leagueSchedule={leagueSchedule} onTeamClick={(teamId) => navigate('team', teamId)} />; break;
                case 'standings': pageComponent = <StandingsPage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} />; break;
                case 'league_contact': pageComponent = <LeagueContactPage websiteStyle={websiteStyle} leagueInfo={leagueInfo} />; break;
                case 'chat': 
                    pageComponent = currentUser ? <ChatPage currentUser={currentUser} /> : <div className="p-8 text-center"><h2 className="text-2xl font-bold">Access Denied</h2><p>You must be logged in to access the chat.</p></div>;
                    break;
                case 'admin':
                    pageComponent = currentUser && (currentUser.roles.includes('admin') || currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach'))
                        ? <AdminPage teams={teams} setTeams={setTeams} players={players} setPlayers={setPlayers} leagueSchedule={leagueSchedule} gameTickerData={gameTickerData} setGameTickerData={setGameTickerData} currentUser={currentUser} users={users} setUsers={setUsers} websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} leagueInfo={leagueInfo} setLeagueInfo={setLeagueInfo} /> 
                        : <div className="p-8 text-center"><h2 className="text-2xl font-bold">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
                    break;
                default: pageComponent = <HomePage teams={teams} leagueSchedule={leagueSchedule} onTeamClick={(teamId) => navigate('team', teamId)} />;
            }
        }
        return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">{pageComponent}</div>;
    };

    const backgroundStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'%3E%3Cg fill='%23d1d5db' fill-opacity='0.1'%3E%3Cpath d='M12.5 0 L50 37.5 L87.5 0 L100 12.5 L62.5 50 L100 87.5 L87.5 100 L50 62.5 L12.5 100 L0 87.5 L37.5 50 L0 12.5 Z'/%3E%3C/g%3E%3C/svg%3E")`,
    };
    
    return (
        <div className="min-h-screen bg-slate-100">
            {showLogin && <LoginModal />}
            <aside className={`bg-slate-900 text-white w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-30 flex flex-col`} style={{backgroundColor: websiteStyle.primaryColor}}>
                <div className="p-4 border-b border-slate-700 flex items-center justify-center">
                    <img src={websiteStyle.logoUrl} alt="MLBL Logo" className="h-24" />
                </div>
                <nav className="flex-grow">
                    <NavItem icon={<Home size={20} />} label="Home" pageName="home" />
                    <NavItem icon={<Swords size={20} />} label="Standings" pageName="standings" />
                    <NavItem icon={<Mail size={20} />} label="League Contact" pageName="league_contact" />
                    {currentUser && <NavItem icon={<MessageSquare size={20} />} label="Chat" pageName="chat" />}
                    <div className="pt-4 mt-4 border-t border-slate-700">
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Teams</h2>
                       {teams.filter(t => t.active).map(team => (
                           <button
                                key={team.id}
                                onClick={() => navigate('team', team.id)}
                                className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${
                                    page === 'team' && selectedTeam === team.id
                                        ? 'text-white'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                                style={{backgroundColor: (page === 'team' && selectedTeam === team.id) ? websiteStyle.accentColor : 'transparent'}}
                            >
                                <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                <span>{team.name}</span>
                           </button>
                       ))}
                    </div>
                </nav>
                <div className="p-2 border-t border-slate-700">
                   {currentUser && (currentUser.roles.includes('admin') || currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) && 
                    <button onClick={handleAdminNav} className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${page === 'admin' ? 'text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`} style={{backgroundColor: page === 'admin' ? websiteStyle.accentColor : 'transparent'}}>
                        <Crown size={20} /><span>{currentUser.roles.includes('admin') ? 'Admin Portal' : 'Team Admin'}</span>
                    </button>
                   }
                   {currentUser ? (
                       <button onClick={handleLogout} className="flex items-center space-x-3 p-2 rounded-md w-full text-left text-slate-300 hover:text-white" style={{'--hover-bg': websiteStyle.accentColor}}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                           <LogOut size={20} /><span>Log Out ({currentUser.name})</span>
                       </button>
                   ) : (
                       <button onClick={() => setShowLogin(true)} className="flex items-center space-x-3 p-2 rounded-md w-full text-left text-slate-300 hover:bg-slate-700 hover:text-white mt-2">
                           <LogIn size={20} /><span>Player & Staff Login</span>
                       </button>
                   )}
                </div>
            </aside>
            
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isMenuOpen ? 'md:ml-64' : 'ml-0'}`}>
                <header className="sticky top-0 z-20">
                    <div className="text-white p-2 flex justify-between items-center shadow-md" style={{backgroundColor: websiteStyle.primaryColor}}>
                         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md hover:bg-slate-700 text-white">
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className="text-lg font-bold">MLBL</h1>
                        <div className="w-10"></div>
                    </div>
                    <GameTicker teams={teams} gameTickerData={gameTickerData} onTeamClick={(teamId) => navigate('team', teamId)} />
                </header>
                <main className="flex-1 overflow-y-auto" style={backgroundStyle}>
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

export default App;
