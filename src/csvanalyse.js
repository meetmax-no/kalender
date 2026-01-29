// --- HJELPERE FOR FORMATERING ---
const fmtMoney = (val) => val !== undefined && val !== null && !isNaN(val) ? Math.round(val).toLocaleString('nb-NO') : '-';
const fmtNum = (val) => val !== undefined && val !== null && !isNaN(val) ? Math.round(val).toLocaleString('nb-NO') : '-';
// OPPDATERT: Nå med 2 faste desimaler for FREQ og CTR
const fmtDec = (val) => val !== undefined && val !== null && !isNaN(val) ? val.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
const fmtROAS = (val) => val !== undefined && val !== null && !isNaN(val) ? val.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

// --- TRIPPELSJEKKET CSV PARSER ---
window.parseMetaCSV = (csvText) => {
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
    
    const headers = parseLine(lines[0]);
    
    // MAPPING: Sikrer at vi treffer de nøyaktige kolonnenavnene fra din fil
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
        'Clicks (all)': 'clicksAll',
        'CTR (all)': 'ctrAll',
        'Landing page views': 'landingPageViews',
        'Adds to cart': 'atc',
        'Adds to cart conversion value': 'atcValue',
        'Checkouts initiated': 'checkouts',
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
            if (val !== '') {
                if (['date', 'campaignName', 'delivery'].includes(key)) {
                    obj[key] = val;
                } else {
                    // Håndterer desimaltegn uavhengig av eksportformat
                    if (val.includes(',') && !val.includes('.')) val = val.replace(',', '.');
                    const num = parseFloat(val);
                    obj[key] = !isNaN(num) ? num : 0;
                }
                hasData = true;
            }
        });

        // KRAV: Kun aktive kampanjer som har en dato
        if (hasData && obj.date && obj.delivery === 'active') {
            result.push(obj);
        }
    }
    return result;
};

// --- TABELLVISNING ---
window.AnalyseTable = ({ data, onDelete }) => {
    const Icon = window.Icon;
    const [isExpanded, setIsExpanded] = React.useState(false);
    const sortedData = [...(data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const visibleData = isExpanded ? sortedData : sortedData.slice(0, 5);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm">Fullstendig Datavisning (Aktive kampanjer)</h3>
                <span className="text-xs text-slate-500">{sortedData.length} aktive rader</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[9px] text-left whitespace-nowrap">
                    <thead className="font-bold text-slate-500 uppercase bg-white border-b">
                        <tr>
                            <th className="px-2 py-3">Dato</th>
                            <th className="px-2 py-3 text-right">Spend</th>
                            <th className="px-2 py-3 text-right">Freq.</th>
                            <th className="px-2 py-3 text-right">Klikk (L)</th>
                            <th className="px-2 py-3 text-right">CTR (L)</th>
                            <th className="px-2 py-3 text-right font-bold text-slate-900 italic">Klikk (A)</th>
                            <th className="px-2 py-3 text-right font-bold text-slate-900 italic">CTR (A)</th>
                            <th className="px-2 py-3 text-right font-bold text-slate-900">Inntekt</th>
                            <th className="px-2 py-3 text-right font-bold text-indigo-600">ROAS</th>
                            <th className="px-2 py-3 text-center">Slett</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visibleData.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-2 py-2 text-slate-700 font-medium">{row.date}</td>
                                <td className="px-2 py-2 text-right font-bold text-slate-800">{fmtMoney(row.spend)}</td>
                                <td className="px-2 py-2 text-right text-slate-600">{fmtDec(row.frequency)}</td>
                                <td className="px-2 py-2 text-right text-indigo-600">{fmtNum(row.linkClicks)}</td>
                                <td className="px-2 py-2 text-right text-indigo-600">{fmtDec(row.ctrLink)}%</td>
                                <td className="px-2 py-2 text-right text-slate-900 font-bold">{fmtNum(row.clicksAll)}</td>
                                <td className="px-2 py-2 text-right text-slate-900 font-bold">{fmtDec(row.ctrAll)}%</td>
                                <td className="px-2 py-2 text-right font-bold text-slate-900">{fmtMoney(row.revenue)}</td>
                                <td className="px-2 py-2 text-right font-bold text-indigo-600">{fmtROAS(row.roas)}x</td>
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => onDelete(row.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
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
