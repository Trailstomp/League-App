import React, { useState, useRef } from 'react';

const PlayerImporter = ({ teams = [], onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    const [defaultPassword, setDefaultPassword] = useState('Welcome123!');
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [importResults, setImportResults] = useState(null);
    const fileInputRef = useRef(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Expected CSV columns - Updated to use single name field
    const expectedColumns = [
        { key: 'name', label: 'Name', required: true, example: 'John Doe' },
        { key: 'email', label: 'Email', required: true, example: 'john@example.com' },
        { key: 'phone', label: 'Phone', required: false, example: '555-123-4567' },
        { key: 'jerseyNumber', label: 'Jersey Number', required: false, example: '12' },
        { key: 'position', label: 'Position', required: false, example: 'Attack, Midfield' },
        { key: 'jerseySize', label: 'Jersey Size', required: false, example: 'L' },
        { key: 'teamId', label: 'Team ID', required: false, example: 'team_id_here' },
        { key: 'role', label: 'Role', required: false, example: 'player' },
        { key: 'emergencyContactName', label: 'Emergency Contact Name', required: false, example: 'Jane Doe' },
        { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', required: false, example: '555-987-6543' },
        { key: 'highSchoolTeam', label: 'High School Team', required: false, example: 'Central High' },
        { key: 'highSchoolYear', label: 'HS Graduation Year', required: false, example: '2018' },
        { key: 'collegeTeam', label: 'College Team', required: false, example: 'State University' },
        { key: 'collegeYear', label: 'College Graduation Year', required: false, example: '2022' },
        { key: 'funFacts', label: 'Fun Facts', required: false, example: 'Loves pizza' },
        { key: 'instagram', label: 'Instagram', required: false, example: 'johndoe' },
        { key: 'twitter', label: 'Twitter/X', required: false, example: 'johndoe' },
    ];

    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have a header row and at least one data row');
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        // Map common column names to our expected keys
        const columnMap = {
            'name': 'name',
            'fullname': 'name',
            'playername': 'name',
            'player': 'name',
            // Legacy support for first/last name (will be combined)
            'firstname': 'firstName',
            'first': 'firstName',
            'fname': 'firstName',
            'lastname': 'lastName',
            'last': 'lastName',
            'lname': 'lastName',
            'email': 'email',
            'emailaddress': 'email',
            'phone': 'phone',
            'phonenumber': 'phone',
            'mobile': 'phone',
            'cell': 'phone',
            'jerseynumber': 'jerseyNumber',
            'jersey': 'jerseyNumber',
            'number': 'jerseyNumber',
            'position': 'position',
            'pos': 'position',
            'positions': 'position',
            'jerseysize': 'jerseySize',
            'size': 'jerseySize',
            'teamid': 'teamId',
            'team': 'teamId',
            'role': 'role',
            'type': 'role',
            'emergencycontactname': 'emergencyContactName',
            'emergencyname': 'emergencyContactName',
            'ecname': 'emergencyContactName',
            'emergencycontactphone': 'emergencyContactPhone',
            'emergencyphone': 'emergencyContactPhone',
            'ecphone': 'emergencyContactPhone',
            'highschoolteam': 'highSchoolTeam',
            'hsteam': 'highSchoolTeam',
            'highschool': 'highSchoolTeam',
            'highschoolyear': 'highSchoolYear',
            'hsyear': 'highSchoolYear',
            'hsgrad': 'highSchoolYear',
            'collegeteam': 'collegeTeam',
            'college': 'collegeTeam',
            'collegeyear': 'collegeYear',
            'collegegrad': 'collegeYear',
            'funfacts': 'funFacts',
            'fun': 'funFacts',
            'facts': 'funFacts',
            'bio': 'funFacts',
            'instagram': 'instagram',
            'ig': 'instagram',
            'twitter': 'twitter',
            'x': 'twitter',
            'tiktok': 'tiktok',
        };

        const mappedHeader = header.map(h => columnMap[h] || h);

        // Parse data rows
        const data = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Handle CSV values with commas inside quotes
            const values = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());

            // Create player object
            const player = {};
            mappedHeader.forEach((key, index) => {
                if (values[index] !== undefined) {
                    player[key] = values[index];
                }
            });

            // Validate required fields
            const rowErrors = [];
            // Support both single 'name' field and legacy firstName/lastName
            const playerName = player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim();
            if (!playerName) rowErrors.push('Missing name');
            player.name = playerName; // Ensure name is set
            
            if (!player.email) rowErrors.push('Missing email');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email)) {
                rowErrors.push('Invalid email format');
            }

            if (rowErrors.length > 0) {
                errors.push({ row: i + 1, errors: rowErrors, data: player });
            }

            // Set defaults
            player.role = player.role || 'player';
            player.status = 'active';
            
            data.push(player);
        }

        return { data, errors };
    };

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setError('');
        setSuccess('');
        setValidationErrors([]);
        
        // Check file type
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        const isValidType = validTypes.includes(selectedFile.type) || 
                          selectedFile.name.endsWith('.csv') || 
                          selectedFile.name.endsWith('.txt');
        
        if (!isValidType) {
            setError('Please upload a CSV file (.csv or .txt)');
            return;
        }

        setFile(selectedFile);

        try {
            const text = await selectedFile.text();
            const { data, errors } = parseCSV(text);
            
            setParsedData(data);
            setValidationErrors(errors);
            setShowPreview(true);
            
            if (errors.length > 0) {
                setError(`Found ${errors.length} row(s) with validation errors. Please review below.`);
            }
        } catch (err) {
            setError(`Error parsing CSV: ${err.message}`);
            setParsedData([]);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            setError('No data to import');
            return;
        }

        // Filter out rows with errors
        const validRows = parsedData.filter((_, index) => 
            !validationErrors.some(e => e.row === index + 2)
        );

        if (validRows.length === 0) {
            setError('No valid rows to import. Please fix the errors first.');
            return;
        }

        setImporting(true);
        setError('');
        setSuccess('');
        setImportResults(null);
        setImportProgress({ current: 0, total: validRows.length });

        let imported = 0;
        let failed = 0;
        const failedRows = [];
        const successfulPlayers = [];

        for (let i = 0; i < validRows.length; i++) {
            const player = validRows[i];
            setImportProgress({ current: i + 1, total: validRows.length });
            
            try {
                // Build emergency contact object
                const emergencyContact = {};
                if (player.emergencyContactName) emergencyContact.name = player.emergencyContactName;
                if (player.emergencyContactPhone) emergencyContact.phone = player.emergencyContactPhone;

                // Build lacrosse history object
                const lacrosseHistory = {};
                if (player.highSchoolTeam || player.highSchoolYear) {
                    lacrosseHistory.highSchool = {
                        teamName: player.highSchoolTeam || '',
                        graduationYear: player.highSchoolYear || ''
                    };
                }
                if (player.collegeTeam || player.collegeYear) {
                    lacrosseHistory.college = {
                        teamName: player.collegeTeam || '',
                        graduationYear: player.collegeYear || ''
                    };
                }

                // Build social media object
                const socialMedia = {};
                if (player.instagram) socialMedia.instagram = player.instagram;
                if (player.twitter) socialMedia.twitter = player.twitter;
                if (player.tiktok) socialMedia.tiktok = player.tiktok;

                // Apply selected team if no team specified in CSV
                const teamId = player.teamId || selectedTeam || null;
                
                // Parse positions (can be comma-separated)
                const positionsRaw = player.position || '';
                const positions = positionsRaw.split(',').map(p => p.trim()).filter(Boolean);
                
                const playerData = {
                    name: player.name,
                    email: player.email,
                    password: defaultPassword,
                    phone: player.phone || null,
                    teamId: teamId,
                    teamAssignments: teamId ? [{
                        teamId: teamId,
                        playerNumber: player.jerseyNumber || '',
                        position: positions[0] || '',
                        positions: positions,
                        isPrimary: true
                    }] : [],
                    roles: [player.role || 'player'],
                    role: player.role || 'player',
                    status: 'active',
                    playerNumber: player.jerseyNumber || null,
                    position: positions[0] || null,
                    positions: positions,
                    jerseySize: player.jerseySize || null,
                    emergencyContact: Object.keys(emergencyContact).length > 0 ? emergencyContact : null,
                    lacrosseHistory: Object.keys(lacrosseHistory).length > 0 ? lacrosseHistory : null,
                    funFacts: player.funFacts || null,
                    socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : null,
                    notificationPreferences: {
                        email: true,
                        sms: false,
                        groupme: true
                    },
                    requirePasswordReset: true,
                    sendWelcomeEmail: sendWelcomeEmail
                };

                const response = await fetch(`${backendUrl}/api/users/admin-create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(playerData)
                });

                if (response.ok) {
                    imported++;
                    successfulPlayers.push(player.name);
                } else {
                    const errorData = await response.json();
                    failed++;
                    failedRows.push({ player, error: errorData.detail || 'Unknown error' });
                }
            } catch (err) {
                failed++;
                failedRows.push({ player, error: err.message });
            }
        }

        setImporting(false);
        
        // Store results for display
        setImportResults({
            imported,
            failed,
            failedRows,
            successfulPlayers
        });

        if (imported > 0) {
            setSuccess(`Successfully imported ${imported} player(s)${failed > 0 ? `. ${failed} failed.` : '.'}`);
        }

        if (failedRows.length > 0) {
            setError(`Failed to import ${failed} player(s): ${failedRows.map(r => `${r.player.name || r.player.email} (${r.error})`).join(', ')}`);
        }

        // Reset file input but keep results visible
        setFile(null);
        setParsedData([]);
        setShowPreview(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        const headers = expectedColumns.map(c => c.label).join(',');
        const sampleRow = expectedColumns.map(c => c.example || '').join(',');
        const csv = `${headers}\n${sampleRow}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'player_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">📥 Import Players</h3>
                    <p className="text-sm text-gray-600">Upload a CSV file to bulk import players</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                    📄 Download Template
                </button>
            </div>

            {/* Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 CSV Format</h4>
                <p className="text-sm text-blue-700 mb-3">
                    Your CSV file should have these columns (first row as header):
                </p>
                <div className="overflow-x-auto max-h-64">
                    <table className="text-sm w-full">
                        <thead className="sticky top-0 bg-blue-50">
                            <tr className="text-left text-blue-800">
                                <th className="pr-4 pb-1">Column</th>
                                <th className="pr-4 pb-1">Required</th>
                                <th className="pb-1">Example</th>
                            </tr>
                        </thead>
                        <tbody className="text-blue-700">
                            {expectedColumns.map(col => (
                                <tr key={col.key}>
                                    <td className="pr-4 py-0.5 font-medium">{col.label}</td>
                                    <td className="pr-4 py-0.5">{col.required ? '✓ Yes' : 'Optional'}</td>
                                    <td className="py-0.5 text-blue-600">{col.example}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-xs text-blue-600">
                    <strong>Position options:</strong> Attack, Midfield, Defense, Goalie, FOGO, LSM
                </div>
            </div>

            {/* Import Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Team
                    </label>
                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- No default team --</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Applied to players without a team in CSV</p>
                </div>

                {/* Default Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Password
                    </label>
                    <input
                        type="text"
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Welcome123!"
                    />
                    <p className="text-xs text-gray-500 mt-1">Users will be prompted to change on first login</p>
                </div>
            </div>

            {/* Welcome Email Option */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="sendWelcome"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sendWelcome" className="text-sm text-gray-700">
                    Send welcome email with login instructions and password reset link
                </label>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                />
                <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                >
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600 mb-1">
                        {file ? file.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">CSV files only</span>
                </label>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-medium text-red-800 text-sm">Import Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
            )}
            {success && !importResults && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            {/* Import Results Panel */}
            {importResults && (
                <div className="bg-white border-2 border-green-300 rounded-lg p-5 shadow-sm" data-testid="import-results">
                    <h4 className="text-lg font-bold text-gray-800 mb-3">Import Complete</h4>
                    <div className="flex gap-4 mb-4">
                        <div className="bg-green-50 rounded-lg px-4 py-2 flex-1 text-center">
                            <div className="text-2xl font-bold text-green-600">{importResults.imported}</div>
                            <div className="text-xs text-green-700">Successfully Added</div>
                        </div>
                        {importResults.failed > 0 && (
                            <div className="bg-red-50 rounded-lg px-4 py-2 flex-1 text-center">
                                <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                                <div className="text-xs text-red-700">Failed</div>
                            </div>
                        )}
                    </div>
                    {importResults.successfulPlayers.length > 0 && (
                        <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Added:</span> {importResults.successfulPlayers.join(', ')}
                        </div>
                    )}
                    {importResults.failedRows.length > 0 && (
                        <div className="text-sm text-red-600 mb-3">
                            <span className="font-medium">Failed:</span>
                            <ul className="list-disc ml-4 mt-1">
                                {importResults.failedRows.map((r, i) => (
                                    <li key={i}>{r.player.name || r.player.email} - {r.error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => { if (onImportComplete) onImportComplete(); }}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            data-testid="import-done-btn"
                        >
                            Refresh & View Players
                        </button>
                        <button
                            onClick={() => { setImportResults(null); setSuccess(''); setError(''); }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Import More
                        </button>
                    </div>
                </div>
            )}

            {/* Preview */}
            {showPreview && parsedData.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                        <h4 className="font-medium text-gray-700">
                            Preview ({parsedData.length} rows)
                        </h4>
                        {validationErrors.length > 0 && (
                            <span className="text-sm text-red-600">
                                ⚠️ {validationErrors.length} error(s)
                            </span>
                        )}
                    </div>
                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Jersey</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Position</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Size</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {parsedData.map((player, index) => {
                                    const rowError = validationErrors.find(e => e.row === index + 2);
                                    return (
                                        <tr key={index} className={rowError ? 'bg-red-50' : ''}>
                                            <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                            <td className="px-3 py-2">{player.name}</td>
                                            <td className="px-3 py-2">{player.email}</td>
                                            <td className="px-3 py-2">{player.phone || '-'}</td>
                                            <td className="px-3 py-2">{player.jerseyNumber || '-'}</td>
                                            <td className="px-3 py-2">{player.position || '-'}</td>
                                            <td className="px-3 py-2">{player.jerseySize || '-'}</td>
                                            <td className="px-3 py-2">
                                                {rowError ? (
                                                    <span className="text-red-600 text-xs">
                                                        ❌ {rowError.errors.join(', ')}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 text-xs">✓ Valid</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Import Button */}
            {showPreview && parsedData.length > 0 && (
                <div className="flex gap-3">
                    <button
                        onClick={handleImport}
                        disabled={importing || parsedData.length === validationErrors.length}
                        data-testid="import-players-btn"
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                            importing || parsedData.length === validationErrors.length
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {importing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                                Importing {importProgress.current} of {importProgress.total}...
                            </span>
                        ) : (
                            `Import ${parsedData.length - validationErrors.length} Player(s)`
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setFile(null);
                            setParsedData([]);
                            setShowPreview(false);
                            setValidationErrors([]);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlayerImporter;
