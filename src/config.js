// /src/config.js

window.MEETMAX_CONFIG = {
    API_KEY: '$2a$10$POD7waxX5380sIzCicwFUejlDXC5wrch8IRkc409YItsJWSTnvpxO',
    BIN_ID: '68d6a28943b1c97be951089f',
    
    CAMPAIGN: { 
        dailyBudget: 500, 
        totalBudget: 15000, 
        BudgetTargetCPA: 50, 
        RunningTargetCPA: 30 
    },

    // KPI-KORT: Nå 16 stk (Perfekt 4x4 grid)
    KPI_CARDS: [
        // 1. RESULTAT & BUNNLINJE (Det viktigste først)
        { key: 'revenue', title: 'Inntekt (Salg)', isCurrency: true },
        { key: 'roas', title: 'ROAS', unit: 'x', decimals: 2 },
        { key: 'purchases', title: 'Antall Salg' }, // <- NÅ PÅ PLASS!
        { key: 'cpa', title: 'Cost Per Purchase', isCurrency: true, isReverse: true },
        
        // 2. KJØPSINTENSJON (Trakt)
        { key: 'landingPageViews', title: 'Landing Page Views' },
        { key: 'atc', title: 'Add to Cart (Antall)' },
        { key: 'atcValue', title: 'ATC Verdi', isCurrency: true },
        { key: 'spend', title: 'Totalt Forbruk', isCurrency: true, isReverse: true },

        // 3. KLIKK & TRAFIKK (Link)
        { key: 'linkClicks', title: 'Link Clicks' },
        { key: 'ctrLink', title: 'CTR (Link)', unit: '%', decimals: 2 },
        { key: 'cpcLink', title: 'CPC (Link)', isCurrency: true, isReverse: true },
        { key: 'frequency', title: 'Frekvens', decimals: 2, isReverse: true },

        // 4. SEKUNDÆRE TALL (Engasjement)
        { key: 'clicksAll', title: 'Klikk (Alle)' },
        { key: 'ctrAll', title: 'CTR (Alle)', unit: '%', decimals: 2 },
        { key: 'reach', title: 'Reach' },
        { key: 'impressions', title: 'Impressions' }
    ]
};

window.HOLIDAYS = {
    '2026-01-01': '1. Nyttårsdag',
    '2026-03-29': 'Palmesøndag',
    '2026-04-02': 'Skjærtorsdag',
    '2026-04-03': 'Langfredag',
    '2026-04-05': '1. Påskedag',
    '2026-04-06': '2. Påskedag',
    '2026-05-01': 'Offentlig høytidsdag',
    '2026-05-14': 'Kristi Himmelfart',
    '2026-05-17': 'Grunnlovsdag',
    '2026-05-24': '1. Pinsedag',
    '2026-05-25': '2. Pinsedag',
    '2026-12-25': '1. Juledag',
    '2026-12-26': '2. Juledag',
    '2027-01-01': '1. Nyttårsdag',
    '2027-03-21': 'Palmesøndag',
    '2027-03-25': 'Skjærtorsdag',
    '2027-03-26': 'Langfredag',
    '2027-03-28': '1. Påskedag',
    '2027-03-29': '2. Påskedag',
    '2027-05-01': 'Offentlig høytidsdag',
    '2027-05-06': 'Kristi Himmelfart',
    '2027-05-16': '1. Pinsedag',
    '2027-05-17': '17. mai / 2. Pinsedag',
    '2027-12-25': '1. Juledag',
    '2027-12-26': '2. Juledag'
};

window.COMMERCIAL_DAYS = {
    '2026-02-08': 'Morsdag',
    '2026-02-14': 'Valentines Day',
    '2026-02-15': 'Fastelavn',
    '2026-02-16': 'Vinterferie',
    '2026-02-23': 'Vinterferie',
    '2026-10-31': 'Halloween',
    '2026-11-27': 'Black Friday',
    '2026-11-30': 'Cyber Monday'
};

window.TASK_TYPES = {
    'FB_ORG': { label: 'FB Organisk', icon: 'facebook', color: 'text-blue-600', bg: 'bg-blue-100', defaultTime: '10:00' },
    'FB_BOOST': { label: 'FB Boost (Ads)', icon: 'megaphone', color: 'text-green-600', bg: 'bg-green-100', defaultTime: '12:00' },
    'IG_POST': { label: 'Instagram', icon: 'instagram', color: 'text-pink-600', bg: 'bg-pink-100', defaultTime: '18:00' },
    'DM': { label: 'Nyhetsbrev', icon: 'mail', color: 'text-amber-600', bg: 'bg-amber-100', defaultTime: '14:00' },
    'MEETING': { label: 'Møte', icon: 'briefcase', color: 'text-teal-600', bg: 'bg-teal-100', defaultTime: '10:00' },
    'ADMIN': { label: 'Admin', icon: 'lock', color: 'text-slate-600', bg: 'bg-slate-100', defaultTime: '09:00' },
    'OTHER': { label: 'Annet', icon: 'info', color: 'text-violet-600', bg: 'bg-violet-100', defaultTime: '12:00' }
};
