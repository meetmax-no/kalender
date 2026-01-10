// --- KORREKT CSV PARSING (Håndterer komma i felt) ---
window.parseMetaCSV = (csvText) => {
    // Regex som splitter på komma KUN hvis det ikke er inni anførselstegn
    const splitCSV = (str) => {
        const matches = str.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
    };

    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Bruker den smarte splitteren på overskriftene
    const headers = splitCSV(lines[0]);
    
    // Mapping basert NØYAKTIG på din fil
    const fieldMap = {
        'Reporting starts': 'date',
        'Rapportering starter': 'date',
        
        'Amount spent (NOK)': 'spend',
        'Beløp brukt (NOK)': 'spend',
        
        'Impressions': 'impressions',
        'Eksponeringer': 'impressions',
        
        'Reach': 'reach',
        'Rekkevidde': 'reach',
        
        'Frequency': 'frequency',
        'Frekvens': 'frequency',
        
        'CPM (cost per 1,000 impressions) (NOK)': 'cpm',
        'CPM (kostnad per 1000 eksponeringer) (NOK)': 'cpm',
        
        'Link clicks': 'linkClicks',
        'Klikk på lenke': 'linkClicks',
        
        'CPC (cost per link click) (NOK)': 'cpcLink',
        'CPC (kostnad per klikk på lenke) (NOK)': 'cpcLink',
        
        'Clicks (all)': 'clicksAll',
        'Klikk (alle)': 'clicksAll',
        
        'CTR (all)': 'ctrAll',
        'CTR (alle)': 'ctrAll',
        
        'CPC (all) (NOK)': 'cpcAll',
        'CPC (alle) (NOK)': 'cpcAll',
        
        'Landing page views': 'landingPageViews',
        'Visninger av landingsside': 'landingPageViews',
        
        'Cost per landing page view (NOK)': 'costPerLandingPageView',
        'Kostnad per visning av landingsside (NOK)': 'costPerLandingPageView'
    };

    const result = [];
    
    // Finn indekser for kolonnene vi bryr oss om
    const indices = {};
    headers.forEach((h, i) => {
        if (fieldMap[h]) {
            indices[fieldMap[h]] = i;
        }
    });

    for (let i = 1; i < lines.length; i++) {
        // Bruker samme smarte splitter på dataradene
        // Merk: Regexen over er litt enkel, så vi bruker en mer robust metode for selve dataene
        // siden dataene kan være tomme (,,)
        
        // Enklere manuell parsing for datarader for å håndtere tomme felt riktig:
        const row = [];
        let inQuote = false;
        let buffer = '';
        for (let char of lines[i]) {
            if (char === '"') { inQuote = !inQuote; }
            else if (char === ',' && !inQuote) { row.push(buffer); buffer = ''; }
            else { buffer += char; }
        }
        row.push(buffer); // Siste felt

        const obj = { id: Date.now() + Math.random() };
        let hasData = false;

        Object.keys(indices).forEach(key => {
            const index = indices[key];
            let val = row[index] ? row[index].replace(/^"|"$/g, '').trim() : '';

            if (val) {
                if (key === 'date') {
                    obj[key] = val;
                } else {
                    // Håndter tall (305.21 eller 305,21)
                    if (val.includes(',') && !val.includes('.')) val = val.replace(',', '.');
                    obj[key] = parseFloat(val) || 0;
                }
                hasData = true;
            }
        });

        if (hasData && obj.date) {
            result.push(obj);
        }
    }
    return result;
};

// --- HOVEDKOMPONENT ---
window.AnalyseDashboard = ({ kpiData, onAddKpi, onDeleteKpi }) => {
    const Icon = window.Icon;
    const { useState, useRef } = React;
    const csvInputRef = useRef(null);

    // --- STATE FOR MANUELL REGISTRERING ---
    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0,10),
        reach: '', frequency: '', spend: '', impressions: '', cpm: '',
        linkClicks: '', cpcLink: '', clicksAll: '', ctrAll: '', cpcAll: '',
        landingPageViews: '', costPerLandingPageView: ''
    });

    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.date) return;

        const newData = { id: Date.now(), ...form };
        Object.keys(newData).forEach(key => {
            if (key !== 'id' && key !== 'date') {
                newData[key] = parseFloat(newData[key]) || 0;
            }
        });

        onAddKpi(newData);
        setForm(prev => ({ ...prev, 
            reach: '', frequency: '', spend: '', impressions: '', cpm: '',
            linkClicks: '', cpcLink: '', clicksAll: '', ctrAll: '', cpcAll: '',
            landingPageViews: '', costPerLandingPageView: ''
        }));
        setIsFormOpen(false);
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const importedData = window.parseMetaCSV(ev.target.result);
                if (importedData.length > 0) {
                    if (confirm(`Fant ${importedData.length} rader. Vil du importere disse?`)) {
                        importedData.forEach(row => onAddKpi(row));
                    }
                } else {
                    alert("Fant ingen gyldige data. Sjekk at filen er en standard Meta CSV eksport.");
                }
            } catch (err) {
                console.error(err);
                alert("Feil ved lesing av fil.");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const sortedData = [...(kpiData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const fmt = (num, decimals = 0) => num ? num.toLocaleString('nb-NO', { maximumFractionDigits: decimals }) : '-';
    const kr = (num) => num ? num.toLocaleString('nb-NO', { maximumFractionDigits: 2 }) + ' kr' : '-';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="bar-chart-2" size={24} className="text-indigo-600"/> 
                    Meta Rapportering
                </h2>
                <div className="flex gap-3">
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors">
                        <Icon name="file-spreadsheet" size={16} /> Last opp Meta CSV
                        <input type="file" accept=".csv" className="hidden" ref={csvInputRef} onChange={handleCsvUpload} />
                    </label>
                    <button onClick={() => setIsFormOpen(!isFormOpen)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isFormOpen ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                        <Icon name={isFormOpen ? "x" : "plus"} size={16} /> {isFormOpen ? "Lukk skjema" : "Manuell inntasting"}
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b pb-2">Ny registrering</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Rapportering Start</label><input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Reach</label><input type="number" name="reach" value={form.reach} onChange={handleChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Impressions</label><input type="number" name="impressions" value={form.impressions} onChange={handleChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Amount Spent (NOK)</label><input type="number" step="0.01" name="spend" value={form.spend} onChange={handleChange} className="w-full border p-2 rounded bg-yellow-50" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Frequency</label><input type="number" step="0.01" name="frequency" value={form.frequency} onChange={handleChange} className="w-full border p-2 rounded" placeholder="1.0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Link Clicks</label><input type="number" name="linkClicks" value={form.linkClicks} onChange={handleChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CPC (Link)</label><input type="number" step="0.01" name="cpcLink" value={form.cpcLink} onChange={handleChange} className="w-full border p-2 rounded" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CPM</label><input type="number" step="0.01" name="cpm" value={form.cpm} onChange={handleChange} className="w-full border p-2 rounded" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Clicks (All)</label><input type="number" name="clicksAll" value={form.clicksAll} onChange={handleChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CTR (All)</label><input type="number" step="0.01" name="ctrAll" value={form.ctrAll} onChange={handleChange} className="w-full border p-2 rounded" placeholder="%" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CPC (All)</label><input type="number" step="0.01" name="cpcAll" value={form.cpcAll} onChange={handleChange} className="w-full border p-2 rounded" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Landing Views</label><input type="number" name="landingPageViews" value={form.landingPageViews} onChange={handleChange} className="w-full border p-2 rounded bg-green-50" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Cost / Landing</label><input type="number" step="0.01" name="costPerLandingPageView" value={form.costPerLandingPageView} onChange={handleChange} className="w-full border p-2 rounded bg-green-50" placeholder="kr" /></div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-5 flex justify-end mt-2"><button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-indigo-700">Lagre</button></div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-auto custom-scrollbar">
                    {sortedData.length > 0 ? (
                        <table className="w-full text-xs text-left whitespace-nowrap">
                            <thead className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-3 border-b shadow-sm bg-slate-100 sticky left-0 z-20">Dato</th>
                                    <th className="px-3 py-3 border-b text-right bg-yellow-50">Spend</th>
                                    <th className="px-3 py-3 border-b text-right">Impr.</th>
                                    <th className="px-3 py-3 border-b text-right">Reach</th>
                                    <th className="px-3 py-3 border-b text-right">Freq.</th>
                                    <th className="px-3 py-3 border-b text-right">CPM</th>
                                    <th className="px-3 py-3 border-b text-right bg-blue-50">Link Clicks</th>
                                    <th className="px-3 py-3 border-b text-right bg-blue-50">CPC (Link)</th>
                                    <th className="px-3 py-3 border-b text-right bg-green-50">Land. Views</th>
                                    <th className="px-3 py-3 border-b text-right bg-green-50">Cost/Land.</th>
                                    <th className="px-3 py-3 border-b text-right">Clicks (All)</th>
                                    <th className="px-3 py-3 border-b text-right">CTR (All)</th>
                                    <th className="px-3 py-3 border-b text-center">Slett</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedData.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-3 py-2 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.date}</td>
                                        <td className="px-3 py-2 text-right font-bold text-slate-800 bg-yellow-50/50">{kr(row.spend)}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{fmt(row.impressions)}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{fmt(row.reach)}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{fmt(row.frequency, 2)}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{kr(row.cpm)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-blue-700 bg-blue-50/30">{fmt(row.linkClicks)}</td>
                                        <td className="px-3 py-2 text-right text-blue-700 bg-blue-50/30">{kr(row.cpcLink)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-emerald-700 bg-green-50/30">{fmt(row.landingPageViews)}</td>
                                        <td className="px-3 py-2 text-right text-emerald-700 bg-green-50/30">{kr(row.costPerLandingPageView)}</td>
                                        <td className="px-3 py-2 text-right text-slate-400">{fmt(row.clicksAll)}</td>
                                        <td className="px-3 py-2 text-right text-slate-400">{fmt(row.ctrAll, 2)}%</td>
                                        <td className="px-3 py-2 text-center">
                                            <button onClick={() => onDeleteKpi(row.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Slett linje"><Icon name="trash-2" size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-10 text-center text-slate-400"><p className="mb-2">Ingen data lastet opp.</p><p className="text-sm">Trykk "Last opp Meta CSV" eller legg inn manuelt.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};
