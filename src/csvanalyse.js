// --- HJELPERE FOR FORMATERING (Beholdt og utvidet) ---
const fmtMoney = (val) => val !== undefined && val !== null && !isNaN(val) ? Math.round(val).toLocaleString('nb-NO') : '-';
const fmtNum = (val) => val !== undefined && val !== null && !isNaN(val) ? Math.round(val).toLocaleString('nb-NO') : '-';
const fmtDec = (val) => val !== undefined && val !== null && !isNaN(val) ? val.toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-';
const fmtROAS = (val) => val !== undefined && val !== null && !isNaN(val) ? val.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

// --- TRIPPELSJEKKET CSV PARSER ---
window.parseMetaCSV = (csvText) => {
    // Robust funksjon for å splitte CSV-linjer nøyaktig, selv med komma i tekst
    const parseLine = (line) => {
        let row = [];
        let buffer = '';
        let inQuote = false;
        for (let char of line) {
            if (char === '"') { inQuote = !inQuote; }
            else if (char === ',' && !inQuote) { row.push(buffer.trim()); buffer = ''; }
            else { buffer += char; }
        }
        row.push(buffer.trim());
        return row.map(val => val.replace(/^"|"$/g, '').trim());
    };

    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    // Bruker samme robuste logikk på headers som på rader
    const headers = parseLine(lines[0]);
    
    const fieldMap = {
        'Reporting starts': 'date', 'Rapportering starter': 'date',
        'Campaign name': 'campaignName',
        'Campaign delivery': 'delivery',
        'Amount spent (NOK)': 'spend', 'Beløp brukt (NOK)': 'spend',
        'Impressions': 'impressions', 'Eksponeringer': 'impressions',
        'Reach': 'reach', 'Rekkevidde': 'reach',
        'Frequency': 'frequency', 'Frekvens': 'frequency',
        'CPM (cost per 1,000 impressions) (NOK)': 'cpm',
        'Link clicks': 'linkClicks', 'Klikk på lenke': 'linkClicks',
        'CPC (cost per link click) (NOK)': 'cpcLink',
        'CTR (link click-through rate)': 'ctrLink',
        'Landing page views': 'landingPageViews',
        'Adds to cart': 'atc',
        'Adds to cart conversion value': 'atcValue',
        'Purchases': 'purchases',
        'Purchases conversion value': 'revenue',
        'Purchase ROAS (return on ad spend)': 'roas'
    };

    const result = [];
    const indices = {};
    headers.forEach((h, i) => { if (fieldMap[h]) indices[fieldMap[h]] = i; });

    for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        const obj = { id: Date.now() + Math.random() };
        let hasData = false;

        Object.keys(indices).forEach(key => {
            const index = indices[key];
            let val = row[index] || '';
            if (val) {
                if (['date', 'campaignName', 'delivery'].includes(key)) {
                    obj[key] = val;
                } else {
                    if (val.includes(',') && !val.includes('.')) val = val.replace(',', '.');
                    obj[key] = parseFloat(val) || 0;
                }
                hasData = true;
            }
        });

        // KRAV: Kun active kampanjer og gyldig dato
        if (hasData && obj.date && obj.delivery === 'active') {
            // Kalkulerer CTR hvis den mangler, slik originalen gjorde
            if (!obj.ctrLink && obj.linkClicks && obj.impressions) {
                obj.ctrLink = (obj.linkClicks / obj.impressions) * 100;
            }
            result.push(obj);
        }
    }
    return result;
};

// --- KOMPLETT TABELL-KOMPONENT (Ingen funksjonalitet slettet) ---
window.AnalyseTable = ({ data, onDelete }) => {
    const Icon = window.Icon;
    const [isExpanded, setIsExpanded] = React.useState(false);
    const sortedData = [...(data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const visibleData = isExpanded ? sortedData : sortedData.slice(0, 5);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm italic">The Curated Exhibition (Aktive Kampanjer)</h3>
                <span className="text-xs text-slate-500">{sortedData.length} dager</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left whitespace-nowrap">
                    <thead className="font-bold text-slate-500 uppercase bg-white border-b">
                        <tr>
                            <th className="px-2 py-3">Dato / Kampanje</th>
                            <th className="px-2 py-3 text-right">Spend</th>
                            <th className="px-2 py-3 text-right">Impr. / Reach</th>
                            <th className="px-2 py-3 text-right">CPM / CPC</th>
                            <th className="px-2 py-3 text-right text-indigo-600">Klikk (CTR)</th>
                            <th className="px-2 py-3 text-right">ATC (Verdi)</th>
                            <th className="px-2 py-3 text-right">Kjøp</th>
                            <th className="px-2 py-3 text-right">Omsetning</th>
                            <th className="px-2 py-3 text-right font-bold text-indigo-600 border-l">ROAS</th>
                            <th className="px-2 py-3 text-center">Slett</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleData.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-2 py-2">
                                    <div className="font-medium text-slate-700">{row.date}</div>
                                    <div className="text-[9px] text-slate-400 truncate max-w-[120px]">{row.campaignName}</div>
                                </td>
                                <td className="px-2 py-2 text-right font-bold text-slate-800">{fmtMoney(row.spend)} kr</td>
                                <td className="px-2 py-2 text-right text-slate-500">
                                    {fmtNum(row.impressions)} <br/> <span className="text-[9px] opacity-70">{fmtNum(row.reach)}</span>
                                </td>
                                <td className="px-2 py-2 text-right text-slate-500">
                                    {fmtMoney(row.cpm)} <br/> <span className="text-[9px] opacity-70">{fmtDec(row.cpcLink)} kr</span>
                                </td>
                                <td className="px-2 py-2 text-right text-indigo-600 font-medium">
                                    {fmtNum(row.linkClicks)} <br/> <span className="text-[9px]">{fmtDec(row.ctrLink)}%</span>
                                </td>
                                <td className="px-2 py-2 text-right text-slate-600">
                                    {row.atc || 0} <br/> <span className="text-[9px] opacity-70">{fmtMoney(row.atcValue)}</span>
                                </td>
                                <td className="px-2 py-2 text-right text-slate-600">{row.purchases || 0}</td>
                                <td className="px-2 py-2 text-right font-bold text-slate-800">{fmtMoney(row.revenue)} kr</td>
                                <td className="px-2 py-2 text-right font-bold text-indigo-600 border-l bg-indigo-50/30">{fmtROAS(row.roas)}x</td>
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => onDelete(row.id)} className="text-slate-300 hover:text-red-500 p-1">
                                        <Icon name="trash-2" size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
