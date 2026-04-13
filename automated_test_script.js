function runLineupTest(format, numPlayers, testId) {
    const ROLES = ['S', 'F', 'M', 'D', 'G'];
    let players = [];

    // 1. Generate Random Players with short names (P1, P2, etc.)
    for (let i = 1; i <= numPlayers; i++) {
        let numRoles = Math.floor(Math.random() * 3) + 1;
        let playerRoles = new Set();
        while(playerRoles.size < numRoles) {
            playerRoles.add(ROLES[Math.floor(Math.random() * ROLES.length)]);
        }
        players.push({
            name: `P${i}`,
            roles: Array.from(playerRoles)
        });
    }

    // Force at least one dedicated goalie to avoid empty-net fallback skewing
    players[0].roles = ['G'];

    let testData = {
        teamName: `Auto-Test`,
        format: format,
        includeSummary: false,
        players: players
    };

    // 2. Inject Data and Trigger Engine
    localStorage.setItem('v1_SmartSub_Data', JSON.stringify(testData));
    loadUI();
    generate();

    // 3. Build Output String (Only printed if it fails)
    let out = `\n========== TEST ${testId}: ${format} | ${numPlayers} PLAYERS ==========\n`;
    
    out += `ROSTER PREFS:\n`;
    players.forEach(p => {
        out += `${p.name}: [${p.roles.join(',')}]  `;
    });
    out += `\n\nSHIFTS:\n`;

    let abbrMap = {
        'Striker': 'S', 'Forward (L)': 'FL', 'Forward (R)': 'FR', 'Midfield': 'M',
        'Defense (L)': 'DL', 'Defense (R)': 'DR', 'Mid (L)': 'ML', 'Mid (C)': 'MC', 'Mid (R)': 'MR',
        'Def (L)': 'DL', 'Def (C)': 'DC', 'Def (R)': 'DR', 'Mid (LC)': 'MLC', 'Mid (RC)': 'MRC',
        'Back (L)': 'BL', 'Back (LC)': 'BLC', 'Back (RC)': 'BRC', 'Back (R)': 'BR', 'Goalie': 'G'
    };

    let cards = document.querySelectorAll('#web-view .rotation-card');
    cards.forEach(card => {
        let titleText = card.querySelector('h2').innerText; 
        let titleMatch = titleText.match(/QUARTER (\d+)\s*SHIFT (\d+)/i);
        let shortTitle = titleMatch ? `Q${titleMatch[1]}S${titleMatch[2]}` : titleText.replace(/\n/g, ' ');

        let posElements = card.querySelectorAll('.pos');
        let onField = [];
        let fieldPlayerNames = [];
        
        posElements.forEach(pos => {
            let label = pos.querySelector('.label').innerText;
            let player = Array.from(pos.childNodes).find(n => n.nodeType === 3)?.textContent.trim() || "_";
            let shortLabel = abbrMap[label] || label;
            onField.push(`${shortLabel}:${player}`);
            if(player !== "_") fieldPlayerNames.push(player);
        });

        // Scrape the DOM for all active players (including generated ones like "Player X")
        let statsRows = document.querySelectorAll('.stats-table tr');
        let allActiveNames = [];
        for(let i = 1; i < statsRows.length; i++) {
            let n = statsRows[i].querySelectorAll('td')[0].innerText;
            if(!statsRows[i].classList.contains('absent-text')) {
                allActiveNames.push(n);
            }
        }

        let benched = allActiveNames.filter(p => !fieldPlayerNames.includes(p));
        let benchStr = benched.length > 0 ? benched.join(',') : "None";

        out += `${shortTitle} | Field: ${onField.join(', ')} | Bench: ${benchStr}\n`;
    });

    out += `\nSUMMARY:\n`;
    let rows = document.querySelectorAll('.stats-table tr');
    let benchCounts = [];
    
    for(let i = 1; i < rows.length; i++) {
        let cells = rows[i].querySelectorAll('td');
        if(cells.length === 4) {
            let name = cells[0].innerText;
            let posPlayed = cells[1].innerText;
            let inShifts = cells[2].innerText;
            let benched = parseInt(cells[3].innerText);

            // Ignore absent players
            if(rows[i].classList.contains('absent-text')) continue;

            out += `${name}: In=${inShifts}, Bench=${benched}  (Played: ${posPlayed})\n`;
            
            // Skip the dedicated goalie when calculating the fair-play spread
            if (posPlayed !== "Goalie") {
                benchCounts.push(benched);
            }
        }
    }

    let spread = 0;
    if (benchCounts.length > 0) {
        let minBench = Math.min(...benchCounts);
        let maxBench = Math.max(...benchCounts);
        spread = maxBench - minBench;
    }
    
    let pass = spread <= 1;
    out += `\nSPREAD: ${spread} shift(s) ${pass ? '✅ PASS' : '❌ FAIL'}\n`;
    out += `=================================================\n`;

    return { pass: pass, log: out };
}

function runTestSuite() {
    console.clear();
    console.log("🚀 STARTING MASS AUTOMATED FAIR-PLAY TESTS (150 Total)...");
    
    let failures = [];
    let totalTests = 0;

    // Define test parameters for each format (min, max roster size)
    const testConfigs = [
        { format: '7v7', min: 4, max: 12 },
        { format: '9v9', min: 6, max: 15 },
        { format: '11v11', min: 8, max: 18 }
    ];

    testConfigs.forEach(config => {
        for(let i = 0; i < 50; i++) {
            totalTests++;
            let numPlayers = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
            
            let result = runLineupTest(config.format, numPlayers, totalTests);
            if (!result.pass) {
                failures.push(result.log);
            }
        }
    });

    console.log(`\n🏁 TEST SUITE COMPLETE.`);
    if (failures.length > 0) {
        console.log(`%c⚠️ FOUND ${failures.length} FAILURES OUT OF ${totalTests} TESTS.`, "color: #d32f2f; font-weight: bold; font-size: 14px;");
        console.log("Please copy the logs below:\n");
        console.log(failures.join("\n"));
    } else {
        console.log(`%c✅ ALL ${totalTests} TESTS PASSED WITH OPTIMAL FAIRNESS! THE MATH IS SOLID.`, "color: #2e7d32; font-weight: bold; font-size: 14px;");
    }
}

// Execute the tests
runTestSuite();