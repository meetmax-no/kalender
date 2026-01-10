// --- HJELPERE FOR FORMATERING (Lokalt i denne filen) ---
const fmtMoney = (val) => val !== undefined && val !== null ? Math.round(val).toLocaleString('nb-NO') : '-';
const fmtNum = (val) => val !== undefined && val !== null ? Math.round(val).toLocaleString('nb-NO') : '-';
const fmtDec = (val) => val !== undefined && val !== null ? val.toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-';

// --- CSV PARSER ---
window.parseMetaCSV = (csvText) => {
    const splitCSV = (str) => {
        const matches = str.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
    };
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = splitCSV(lines[0]);
    
    const fieldMap = {
        'Reporting starts': 'date', 'Rapportering starter': 'date',
        'Amount spent (NOK)': 'spend', 'Beløp brukt (NOK)': 'spend',
        'Impressions': 'impressions', 'Eksponeringer': 'impressions',
        'Reach': 'reach', 'Rekkevidde': 'reach',
        'Frequency': 'frequency', 'Frekvens': 'frequency',
        'CPM (cost per 1,000 impressions) (NOK)': 'cpm', 'CPM (kostnad per 1000 eksponeringer) (NOK)': 'cpm',
        'Link clicks': 'linkClicks', 'Klikk på lenke': 'linkClicks',
        'CPC (cost per link click) (NOK)': 'cpcLink', 'CPC (kostnad per klikk på lenke) (NOK)': 'cpcLink',
        'Clicks (all)': 'clicksAll', 'Klikk (alle)': 'clicksAll',
        'CTR (all)': 'ctrAll', 'CTR (alle)': 'ctrAll',
        'CPC (all) (NOK)': 'cpcAll', 'CPC (alle) (NOK)': 'cpcAll',
        'Landing page views': 'landingPageViews', 'Visninger av landingsside': 'landingPageViews',
        'Cost per landing page view (NOK)': 'costPerLandingPageView', 'Kostnad per visning av landingsside (NOK)': 'costPerLandingPageView',
        'CTR (link click-through rate)': 'ctrLink', 'CTR (klikkrate for lenke)': 'ctrLink' 
    };

    const result = [];
    const indices = {};
    headers.forEach((h, i) => { if (fieldMap[h]) indices[fieldMap[h]] = i; });

    for (let i = 1; i < lines.length; i++) {
        const row = [];
        let buffer = '';
        let inQuote = false;
        for (let char of lines[i]) {
            if (char === '"') { inQuote = !inQuote; }
            else if (char === ',' && !inQuote) { row.push(buffer); buffer = ''; }
            else { buffer += char; }
        }
        row.push(buffer);
        const obj = { id: Date.now() + Math.random() };
        let hasData = false;
        Object.keys(indices).forEach(key => {
            const index = indices[key];
            let val = row[index] ? row[index].replace(/^"|"$/g, '').trim() : '';
            if (val) {
                if (key === 'date') obj[key] = val;
                else {
                    if (val.includes(',') && !val.includes('.')) val = val.replace(',', '.');
                    obj[key] = parseFloat(val) || 0;
                }
                hasData = true;
            }
        });
        if (hasData && obj.date) {
            if (obj.ctrLink === undefined && obj.linkClicks && obj.impressions) {
                obj.ctrLink = (obj.linkClicks / obj.impressions) * 100;
            }
            result.push(obj);
        }
    }
    return result;
};

// --- TABELL KOMPONENT ---
window.AnalyseTable = ({ data, onDelete }) => {
    const Icon = window.Icon;
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Sorterer data her for å være sikker
    const sortedData = [...(data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const visibleData = isExpanded ? sortedData : sortedData.slice(0, 5);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm">Rådata</h3>
                <span className="text-xs text-slate-500">{sortedData.length} oppføringer totalt</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="text-[10px] font-bold text-slate-500 uppercase bg-white border-b">
                        <tr>
                            <th className="px-3 py-3">Dato</th>
                            <th className="px-3 py-3 text-right">Spend</th>
                            <th className="px-3 py-3 text-right">Impr.</th>
                            <th className="px-3 py-3 text-right">Reach</th>
                            <th className="px-3 py-3 text-right">Freq.</th>
                            <th className="px-3 py-3 text-right">CPM</th>
                            <th className="px-3 py-3 text-right">Link Clicks</th>
                            <th className="px-3 py-3 text-right">CPC (Link)</th>
                            <th className="px-3 py-3 text-right">CTR (Link)</th>
                            <th className="px-3 py-3 text-center">Slett</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleData.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-3 py-2 font-medium text-slate-700">{row.date}</td>
                                <td className="px-3 py-2 text-right font-bold text-slate-800">{fmtMoney(row.spend)} kr</td>
                                <td className="px-3 py-2 text-right text-slate-600">{fmtNum(row.impressions)}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{fmtNum(row.reach)}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{fmtDec(row.frequency)}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{fmtMoney(row.cpm)} kr</td>
                                <td className="px-3 py-2 text-right font-medium text-indigo-600">{fmtNum(row.linkClicks)}</td>
                                <td className="px-3 py-2 text-right text-indigo-600">{fmtDec(row.cpcLink)} kr</td>
                                <td className="px-3 py-2 text-right text-slate-600">{row.ctrLink ? row.ctrLink.toLocaleString('nb-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%' : ((row.linkClicks/row.impressions)*100).toLocaleString('nb-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%'}</td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => onDelete(row.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Icon name="trash-2" size={14} /></button>
                                </td>
                            </tr>
                        ))}
                        {sortedData.length > 5 && (
                            <tr onClick={() => setIsExpanded(!isExpanded)} className="bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border-t border-slate-200">
                                <td colSpan="10" className="py-3 text-center">
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        {isExpanded ? <>Skjul liste <Icon name="chevron-up" size={14}/></> : <>Vis eldre dager ({sortedData.length - 5} skjult) <Icon name="chevron-down" size={14}/></>}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
