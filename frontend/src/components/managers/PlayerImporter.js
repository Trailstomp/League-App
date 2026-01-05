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
    const fileInputRef = useRef(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Expected CSV columns
    const expectedColumns = [
        { key: 'firstName', label: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name', required: true },
        { key: 'email', label: 'Email', required: true },
        { key: 'phone', label: 'Phone', required: false },
        { key: 'jerseyNumber', label: 'Jersey Number', required: false },
        { key: 'position', label: 'Position', required: false },
        { key: 'teamId', label: 'Team ID', required: false },
        { key: 'role', label: 'Role', required: false },
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
            'teamid': 'teamId',
            'team': 'teamId',
            'role': 'role',
            'type': 'role',
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
            if (!player.firstName) rowErrors.push('Missing first name');
            if (!player.lastName) rowErrors.push('Missing last name');
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

        let imported = 0;
        let failed = 0;
        const failedRows = [];

        for (const player of validRows) {
            try {
                // Apply selected team if no team specified in CSV
                const playerData = {
                    ...player,
                    teamId: player.teamId || selectedTeam || null,
                    teamAssignments: player.teamId || selectedTeam ? [{
                        teamId: player.teamId || selectedTeam,
                        jerseyNumber: player.jerseyNumber || '',
                        position: player.position || '',
                        isPrimary: true
                    }] : [],
                    roles: [player.role || 'player'],
                    notificationPreferences: {
                        email: true,
                        sms: false,
                        groupme: true
                    }
                };

                const response = await fetch(`${backendUrl}/api/users/admin-create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(playerData)
                });

                if (response.ok) {
                    imported++;
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

        if (imported > 0) {
            setSuccess(`Successfully imported ${imported} player(s)${failed > 0 ? `. ${failed} failed.` : '.'}`);
            if (onImportComplete) {
                onImportComplete();
            }
        }

        if (failedRows.length > 0) {
            setError(`Failed to import ${failed} player(s). Common issues: duplicate email, invalid data.`);
            console.log('Failed imports:', failedRows);
        }

        // Reset form
        setFile(null);
        setParsedData([]);
        setShowPreview(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        const headers = expectedColumns.map(c => c.label).join(',');
        const sampleRow = 'John,Doe,john.doe@example.com,555-123-4567,12,Attack,team_id_here,player';
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
                    Download Template
                </button>
            </div>

            {/* Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 CSV Format</h4>
                <p className="text-sm text-blue-700 mb-3">
                    Your CSV file should have these columns (first row as header):
                </p>
                <div className="overflow-x-auto">
                    <table className="text-sm w-full">
                        <thead>
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
                                    <td className="py-0.5 text-blue-600">
                                        {col.key === 'firstName' && 'John'}
                                        {col.key === 'lastName' && 'Doe'}
                                        {col.key === 'email' && 'john@example.com'}
                                        {col.key === 'phone' && '555-123-4567'}
                                        {col.key === 'jerseyNumber' && '12'}
                                        {col.key === 'position' && 'Attack, Defense, Midfield, Goalie'}
                                        {col.key === 'teamId' && 'team_id (or leave blank)'}
                                        {col.key === 'role' && 'player, coach, admin'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Team Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Team (for players without team specified)
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
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">{success}</p>
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
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {parsedData.map((player, index) => {
                                    const rowError = validationErrors.find(e => e.row === index + 2);
                                    return (
                                        <tr key={index} className={rowError ? 'bg-red-50' : ''}>
                                            <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                            <td className="px-3 py-2">{player.firstName} {player.lastName}</td>
                                            <td className="px-3 py-2">{player.email}</td>
                                            <td className="px-3 py-2">{player.phone || '-'}</td>
                                            <td className="px-3 py-2">{player.jerseyNumber || '-'}</td>
                                            <td className="px-3 py-2">{player.position || '-'}</td>
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
                                Importing...
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
