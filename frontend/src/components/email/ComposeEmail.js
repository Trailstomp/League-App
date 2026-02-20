import React, { useState, useRef } from 'react';
import { ChevronLeft, Send, Paperclip, X, Bold, Italic, Underline } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const ComposeEmail = ({ account, initialData = {}, mode = 'new', onBack, onSent }) => {
    const [to, setTo] = useState((initialData.to || []).join(', '));
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(initialData.subject || '');
    const [body, setBody] = useState(initialData.body || '');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);
    const bodyRef = useRef(null);

    const handleAttach = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                setAttachments(prev => [...prev, {
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                    data: base64
                }]);
            };
            reader.readAsDataURL(file);
        });
        if (fileRef.current) fileRef.current.value = '';
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!to.trim()) { setError('At least one recipient is required'); return; }
        if (!account) { setError('No email account selected'); return; }

        setSending(true);
        setError('');
        try {
            const toList = to.split(',').map(e => e.trim()).filter(Boolean);
            const ccList = cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : [];
            const bccList = bcc ? bcc.split(',').map(e => e.trim()).filter(Boolean) : [];

            const payload = {
                to: toList,
                cc: ccList,
                bcc: bccList,
                subject,
                body,
                is_html: true,
                attachments,
                in_reply_to: initialData.in_reply_to || '',
                references: initialData.references || ''
            };

            const res = await fetch(`${BACKEND_URL}/api/email-client/accounts/${account.id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to send');

            onSent();
        } catch (e) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    };

    const execCommand = (cmd) => {
        document.execCommand(cmd, false, null);
        if (bodyRef.current) bodyRef.current.focus();
    };

    const modeLabel = mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Message';

    return (
        <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 280px)' }} data-testid="compose-email">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-gray-800">{modeLabel}</h2>
                </div>
                <button
                    onClick={handleSend}
                    disabled={sending}
                    data-testid="send-email-btn"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                    {sending ? 'Sending...' : <><Send size={16} /> Send</>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                {/* Recipients */}
                <div className="px-4 py-2 border-b">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 w-10">To:</label>
                        <input
                            type="text"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="flex-1 text-sm outline-none py-1"
                            placeholder="recipient@example.com"
                            data-testid="compose-to"
                        />
                        {!showCcBcc && (
                            <button onClick={() => setShowCcBcc(true)} className="text-xs text-blue-600 hover:underline">Cc/Bcc</button>
                        )}
                    </div>
                </div>

                {showCcBcc && (
                    <>
                        <div className="px-4 py-2 border-b flex items-center gap-2">
                            <label className="text-sm text-gray-500 w-10">Cc:</label>
                            <input type="text" value={cc} onChange={e => setCc(e.target.value)} className="flex-1 text-sm outline-none py-1" placeholder="cc@example.com" />
                        </div>
                        <div className="px-4 py-2 border-b flex items-center gap-2">
                            <label className="text-sm text-gray-500 w-10">Bcc:</label>
                            <input type="text" value={bcc} onChange={e => setBcc(e.target.value)} className="flex-1 text-sm outline-none py-1" placeholder="bcc@example.com" />
                        </div>
                    </>
                )}

                {/* Subject */}
                <div className="px-4 py-2 border-b flex items-center gap-2">
                    <label className="text-sm text-gray-500 w-10">Subj:</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="flex-1 text-sm outline-none py-1"
                        placeholder="Subject"
                        data-testid="compose-subject"
                    />
                </div>

                {/* Toolbar */}
                <div className="px-4 py-1.5 border-b flex items-center gap-1 bg-gray-50">
                    <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded" title="Bold"><Bold size={14} /></button>
                    <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded" title="Italic"><Italic size={14} /></button>
                    <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-gray-200 rounded" title="Underline"><Underline size={14} /></button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button onClick={() => fileRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded flex items-center gap-1 text-xs" title="Attach file">
                        <Paperclip size={14} /> Attach
                    </button>
                    <input ref={fileRef} type="file" multiple onChange={handleAttach} className="hidden" />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="px-4 py-2 bg-gray-50 border-b flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white border rounded px-2 py-1 text-xs">
                                <Paperclip size={12} className="text-gray-400" />
                                <span className="truncate max-w-[120px]">{att.filename}</span>
                                <span className="text-gray-400">({Math.round(att.size / 1024)}KB)</span>
                                <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div
                    ref={bodyRef}
                    contentEditable
                    className="px-4 py-3 min-h-[300px] text-sm outline-none prose prose-sm max-w-none"
                    data-testid="compose-body"
                    onInput={e => setBody(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: initialData.body || '' }}
                    suppressContentEditableWarning
                />

                {error && (
                    <div className="px-4 py-2 text-sm text-red-600 bg-red-50">{error}</div>
                )}
            </div>
        </div>
    );
};

export default ComposeEmail;
