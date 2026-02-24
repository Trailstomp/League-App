import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Trash2, Star, Search, RefreshCw, ChevronLeft, Paperclip, Plus, Settings, Inbox, FileText, AlertTriangle, X, Download, Reply, Forward, ChevronDown } from 'lucide-react';
import EmailSettings from './EmailSettings';
import ComposeEmail from './ComposeEmail';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const EmailClient = ({ currentUser }) => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [currentFolder, setCurrentFolder] = useState('INBOX');
    const [folders, setFolders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState('list'); // list | read | compose | settings
    const [composeMode, setComposeMode] = useState(null); // null | new | reply | forward
    const [composeData, setComposeData] = useState({});
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (currentUser) loadAccounts();
    }, [currentUser]);

    const loadAccounts = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/email-client/accounts?user_id=${currentUser.id}`);
            const data = await res.json();
            setAccounts(data.accounts || []);
            if (data.accounts?.length > 0 && !selectedAccount) {
                setSelectedAccount(data.accounts[0]);
            }
        } catch (e) {
            console.error('Error loading accounts:', e);
        }
    };

    useEffect(() => {
        if (selectedAccount) {
            // Serialize: load folders first, then messages (avoid concurrent IMAP connections)
            loadFolders().then(() => loadMessages());
        }
    }, [selectedAccount]);

    // Load messages when folder or page changes (but not on initial account select)
    useEffect(() => {
        if (selectedAccount && folders.length > 0) {
            loadMessages();
        }
    }, [currentFolder, page]);

    const loadFolders = async () => {
        if (!selectedAccount) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/email-client/accounts/${selectedAccount.id}/folders`);
            if (res.ok) {
                const data = await res.json();
                setFolders(data.folders || []);
            } else {
                console.error('Failed to load folders:', res.status);
                setFolders(['INBOX']); // Fallback
            }
        } catch (e) {
            console.error('Error loading folders:', e);
            setFolders(['INBOX']); // Fallback
        }
    };

    const loadMessages = useCallback(async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                folder: currentFolder,
                page: page.toString(),
                per_page: '25',
                ...(searchQuery && { search: searchQuery })
            });
            const res = await fetch(`${BACKEND_URL}/api/email-client/accounts/${selectedAccount.id}/messages?${params}`);
            const data = await res.json();
            setMessages(data.messages || []);
            setTotalPages(data.total_pages || 1);
            setTotal(data.total || 0);
        } catch (e) {
            console.error('Error loading messages:', e);
        } finally {
            setLoading(false);
        }
    }, [selectedAccount, currentFolder, page, searchQuery]);

    const openMessage = async (msg) => {
        if (!selectedAccount) return;
        setLoadingMessage(true);
        setView('read');
        try {
            const res = await fetch(`${BACKEND_URL}/api/email-client/accounts/${selectedAccount.id}/messages/${msg.uid}?folder=${currentFolder}`);
            const data = await res.json();
            setSelectedMessage(data);
            // Mark as read in list
            setMessages(prev => prev.map(m => m.uid === msg.uid ? { ...m, is_read: true } : m));
        } catch (e) {
            console.error('Error opening message:', e);
        } finally {
            setLoadingMessage(false);
        }
    };

    const handleTrash = async (uid) => {
        if (!selectedAccount) return;
        try {
            await fetch(`${BACKEND_URL}/api/email-client/accounts/${selectedAccount.id}/messages/${uid}/trash`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder: currentFolder })
            });
            setMessages(prev => prev.filter(m => m.uid !== uid));
            if (selectedMessage?.uid === uid) {
                setSelectedMessage(null);
                setView('list');
            }
        } catch (e) {
            console.error('Error trashing message:', e);
        }
    };

    const handleReply = () => {
        if (!selectedMessage) return;
        setComposeData({
            to: [selectedMessage.from_email],
            subject: `Re: ${selectedMessage.subject?.replace(/^Re:\s*/i, '')}`,
            body: `<br/><br/><hr/><p>On ${selectedMessage.date}, ${selectedMessage.from_name} wrote:</p><blockquote style="border-left:2px solid #ccc;padding-left:10px;margin-left:10px;color:#666;">${selectedMessage.body}</blockquote>`,
            in_reply_to: selectedMessage.message_id,
            references: selectedMessage.references
        });
        setComposeMode('reply');
        setView('compose');
    };

    const handleForward = () => {
        if (!selectedMessage) return;
        setComposeData({
            to: [],
            subject: `Fwd: ${selectedMessage.subject?.replace(/^Fwd:\s*/i, '')}`,
            body: `<br/><br/><hr/><p>---------- Forwarded message ----------</p><p>From: ${selectedMessage.from_name} &lt;${selectedMessage.from_email}&gt;</p><p>Date: ${selectedMessage.date}</p><p>Subject: ${selectedMessage.subject}</p><br/>${selectedMessage.body}`
        });
        setComposeMode('forward');
        setView('compose');
    };

    const handleCompose = () => {
        setComposeData({ to: [], subject: '', body: '' });
        setComposeMode('new');
        setView('compose');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadMessages();
    };

    const handleAccountSaved = () => {
        loadAccounts();
        setView('list');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const now = new Date();
            if (d.toDateString() === now.toDateString()) {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Map folder names to icons
    const getFolderIcon = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('inbox')) return <Inbox size={16} />;
        if (lower.includes('sent')) return <Send size={16} />;
        if (lower.includes('draft')) return <FileText size={16} />;
        if (lower.includes('trash') || lower.includes('deleted')) return <Trash2 size={16} />;
        if (lower.includes('spam') || lower.includes('junk')) return <AlertTriangle size={16} />;
        if (lower.includes('star') || lower.includes('flagged')) return <Star size={16} />;
        return <Mail size={16} />;
    };

    const getFolderDisplayName = (name) => {
        if (name === 'INBOX') return 'Inbox';
        // Remove [Gmail]/ prefix
        return name.replace(/^\[Gmail\]\//i, '').replace(/^\[.*\]\//i, '');
    };

    // ─── NO ACCOUNTS VIEW ───
    if (accounts.length === 0 && view !== 'settings') {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <Mail size={48} className="mx-auto text-blue-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Email Client</h2>
                    <p className="text-gray-500 mb-6">Set up your email account to get started. Supports Gmail, Office 365, and custom SMTP/IMAP servers.</p>
                    <button
                        onClick={() => setView('settings')}
                        data-testid="setup-email-btn"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Settings size={18} className="inline mr-2" />
                        Set Up Email Account
                    </button>
                </div>
            </div>
        );
    }

    // ─── SETTINGS VIEW ───
    if (view === 'settings') {
        return (
            <EmailSettings
                currentUser={currentUser}
                accounts={accounts}
                onBack={() => setView('list')}
                onSaved={handleAccountSaved}
            />
        );
    }

    // ─── COMPOSE VIEW ───
    if (view === 'compose') {
        return (
            <ComposeEmail
                account={selectedAccount}
                initialData={composeData}
                mode={composeMode}
                onBack={() => { setView(selectedMessage ? 'read' : 'list'); setComposeMode(null); }}
                onSent={() => { setView('list'); setComposeMode(null); loadMessages(); }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 280px)' }} data-testid="email-client">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <Mail size={22} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-800">Email</h2>
                    {accounts.length > 1 && (
                        <select
                            value={selectedAccount?.id || ''}
                            onChange={e => {
                                const acc = accounts.find(a => a.id === e.target.value);
                                setSelectedAccount(acc);
                                setPage(1);
                            }}
                            className="text-sm border rounded-lg px-2 py-1"
                            data-testid="email-account-selector"
                        >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.email}</option>
                            ))}
                        </select>
                    )}
                    {accounts.length === 1 && (
                        <span className="text-sm text-gray-500">{selectedAccount?.email}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCompose} data-testid="compose-btn" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
                        <Plus size={16} /> Compose
                    </button>
                    <button onClick={() => loadMessages()} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Refresh">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setView('settings')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Settings">
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Folder sidebar */}
                <div className="hidden md:block w-48 bg-gray-50 border-r overflow-y-auto flex-shrink-0">
                    <div className="p-2 space-y-0.5">
                        {(folders.length > 0 ? folders : ['INBOX', 'Sent', 'Drafts', 'Trash']).map(folder => (
                            <button
                                key={folder}
                                onClick={() => { setCurrentFolder(folder); setPage(1); setView('list'); setSelectedMessage(null); }}
                                data-testid={`folder-${folder}`}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    currentFolder === folder ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {getFolderIcon(folder)}
                                <span className="truncate">{getFolderDisplayName(folder)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile folder selector */}
                <div className="md:hidden px-3 py-2 bg-gray-50 border-b flex items-center gap-2 overflow-x-auto" style={{ display: view === 'read' ? 'none' : undefined }}>
                    {(folders.length > 0 ? folders : ['INBOX', 'Sent', 'Drafts', 'Trash']).slice(0, 6).map(folder => (
                        <button
                            key={folder}
                            onClick={() => { setCurrentFolder(folder); setPage(1); }}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                                currentFolder === folder ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
                            }`}
                        >
                            {getFolderIcon(folder)}
                            {getFolderDisplayName(folder)}
                        </button>
                    ))}
                </div>

                {/* Message list or read view */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {view === 'read' && selectedMessage ? (
                        /* ─── READ VIEW ─── */
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 border-b bg-white flex items-center gap-2">
                                <button onClick={() => { setView('list'); setSelectedMessage(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 truncate">{selectedMessage.subject}</h3>
                                    <p className="text-sm text-gray-500">{selectedMessage.from_name} &lt;{selectedMessage.from_email}&gt;</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={handleReply} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Reply" data-testid="reply-btn">
                                        <Reply size={18} />
                                    </button>
                                    <button onClick={handleForward} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Forward" data-testid="forward-btn">
                                        <Forward size={18} />
                                    </button>
                                    <button onClick={() => handleTrash(selectedMessage.uid)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600" title="Delete" data-testid="trash-btn">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-b text-sm text-gray-600">
                                <div>To: {selectedMessage.to}</div>
                                {selectedMessage.cc && <div>Cc: {selectedMessage.cc}</div>}
                                <div>Date: {new Date(selectedMessage.date).toLocaleString()}</div>
                            </div>
                            {/* Attachments */}
                            {selectedMessage.attachments?.length > 0 && (
                                <div className="px-4 py-2 bg-white border-b flex items-center gap-2 flex-wrap">
                                    <Paperclip size={14} className="text-gray-400" />
                                    {selectedMessage.attachments.map((att, idx) => (
                                        <a
                                            key={idx}
                                            href={`${BACKEND_URL}/api/email-client/accounts/${selectedAccount.id}/messages/${selectedMessage.uid}/attachment/${att.index}?folder=${currentFolder}`}
                                            download={att.filename}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-blue-600 hover:bg-blue-50"
                                        >
                                            <Download size={12} /> {att.filename} ({Math.round(att.size / 1024)}KB)
                                        </a>
                                    ))}
                                </div>
                            )}
                            {loadingMessage ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw size={24} className="animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div
                                    className="p-4 bg-white prose prose-sm max-w-none overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: selectedMessage.body || '<p>No content</p>' }}
                                />
                            )}
                        </div>
                    ) : (
                        /* ─── LIST VIEW ─── */
                        <>
                            {/* Search bar */}
                            <form onSubmit={handleSearch} className="px-3 py-2 border-b bg-white flex items-center gap-2">
                                <Search size={16} className="text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search emails..."
                                    className="flex-1 text-sm outline-none"
                                    data-testid="email-search"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => { setSearchQuery(''); setPage(1); }} className="text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                )}
                            </form>

                            {/* Messages list */}
                            <div className="flex-1 overflow-y-auto bg-white">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                                        <span className="ml-2 text-gray-500">Loading...</span>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Inbox size={40} className="mb-3" />
                                        <p>{searchQuery ? 'No messages match your search' : 'No messages in this folder'}</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.uid}
                                            onClick={() => openMessage(msg)}
                                            data-testid={`email-msg-${msg.uid}`}
                                            className={`flex items-center px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                                                !msg.is_read ? 'bg-blue-50/50 font-semibold' : ''
                                            }`}
                                        >
                                            {/* Sender avatar */}
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-3">
                                                {(msg.from_name || msg.from_email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm truncate ${!msg.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {msg.from_name || msg.from_email}
                                                    </span>
                                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatDate(msg.date)}</span>
                                                </div>
                                                <p className={`text-sm truncate ${!msg.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                                                    {msg.subject || '(No Subject)'}
                                                </p>
                                            </div>
                                            {msg.has_attachments && <Paperclip size={14} className="text-gray-400 ml-2 flex-shrink-0" />}
                                            <button
                                                onClick={e => { e.stopPropagation(); handleTrash(msg.uid); }}
                                                className="p-1 ml-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:opacity-100 flex-shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-2 bg-white border-t text-sm text-gray-500">
                                    <span>{total} messages</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page <= 1}
                                            className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                                        >
                                            Prev
                                        </button>
                                        <span>Page {page} of {totalPages}</span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                            className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailClient;
