// --- HJELPERE FOR FORMATERING ---
const formatCurrency = (val) => val !== undefined && val !== null ? Math.round(val).toLocaleString('nb-NO') : '0';
const formatNumber = (val) => val !== undefined && val !== null ? Math.round(val).toLocaleString('nb-NO') : '0';
const formatDec = (val) => val !== undefined && val !== null ? val.toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';
const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.getDate() + '.' + (d.getMonth() + 1); 
};

// --- KONFIGURASJON FOR GRAFER ---
const G = {
    w: 300, 
    h: 150, 
    padL: 35, 
    padR: 35, 
    padT: 20, 
    padB: 20, 
    graphW: () => 300 - 35 - 35, 
    graphH: () => 150 - 20 - 20, 
    y: (val, max) => 20 + (110 - (val / (max || 1)) * 110),
    // Standard X-funksjon (brukes av små grafer)
    x: (i, count) => {
        if (count <= 1) return 150; 
        return 35 + (i / (count - 1)) * 230;
    }
};

// --- GRAFKOMPONENTER (SVG) ---

const GridLines = ({ width }) => {
    const w = width || G.w; // Bruk tilsendt bredde eller default 300
    return (
        <g stroke="#f1f5f9" strokeWidth="1">
            <line x1={G.padL} y1={G.padT} x2={w - G.padR} y2={G.padT} />
            <line x1={G.padL} y1={G.padT + G.graphH()/2} x2={w - G.padR} y2={G.padT + G.graphH()/2} strokeDasharray="4" />
            <line x1={G.padL} y1={G.h - G.padB} x2={w - G.padR} y2={G.h - G.padB} />
        </g>
    );
};

const YAxis = ({ max, unit = '', color = '#94a3b8', align = 'left', width }) => {
    const w = width || G.w;
    const mid = max / 2;
    const xPos = align === 'left' ? G.padL - 5 : w - G.padR + 5;
    const anchor = align === 'left' ? 'end' : 'start';
    return (
        <g fill={color} textAnchor={anchor} fontSize="8" fontWeight="500" style={{ fontFamily: 'sans-serif' }}>
            <text x={xPos} y={G.padT + 3} alignmentBaseline="middle">{formatNumber(max)}{unit}</text>
            <text x={xPos} y={G.padT + G.graphH()/2 + 3} alignmentBaseline="middle">{formatNumber(mid)}{unit}</text>
            <text x={xPos} y={G.h - G.padB + 3} alignmentBaseline="middle">0{unit}</text>
        </g>
    );
};

const XAxis = ({ data, width }) => {
    if (!data || data.length === 0) return null;
    const w = width || G.w;
    
    // Dynamisk X-kalkulator basert på bredde
    const getLocalX = (i, total) => {
        if (total <= 1) return w / 2;
        const usableW = w - G.padL - G.padR;
        return G.padL + (i / (total - 1)) * usableW;
    };

    const step = Math.ceil(data.length / 8); 
    return (
        <g fill="#94a3b8" textAnchor="middle" fontSize="8" style={{ fontFamily: 'sans-serif' }}>
            {data.map((d, i) => {
                if (i % step !== 0 && i !== data.length - 1) return null; 
                const x = getLocalX(i, data.length);
                return <text key={i} x={x} y={G.h - 5}>{formatDateShort(d.date)}</text>;
            })}
        </g>
    );
};

// Graf 1: ROI (Nå med bredde 800px for å unngå strukket tekst)
const CostEffectChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Ingen data</div>;
    
    // VIKTIG: Bredde satt til 800 for denne grafen
    const chartW = 800; 

    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxSpend = Math.max(...sorted.map(d => d.spend)) || 100;
    const maxClicks = Math.max(...sorted.map(d => d.linkClicks)) || 10;
    const count = sorted.length;
    const [hover, setHover] = React.useState(null);

    // Lokal X-kalkulator for 800px bredde
    const getX = (i, total) => {
        if (total <= 1) return chartW / 2;
        const usableW = chartW - G.padL - G.padR;
        return G.padL + (i / (total - 1)) * usableW;
    };

    const barWidth = count === 1 ? 40 : ((chartW - G.padL - G.padR) / count) * 0.6;
    const points = sorted.map((d, i) => `${getX(i, count)},${G.y(d.linkClicks, maxClicks)}`).join(' ');

    return (
        <div className="relative h-64 w-full" onMouseLeave={() => setHover(null)}>
            {/* preserveAspectRatio="xMidYMid meet" beholder proporsjoner, men viewBox er nå bred (800) */}
            <svg viewBox={`0 0 ${chartW} ${G.h}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                <GridLines width={chartW} />
                <YAxis max={maxSpend} unit=" kr" color="#a5b4fc" align="left" width={chartW} />
                <YAxis max={maxClicks} unit="" color="#6366f1" align="right" width={chartW} />
                <XAxis data={sorted} width={chartW} />

                {sorted.map((d, i) => {
                    const barH = (d.spend / maxSpend) * G.graphH();
                    const x = getX(i, count);
                    return (
                        <rect key={i} x={x - barWidth/2} y={G.h - G.padB - barH} width={barWidth} height={barH} 
                              fill={hover === i ? "#a5b4fc" : "#e0e7ff"} rx="1" 
                              onMouseEnter={() => setHover(i)} className="transition-all duration-200" />
                    );
                })}

                {count > 1 ? (
                    <polyline fill="none" stroke="#6366f1" strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                    <line x1={getX(0, count) - 20} y1={G.y(sorted[0].linkClicks, maxClicks)} x2={getX(0, count) + 20} y2={G.y(sorted[0].linkClicks, maxClicks)} stroke="#6366f1" strokeWidth="1.5" />
                )}

                {sorted.map((d, i) => (
                    <circle key={i} cx={getX(i, count)} cy={G.y(d.linkClicks, maxClicks)} r={hover===i?3:1.5} fill="white" stroke="#6366f1" strokeWidth="1.5" className="transition-all" />
                ))}

                {sorted.map((d, i) => {
                    const zoneW = (chartW - G.padL - G.padR) / count;
                    return <rect key={i} x={getX(i, count) - zoneW/2} y={G.padT} width={zoneW} height={G.graphH()} fill="transparent" onMouseEnter={() => setHover(i)} />;
                })}
            </svg>

            {hover !== null && sorted[hover] && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs pointer-events-none z-20 whitespace-nowrap mt-2">
                    <div className="font-bold text-slate-300 border-b border-slate-700 mb-1 pb-1 text-[10px] uppercase">{sorted[hover].date}</div>
                    <div className="flex justify-between gap-4"><span className="text-indigo-200">Spend:</span> <span className="font-bold">{formatCurrency(sorted[hover].spend)} kr</span></div>
                    <div className="flex justify-between gap-4"><span className="text-white">Clicks:</span> <span className="font-bold">{formatNumber(sorted[hover].linkClicks)}</span></div>
                </div>
            )}
             <div className="absolute top-4 right-4 flex gap-3 text-[10px] font-bold">
                <span className="text-indigo-600 flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-600"></span> Link Clicks</span>
                <span className="text-indigo-300 flex items-center gap-1"><span className="w-2 h-2 bg-indigo-100 border border-indigo-200"></span> Spend</span>
            </div>
        </div>
    );
};

// Graf 2: Pris (Standard 300 bredde)
const PriceTrendChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Ingen data</div>;
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const processed = sorted.map(d => ({
        ...d,
        cpc: d.cpcLink || (d.linkClicks > 0 ? d.spend / d.linkClicks : 0),
        cpm: d.cpm || (d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0)
    }));
    const maxCpc = Math.max(...processed.map(d => d.cpc)) || 10;
    const maxCpm = Math.max(...processed.map(d => d.cpm)) || 100;
    const count = processed.length;
    const [hover, setHover] = React.useState(null);

    const pointsCpc = processed.map((d, i) => `${G.x(i, count)},${G.y(d.cpc, maxCpc)}`).join(' ');
    const pointsCpm = processed.map((d, i) => `${G.x(i, count)},${G.y(d.cpm, maxCpm)}`).join(' ');

    return (
        <div className="relative h-64 w-full" onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${G.w} ${G.h}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                <GridLines />
                <YAxis max={maxCpc} unit=" kr" color="#10b981" align="left" />
                <YAxis max={maxCpm} unit=" kr" color="#f59e0b" align="right" />
                <XAxis data={sorted} />
                
                {count > 1 ? (
                    <>
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" points={pointsCpm} strokeDasharray="4" className="opacity-70" />
                        <polyline fill="none" stroke="#10b981" strokeWidth="1.5" points={pointsCpc} />
                    </>
                ) : (
                    <>
                         <circle cx="150" cy={G.y(processed[0].cpm, maxCpm)} r="3" fill="#f59e0b" />
                         <circle cx="150" cy={G.y(processed[0].cpc, maxCpc)} r="3" fill="#10b981" />
                    </>
                )}
                
                {processed.map((d, i) => {
                    const zoneW = G.graphW() / count;
                    return <rect key={i} x={G.x(i, count) - zoneW/2} y={G.padT} width={zoneW} height={G.graphH()} fill="transparent" onMouseEnter={() => setHover(i)} />;
                })}
            </svg>
            {hover !== null && processed[hover] && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs pointer-events-none z-20 whitespace-nowrap mt-2">
                    <div className="font-bold text-slate-300 border-b border-slate-700 mb-1 pb-1 text-[10px] uppercase">{processed[hover].date}</div>
                    <div className="flex justify-between gap-4"><span className="text-emerald-400">CPC:</span> <span className="font-bold">{formatDec(processed[hover].cpc)} kr</span></div>
                    <div className="flex justify-between gap-4"><span className="text-amber-400">CPM:</span> <span className="font-bold">{formatCurrency(processed[hover].cpm)} kr</span></div>
                </div>
            )}
             <div className="absolute top-4 right-4 flex gap-3 text-[10px] font-bold">
                <span className="text-emerald-600 flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500"></span> CPC</span>
                <span className="text-amber-500 flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-500 border-b border-amber-500 border-dashed"></span> CPM</span>
            </div>
        </div>
    );
};

// Graf 3: Metning (Standard 300 bredde)
const SaturationChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Ingen data</div>;
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxVal = Math.max(...sorted.map(d => Math.max(d.impressions, d.reach))) || 1000;
    const count = sorted.length;
    const [hover, setHover] = React.useState(null);

    const buildPath = (key) => {
        if (count <= 1) return ''; 
        const points = sorted.map((d, i) => `${G.x(i, count)},${G.y(d[key], maxVal)}`);
        return `M${G.x(0,count)},${G.h-G.padB} ${points.map(p => 'L' + p).join(' ')} L${G.x(count-1,count)},${G.h-G.padB} Z`;
    };

    return (
        <div className="relative h-64 w-full" onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${G.w} ${G.h}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                <GridLines />
                <YAxis max={maxVal} unit="" color="#64748b" align="left" />
                <XAxis data={sorted} />

                {count > 1 ? (
                    <>
                        <path d={buildPath('impressions')} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="1.5" />
                        <path d={buildPath('reach')} fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="1.5" />
                    </>
                ) : (
                     <>
                        <rect x="145" y={G.y(sorted[0].impressions, maxVal)} width="10" height={G.h - G.padB - G.y(sorted[0].impressions, maxVal)} fill="rgba(59, 130, 246, 0.5)" />
                        <rect x="155" y={G.y(sorted[0].reach, maxVal)} width="10" height={G.h - G.padB - G.y(sorted[0].reach, maxVal)} fill="rgba(168, 85, 247, 0.5)" />
                     </>
                )}
                
                {sorted.map((d, i) => {
                    const zoneW = G.graphW() / count;
                    return <rect key={i} x={G.x(i, count) - zoneW/2} y={G.padT} width={zoneW} height={G.graphH()} fill="transparent" onMouseEnter={() => setHover(i)} />;
                })}
            </svg>
            {hover !== null && sorted[hover] && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs pointer-events-none z-20 whitespace-nowrap mt-2">
                    <div className="font-bold text-slate-300 border-b border-slate-700 mb-1 pb-1 text-[10px] uppercase">{sorted[hover].date}</div>
                    <div className="flex justify-between gap-4"><span className="text-blue-300">Impr:</span> <span className="font-bold">{formatNumber(sorted[hover].impressions)}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-purple-300">Reach:</span> <span className="font-bold">{formatNumber(sorted[hover].reach)}</span></div>
                </div>
            )}
            <div className="absolute top-4 right-4 flex gap-3 text-[10px] font-bold">
                <span className="text-blue-500 flex items-center gap-1"><span className="w-2 h-2 bg-blue-100 border border-blue-500"></span> Impr.</span>
                <span className="text-purple-500 flex items-center gap-1"><span className="w-2 h-2 bg-purple-100 border border-purple-500"></span> Reach</span>
            </div>
        </div>
    );
};

// --- SCORECARD ---
const ScoreCard = ({ title, value, previousValue, isCurrency, isReverse, unit = '', decimals = 0 }) => {
    const Icon = window.Icon;
    const hasPrev = previousValue !== undefined && previousValue !== null && !isNaN(previousValue);
    const diff = value - (previousValue || 0);
    const diffPercent = (hasPrev && previousValue > 0) ? (diff / previousValue) * 100 : 0;
    
    let color = "text-slate-400";
    let iconName = "minus";

    if (hasPrev && Math.abs(diff) > 0) {
        if (diff > 0) {
            color = isReverse ? "text-red-500" : "text-emerald-500";
            iconName = "trending-up";
        } else {
            color = isReverse ? "text-emerald-500" : "text-red-500";
            iconName = "trending-down";
        }
    }

    const formatValue = (v) => {
        if (v === undefined || v === null) return '-';
        if (isCurrency) return Math.round(v).toLocaleString('nb-NO') + ' kr';
        if (unit === '%') return v.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        if (decimals > 0) return v.toLocaleString('nb-NO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + unit;
        return Math.round(v).toLocaleString('nb-NO') + unit;
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</h3>
            <div>
                <div className="text-2xl font-extrabold text-slate-800">
                    {formatValue(value)}
                </div>
                {hasPrev && previousValue > 0 ? (
                    <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${color}`}>
                        <Icon name={iconName} size={12} />
                        <span>{Math.abs(diffPercent).toFixed(1)}%</span>
                        <span className="text-slate-400 font-normal ml-1">vs {formatValue(previousValue)}</span>
                    </div>
                ) : (
                    <div className="text-xs text-slate-300 mt-1">Ingen data forrige periode</div>
                )}
            </div>
        </div>
    );
};

// --- HOVEDKOMPONENT ---
window.AnalyseDashboard = ({ kpiData, onAddKpi, onDeleteKpi }) => {
    const Icon = window.Icon;
    const { useState, useRef, useEffect } = React;
    const csvInputRef = useRef(null);

    // STATE
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterType, setFilterType] = useState('last30'); 
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Initialiser datoer
    useEffect(() => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (filterType === 'today') {
            // start = end = today
        } else if (filterType === 'last7') {
            start.setDate(today.getDate() - 6);
        } else if (filterType === 'last30') {
            start.setDate(today.getDate() - 29);
        } else if (filterType === 'thisMonth') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (filterType === 'lastMonth') {
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (filterType === 'custom') {
            return; 
        }

        setDateRange({ 
            start: start.toISOString().split('T')[0], 
            end: end.toISOString().split('T')[0] 
        });
    }, [filterType]);

    // Filtrering
    const getFilteredData = (rangeStart, rangeEnd) => {
        if (!kpiData) return [];
        return kpiData.filter(d => d.date >= rangeStart && d.date <= rangeEnd);
    };

    // Beregn forrige periode
    const getPreviousRange = () => {
        if (!dateRange.start || !dateRange.end) return { start: '', end: '' };
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const prevEnd = new Date(start);
        prevEnd.setDate(start.getDate() - 1);
        
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevEnd.getDate() - diffDays + 1);

        return {
            start: prevStart.toISOString().split('T')[0],
            end: prevEnd.toISOString().split('T')[0]
        };
    };

    const currentData = getFilteredData(dateRange.start, dateRange.end);
    const prevRange = getPreviousRange();
    const prevData = getFilteredData(prevRange.start, prevRange.end);

    // Aggregater
    const sum = (data, key) => data.reduce((acc, curr) => acc + (curr[key] || 0), 0);
    const avg = (data, key) => data.length > 0 ? sum(data, key) / data.length : 0;
    
    const calcCtr = (data) => {
        const clicks = sum(data, 'linkClicks');
        const impr = sum(data, 'impressions');
        return impr > 0 ? (clicks / impr) * 100 : 0;
    };
    
    const calcCpc = (data) => {
        const spend = sum(data, 'spend');
        const clicks = sum(data, 'linkClicks');
        return clicks > 0 ? spend / clicks : 0;
    };

    const totals = {
        spend: sum(currentData, 'spend'),
        clicks: sum(currentData, 'linkClicks'),
        cpc: calcCpc(currentData),
        ctr: calcCtr(currentData),
        impressions: sum(currentData, 'impressions'),
        reach: sum(currentData, 'reach'),
        frequency: avg(currentData, 'frequency')
    };

    const prevTotals = {
        spend: sum(prevData, 'spend'),
        clicks: sum(prevData, 'linkClicks'),
        cpc: calcCpc(prevData),
        ctr: calcCtr(prevData),
        impressions: sum(prevData, 'impressions'),
        reach: sum(prevData, 'reach'),
        frequency: avg(prevData, 'frequency')
    };

    // Handlers
    const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), reach:'', frequency:'', spend:'', impressions:'', cpm:'', linkClicks:'', cpcLink:'', clicksAll:'', ctrAll:'', cpcAll:'', landingPageViews:'', costPerLandingPageView:'' });
    const handleFormChange = (e) => setForm({...form, [e.target.name]: e.target.value});
    const handleFormSubmit = (e) => {
        e.preventDefault();
        const numData = { id: Date.now(), ...form };
        Object.keys(numData).forEach(k => { if(k!=='id'&&k!=='date') numData[k]=parseFloat(numData[k])||0; });
        onAddKpi(numData);
        setIsFormOpen(false);
    };
    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const res = window.parseMetaCSV(ev.target.result);
            if(res.length && confirm(`Fant ${res.length} rader. Importere?`)) res.forEach(r => onAddKpi(r));
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* 1. TOP BAR */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-2 flex-wrap">
                     <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mr-4">
                        <Icon name="bar-chart-2" size={24} className="text-indigo-600"/> 
                        Meta Analyse
                    </h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <select className="bg-transparent text-sm font-bold text-slate-700 outline-none px-2 py-1 cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="today">I dag</option>
                            <option value="last7">Siste 7 dager</option>
                            <option value="last30">Siste 30 dager</option>
                            <option value="thisMonth">Denne måneden</option>
                            <option value="lastMonth">Forrige måned</option>
                            <option value="custom">Egendefinert...</option>
                        </select>
                    </div>
                    {(filterType === 'custom' || true) && (
                        <div className={`flex items-center gap-2 text-sm transition-all ${filterType !== 'custom' ? 'opacity-50 grayscale pointer-events-none hidden md:flex' : ''}`}>
                            <input type="date" className="border rounded px-2 py-1 bg-white" value={dateRange.start} onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); setFilterType('custom'); }} />
                            <span className="text-slate-400">til</span>
                            <input type="date" className="border rounded px-2 py-1 bg-white" value={dateRange.end} onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); setFilterType('custom'); }} />
                        </div>
                    )}
                </div>
                <div className="flex gap-2 w-full xl:w-auto">
                    <label className="flex-1 xl:flex-none justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
                        <Icon name="file-spreadsheet" size={14} /> CSV Import
                        <input type="file" accept=".csv" className="hidden" ref={csvInputRef} onChange={handleCsvUpload} />
                    </label>
                    <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex-1 xl:flex-none justify-center px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700">
                        <Icon name={isFormOpen ? "x" : "plus"} size={14} /> Manuell
                    </button>
                </div>
            </div>

            {/* 2. SCORECARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Totalt Forbruk */}
                <ScoreCard title="Totalt Forbruk" value={totals.spend} previousValue={prevTotals.spend} isCurrency={true} isReverse={true} />
                
                {/* 2. Reach */}
                <ScoreCard title="Reach" value={totals.reach} previousValue={prevTotals.reach} />
                
                {/* 3. Impressions */}
                <ScoreCard title="Impressions" value={totals.impressions} previousValue={prevTotals.impressions} />
                
                {/* 4. Frequency (Reverse logic: Down is Green) */}
                <ScoreCard title="Frequency" value={totals.frequency} previousValue={prevTotals.frequency} unit="" decimals={2} isReverse={true} /> 
                
                {/* 5. Link Clicks */}
                <ScoreCard title="Link Clicks" value={totals.clicks} previousValue={prevTotals.clicks} />
                
                {/* 6. CTR */}
                <ScoreCard title="CTR (Click-Through)" value={totals.ctr} previousValue={prevTotals.ctr} unit="%" decimals={2} />
                
                {/* 7. Snitt CPC */}
                <ScoreCard title="Snitt CPC (Link)" value={totals.cpc} previousValue={prevTotals.cpc} unit=" kr" decimals={2} isReverse={true} />
            </div>

            {/* 3. GRAFER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-6 flex justify-between">
                        <span>💰 Kostnad vs Effekt (ROI)</span>
                        <span className="text-xs font-normal text-slate-400">Er trafikken verdt prisen?</span>
                    </h3>
                    <CostEffectChart data={currentData} />
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-6 flex justify-between">
                        <span>📈 Prisutvikling</span>
                        <span className="text-xs font-normal text-slate-400">Blir annonsene dyrere?</span>
                    </h3>
                    <PriceTrendChart data={currentData} />
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-6 flex justify-between">
                        <span>📢 Metning (Frequency)</span>
                        <span className="text-xs font-normal text-slate-400">Maser vi på folk?</span>
                    </h3>
                    <SaturationChart data={currentData} />
                </div>
            </div>

            {/* 4. MANUELT SKJEMA */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2">
                     <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b pb-2">Ny registrering</h3>
                    <form onSubmit={handleFormSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Dato</label><input type="date" name="date" value={form.date} onChange={handleFormChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Reach</label><input type="number" name="reach" value={form.reach} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Impressions</label><input type="number" name="impressions" value={form.impressions} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Spend (NOK)</label><input type="number" step="0.01" name="spend" value={form.spend} onChange={handleFormChange} className="w-full border p-2 rounded bg-yellow-50" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Frequency</label><input type="number" step="0.01" name="frequency" value={form.frequency} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="1.0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Link Clicks</label><input type="number" name="linkClicks" value={form.linkClicks} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CPC (Link)</label><input type="number" step="0.01" name="cpcLink" value={form.cpcLink} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CPM</label><input type="number" step="0.01" name="cpm" value={form.cpm} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Clicks (All)</label><input type="number" name="clicksAll" value={form.clicksAll} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CTR (All)</label><input type="number" step="0.01" name="ctrAll" value={form.ctrAll} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="%" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">CPC (All)</label><input type="number" step="0.01" name="cpcAll" value={form.cpcAll} onChange={handleFormChange} className="w-full border p-2 rounded" placeholder="kr" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Landing Views</label><input type="number" name="landingPageViews" value={form.landingPageViews} onChange={handleFormChange} className="w-full border p-2 rounded bg-green-50" placeholder="0" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Cost / Landing</label><input type="number" step="0.01" name="costPerLandingPageView" value={form.costPerLandingPageView} onChange={handleFormChange} className="w-full border p-2 rounded bg-green-50" placeholder="kr" /></div>
                        <div className="col-span-1 md:col-span-2 lg:col-span-5 flex justify-end mt-2"><button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-indigo-700">Lagre</button></div>
                    </form>
                </div>
            )}

            {/* 5. TABELL COMPONENT (Ligger i csvanalyse.js) */}
            <window.AnalyseTable data={kpiData} onDelete={onDeleteKpi} />
        </div>
    );
};
