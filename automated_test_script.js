function runLineupTest(format, numPlayers) {
    const ROLES = ['S', 'F', 'M', 'D', 'G'];
    let players = [];

    // 1. Generate Random Players
    for (let i = 1; i <= numPlayers; i++) {
        let numRoles = Math.floor(Math.random() * 3) + 1;
        let playerRoles = new Set();
        while(playerRoles.size < numRoles) {
            playerRoles.add(ROLES[Math.floor(Math.random() * ROLES.length)]);
        }
        players.push({
            name: `TestPlayer ${i}`,
            roles: Array.from(playerRoles)
        });
    }

    // Force at least one dedicated goalie so the "Empty Net" fallback doesn't skew standard testing
    players[0].roles = ['G'];

    let testData = {
        teamName: `Auto-Test: ${format} (${numPlayers} Players)`,
        format: format,
        includeSummary: false,
        players: players
    };

    // 2. Inject Data and Trigger Engine
    localStorage.setItem('v1_SmartSub_Data', JSON.stringify(testData));
    loadUI();
    generate();

    // 3. Scrape the Results
    let rows = document.querySelectorAll('.stats-table tr');
    let results = [];
    let benchCounts = [];

    // Skip the header row
    for(let i = 1; i < rows.length; i++) {
        let cells = rows[i].querySelectorAll('td');
        if(cells.length === 4) {
            let name = cells[0].innerText;
            let posPlayed = cells[1].innerText;
            let benchShifts = parseInt(cells[3].innerText);

            results.push({ 
                "Player": name, 
                "Positions": posPlayed, 
                "Benched": benchShifts 
            });
            
            // Don't count the dedicated goalie in the fair-play spread, as they inherently sit 0 times
            if (posPlayed !== "Goalie") {
                benchCounts.push(benchShifts);
            }
        }
    }

    // 4. Calculate Fairness (Difference between the most benched and least benched field player)
    let minBench = Math.min(...benchCounts);
    let maxBench = Math.max(...benchCounts);
    let spread = maxBench - minBench;
    
    // A spread of 1 or 0 means perfectly mathematically distributed playing time
    let passed = spread <= 1; 

    // 5. Print Output
    console.log(`%c--- TEST: ${format} with ${numPlayers} Players ---`, 'color: #1976d2; font-weight: bold; font-size: 14px;');
    console.table(results);
    
    let msgColor = passed ? 'color: #2e7d32' : 'color: #d32f2f';
    let statusText = passed ? '(OPTIMAL FAIRNESS)' : '(CHECK SPREAD)';
    console.log(`%cField Player Bench Spread: ${spread} shift(s) ${statusText}`, msgColor);
    console.log('\n');
}

function runTestSuite() {
    console.clear();
    console.log("%c🚀 STARTING AUTOMATED FAIR-PLAY TESTS...", "font-size: 16px; font-weight: bold;");
    
    // Test 7v7 (Min, Normal, Heavy Subs)
    runLineupTest('7v7', 7); 
    runLineupTest('7v7', 9);  
    runLineupTest('7v7', 11); 

    // Test 9v9
    runLineupTest('9v9', 9);
    runLineupTest('9v9', 12);
    runLineupTest('9v9', 14);

    // Test 11v11
    runLineupTest('11v11', 11);
    runLineupTest('11v11', 14);
    runLineupTest('11v11', 18);
    
    console.log("%c✅ TEST SUITE COMPLETE", "font-size: 16px; font-weight: bold; color: #2e7d32;");
}

// Execute the tests
runTestSuite();