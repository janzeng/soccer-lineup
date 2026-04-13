const ROLE_KEYS = ['C', 'S', 'F', 'M', 'D', 'G', 'A'];
const ROLE_MAP = { 'C': 'Cap', 'S': 'S', 'F': 'F', 'M': 'M', 'D': 'D', 'G': 'Goal', 'A': 'Abs' };
const STORAGE_KEY = 'v1_SmartSub_Data';

const FORMATS = {
    '7v7': {
        slots: ['s', 'lf', 'rf', 'm', 'ld', 'rd'],
        layout: [
            { class: 'row-s center-6', id: 's', label: 'Striker' },
            { class: 'row-f span-6', id: 'lf', label: 'Forward (L)' },
            { class: 'row-f span-6', id: 'rf', label: 'Forward (R)' },
            { class: 'row-m center-6', id: 'm', label: 'Midfield' },
            { class: 'row-d span-6', id: 'ld', label: 'Defense (L)' },
            { class: 'row-d span-6', id: 'rd', label: 'Defense (R)' }
        ]
    },
    '9v9': {
        slots: ['lf', 'rf', 'lm', 'cm', 'rm', 'ld', 'cd', 'rd'],
        layout: [
            { class: 'row-f span-6', id: 'lf', label: 'Forward (L)' },
            { class: 'row-f span-6', id: 'rf', label: 'Forward (R)' },
            { class: 'row-m span-4', id: 'lm', label: 'Mid (L)' },
            { class: 'row-m span-4', id: 'cm', label: 'Mid (C)' },
            { class: 'row-m span-4', id: 'rm', label: 'Mid (R)' },
            { class: 'row-d span-4', id: 'ld', label: 'Def (L)' },
            { class: 'row-d span-4', id: 'cd', label: 'Def (C)' },
            { class: 'row-d span-4', id: 'rd', label: 'Def (R)' }
        ]
    },
    '11v11': {
        slots: ['lf', 'rf', 'lm', 'lcm', 'rcm', 'rm', 'lb', 'lcb', 'rcb', 'rb'],
        layout: [
            { class: 'row-f span-6', id: 'lf', label: 'Forward (L)' },
            { class: 'row-f span-6', id: 'rf', label: 'Forward (R)' },
            { class: 'row-m span-3', id: 'lm', label: 'Mid (L)' },
            { class: 'row-m span-3', id: 'lcm', label: 'Mid (LC)' },
            { class: 'row-m span-3', id: 'rcm', label: 'Mid (RC)' },
            { class: 'row-m span-3', id: 'rm', label: 'Mid (R)' },
            { class: 'row-d span-3', id: 'lb', label: 'Back (L)' },
            { class: 'row-d span-3', id: 'lcb', label: 'Back (LC)' },
            { class: 'row-d span-3', id: 'rcb', label: 'Back (RC)' },
            { class: 'row-d span-3', id: 'rb', label: 'Back (R)' }
        ]
    }
};

const SLOTS_TO_ROLES = {
    'gk': 'Goalie', 's': 'Striker', 'lf': 'Forward', 'rf': 'Forward',
    'm': 'Midfield', 'lm': 'Midfield', 'cm': 'Midfield', 'rm': 'Midfield', 'lcm': 'Midfield', 'rcm': 'Midfield',
    'ld': 'Defense', 'cd': 'Defense', 'rd': 'Defense', 'lb': 'Defense', 'lcb': 'Defense', 'rcb': 'Defense', 'rb': 'Defense'
};

const SORT_ORDER = { 'Striker': 1, 'Forward': 2, 'Midfield': 3, 'Defense': 4, 'Goalie': 5 };

window.onload = () => { 
    checkURLParams();
    loadUI(); 
};

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('data')) {
        try {
            let decoded = JSON.parse(decodeURIComponent(atob(params.get('data'))));
            if (decoded.format && decoded.players) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded));
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            console.error("Failed to parse URL data");
        }
    }
}

function updateButtonStates() {
    let rows = document.querySelectorAll('#playerList tr');
    let hasRealPlayers = false;
    let emptyRowCount = 0;
    
    rows.forEach(row => {
        if (row.querySelector('.p-name').value.trim() !== "") {
            hasRealPlayers = true;
        } else {
            emptyRowCount++;
        }
    });
    
    document.getElementById('exportBtn').disabled = !hasRealPlayers;
    document.getElementById('clearBtn').disabled = !hasRealPlayers;
    
    let webViewContent = document.getElementById('web-view').innerHTML.trim();
    document.getElementById('printBtn').disabled = (webViewContent === "");

    let addBtn = document.querySelector('.add-player-btn');
    if (addBtn) {
        addBtn.style.display = (emptyRowCount > 0) ? 'none' : 'block';
    }

    let captainCheckboxes = document.querySelectorAll('#playerList input[type="checkbox"][value="C"]');
    let isCaptainSelected = Array.from(captainCheckboxes).some(cb => cb.checked);
    
    captainCheckboxes.forEach(cb => {
        cb.disabled = isCaptainSelected && !cb.checked;
    });
}

function checkLiveUpdate() {
    if (document.getElementById('web-view').innerHTML.trim() !== "") {
        generate();
    }
}

function getDefaultPlayerCount(format) {
    if (format === '9v9') return 9;
    if (format === '11v11') return 11;
    return 7;
}

function loadUI() {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    let formatElem = document.getElementById('fieldFormat');
    let currentFormat = formatElem ? formatElem.value : "7v7";
    
    if (!data || !data.players) {
        data = { teamName: "", format: currentFormat, includeSummary: false, players: [] };
    }
    
    let teamNameInput = document.getElementById('teamName');
    teamNameInput.value = data.teamName || "";
    teamNameInput.onchange = saveUI; 
    
    if (formatElem) formatElem.value = data.format || "7v7";
    let summaryElem = document.getElementById('includeSummary');
    if (summaryElem) summaryElem.checked = data.includeSummary || false;
    
    let formatMin = getDefaultPlayerCount(data.format || currentFormat);
    
    let realPlayers = data.players.filter(p => p.name.trim() !== "");
    let emptyPlayers = data.players.filter(p => p.name.trim() === "");
    
    let neededEmpty = Math.max(0, formatMin - realPlayers.length);
    let allowedEmpty = Math.max(neededEmpty, Math.min(emptyPlayers.length, 1));
    
    emptyPlayers = [];
    for(let i = 0; i < allowedEmpty; i++) {
        emptyPlayers.push({name: "", roles: []});
    }
    
    data.players = [...realPlayers, ...emptyPlayers];
    
    const tbody = document.getElementById('playerList');
    tbody.innerHTML = '';
    
    data.players.forEach(p => addPlayerRow(p.name, p.roles));
    
    updateButtonStates();
}

function handleFormatChange() {
    saveAndSort(); 
}

function saveUI() {
    let teamName = document.getElementById('teamName').value.trim();
    let format = document.getElementById('fieldFormat').value;
    let includeSummary = document.getElementById('includeSummary').checked;
    let rows = document.querySelectorAll('#playerList tr');
    let players = [];

    rows.forEach(row => {
        let name = row.querySelector('.p-name').value.trim();
        let roles = Array.from(row.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        players.push({ name, roles });
    });

    players.sort((a, b) => {
        let aEmpty = (a.name === "");
        let bEmpty = (b.name === "");
        if (aEmpty && !bEmpty) return 1;
        if (!aEmpty && bEmpty) return -1;
        return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
    });

    let data = { teamName, format, includeSummary, players };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateButtonStates();
    return data;
}

function saveAndSort() {
    saveUI();
    loadUI();
}

function addPlayerRow(name = '', roles = []) {
    const tbody = document.getElementById('playerList');
    let tr = document.createElement('tr');
    if (roles.includes('A')) tr.className = 'absent-row';
    
    let html = `<td><input type="text" class="p-name" value="${name}" placeholder="Player Name" onchange="saveAndSort()"></td>`;
    ROLE_KEYS.forEach(key => {
        let isChecked = roles.includes(key) ? 'checked' : '';
        html += `<td><input type="checkbox" value="${key}" ${isChecked} onchange="toggleAbs(this); saveUI()"></td>`;
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
    
    updateButtonStates();
}

function toggleAbs(checkbox) {
    if (checkbox.value === 'A') {
        let row = checkbox.closest('tr');
        checkbox.checked ? row.classList.add('absent-row') : row.classList.remove('absent-row');
    }
}

function clearRoster(silent = false) {
    if (silent || confirm("Are you sure you want to clear the entire roster?")) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('teamName').value = "";
        document.getElementById('web-view').innerHTML = "";
        document.getElementById('print-view').innerHTML = "";
        document.getElementById('statsContainer').innerHTML = "";
        loadUI();
    }
}

function copyShareLink() {
    let data = saveUI();
    let realPlayers = data.players.filter(p => p.name.trim() !== "");
    if (realPlayers.length === 0) return;
    
    let exportData = { ...data, players: realPlayers };
    let jsonStr = JSON.stringify(exportData);
    let base64 = btoa(encodeURIComponent(jsonStr)); 
    let shareLink = window.location.origin + window.location.pathname + "?data=" + base64;
    
    navigator.clipboard.writeText(shareLink).then(() => {
        alert("Shareable Link copied to clipboard!");
        closeModal('exportModal');
    });
}

function copyRosterJSON() {
    let data = saveUI();
    let realPlayers = data.players.filter(p => p.name.trim() !== "");
    if (realPlayers.length === 0) return;
    
    let exportData = { ...data, players: realPlayers };
    let jsonStr = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert("Roster JSON copied to clipboard!");
        closeModal('exportModal');
    });
}

function importData() {
    let text = document.getElementById('importText').value.trim();
    if (!text) return;
    try {
        let decoded = JSON.parse(text);
        if (decoded.format && decoded.players) {
            
            decoded.players.sort((a, b) => {
                return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded));
            loadUI();
            closeModal('importModal');
            document.getElementById('importText').value = "";
            alert("Roster successfully loaded!");
        } else { alert("Invalid data format."); }
    } catch (e) {
        alert("Invalid JSON. Please ensure you pasted the full text.");
    }
}

function printLineups() {
    generate(); 
    setTimeout(() => { window.print(); }, 50);
}

function isEligible(roles, slot) {
    if (!roles || roles.includes('A')) return false;
    if (roles.length === 0) return true; 
    
    if (slot === 'gk') return roles.includes('G');
    if (['s'].includes(slot)) return roles.includes('S') || roles.includes('F'); 
    if (['lf', 'rf'].includes(slot)) return roles.includes('F') || roles.includes('S');
    if (['m', 'lm', 'cm', 'rm', 'lcm', 'rcm'].includes(slot)) return roles.includes('M'); 
    if (['ld', 'rd', 'cd', 'lb', 'rb', 'lcb', 'rcb'].includes(slot)) return roles.includes('D');
    return false;
}

function formatNamePrint(name, roles, showAbbr = false) {
    if (!name) return "";
    if (!showAbbr) return name; 
    
    if (roles.length === 0) return `${name} <span class="p-name-abbr">[Any]</span>`;
    
    let abbrStr = roles.includes('A') ? 'Abs' : roles.map(r => ROLE_MAP[r]).join(', ');
    return `${name} <span class="p-name-abbr">[${abbrStr}]</span>`;
}

function buildPrintHeaderHTML(teamName, format, rightText) {
    let titleStr = `${teamName.toUpperCase()} — ${format.toLowerCase()}`;
    let html = `<div class="print-header"><h2>${titleStr}</h2>`;
    if (rightText) html += `<div class="half-label">${rightText}</div>`;
    html += `</div>`;
    return html;
}

function buildWebHeaderHTML(teamName, format, rightText, isFirst) {
    let titleStr = `${teamName.toUpperCase()} — ${format.toLowerCase()}`;
    let topMargin = isFirst ? '0' : '30px'; 
    return `
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin: ${topMargin} 0 15px 0; border-bottom: 2px solid #ccc; padding-bottom: 5px;">
            <div style="font-size: 1.2rem; font-weight: bold; color: #222;">${titleStr}</div>
            <div style="font-size: 1.1rem; font-weight: bold; color: #444;">${rightText}</div>
        </div>
    `;
}

function generate() {
    const data = saveUI();
    loadUI(); 

    const webView = document.getElementById('web-view');
    const printView = document.getElementById('print-view');
    
    webView.innerHTML = "";
    printView.innerHTML = "";

    let tName = data.teamName || "Unnamed Team";
    const formatConfig = FORMATS[data.format];
    const slotOrder = formatConfig.slots;
    const formatMin = getDefaultPlayerCount(data.format);

    let realPlayersList = data.players.filter(p => p.name.trim() !== "");
    let emptyPlayersList = data.players.filter(p => p.name.trim() === "");
    
    let processingPlayers = [];
    realPlayersList.forEach(p => processingPlayers.push({ name: p.name.trim(), roles: p.roles }));

    let neededToFill = Math.max(0, formatMin - realPlayersList.length);
    let generatedPlayerIndex = realPlayersList.length + 1;

    for (let i = 0; i < neededToFill; i++) {
        let rolesToUse = (i < emptyPlayersList.length) ? emptyPlayersList[i].roles : [];
        processingPlayers.push({ name: `Player ${generatedPlayerIndex++}`, roles: rolesToUse });
    }

    let rolesMap = {};
    processingPlayers.forEach(p => rolesMap[p.name] = p.roles);

    const activePlayers = processingPlayers.filter(p => !p.roles.includes('A')).map(p => p.name);
    const absentPlayers = processingPlayers.filter(p => p.roles.includes('A') && !p.name.startsWith("Player ")).map(p => p.name);
    
    let goalies = activePlayers.filter(name => rolesMap[name].includes('G') || rolesMap[name].length === 0);
    
    if (goalies.length === 0 && activePlayers.length > 0) {
        goalies = [...activePlayers];
    }
    
    let stats = {};
    let playedPositions = {}; 
    
    activePlayers.forEach(name => {
        stats[name] = { in: 0, bench: 0 };
        playedPositions[name] = new Set();
    });

    let footerHTML = `<div class="roster-footer"><div><b>ROSTER:</b> ${activePlayers.map(p => formatNamePrint(p, rolesMap[p], true)).join(', ')}</div>`;
    if (absentPlayers.length > 0) footerHTML += `<div style="color: #666; margin-top: 5px;"><b>ABSENT:</b> ${absentPlayers.join(', ')}</div>`;
    footerHTML += `</div>`;

    let currentAssignments = {};
    slotOrder.forEach(s => currentAssignments[s] = "");
    currentAssignments['gk'] = "";

    let webHTMLStr = "";
    let printHTMLStr = "";

    let isNoSubsGame = (activePlayers.length <= formatMin);

    for (let q = 1; q <= 4; q++) {
        if (q === 1) {
            printHTMLStr += buildPrintHeaderHTML(tName, data.format, '1st Half');
            webHTMLStr += buildWebHeaderHTML(tName, data.format, '1st Half', true);
        }
        if (q === 3) {
            printHTMLStr += footerHTML;
            printHTMLStr += `<div class="page-break"></div>`;
            printHTMLStr += buildPrintHeaderHTML(tName, data.format, '2nd Half');
            
            webHTMLStr += buildWebHeaderHTML(tName, data.format, '2nd Half', false);
        }

        let webRowHTML = `<div class="card-row">`;
        let printRowHTML = `<div class="card-row">`;

        for (let r = 1; r <= 2; r++) {
            const isReset = (q === 1 && r === 1) || (q === 3 && r === 1);
            let subsDisplay = [];

            if (isNoSubsGame && !isReset) {
                subsDisplay = ["No Subs"];
            } else {
                let vacatedByBreak = null;
                let activeGK = "";
                let restingGK = "";
                
                if (goalies.length === 1) activeGK = goalies[0];
                else if (goalies.length === 2) {
                    activeGK = (q <= 2) ? goalies[0] : goalies[1];
                    restingGK = (q <= 2) ? goalies[1] : goalies[0];
                } else if (goalies.length > 2) {
                    activeGK = goalies[(q - 1) % goalies.length];
                }
                
                currentAssignments['gk'] = activeGK;
                let fieldPool = activePlayers.filter(n => n !== activeGK);

                let canAffordBreak = (fieldPool.length - 1 >= slotOrder.length);

                if (goalies.length === 2 && q === 2 && r === 2 && restingGK && canAffordBreak) {
                    fieldPool = fieldPool.filter(n => n !== restingGK);
                    let slotToVacate = slotOrder.find(s => currentAssignments[s] === restingGK);
                    if (slotToVacate) {
                        currentAssignments[slotToVacate] = "";
                        vacatedByBreak = restingGK; 
                    }
                }

                if (isReset) {
                    // FAIR PLAY OVERRIDE: Mathematically sort who MUST be on the field
                    let sortedPool = [...fieldPool].sort((a, b) => stats[a].in - stats[b].in);
                    let playersToField = sortedPool.slice(0, slotOrder.length);
                    let playersToBench = sortedPool.slice(slotOrder.length);
                    
                    let unassignedPlayers = [...playersToField];
                    
                    // Try to match preferences first
                    slotOrder.forEach(slot => {
                        let eligibleIndex = unassignedPlayers.findIndex(name => isEligible(rolesMap[name], slot));
                        if (eligibleIndex !== -1) {
                            currentAssignments[slot] = unassignedPlayers[eligibleIndex];
                            unassignedPlayers.splice(eligibleIndex, 1);
                        } else {
                            currentAssignments[slot] = ""; 
                        }
                    });
                    
                    // Force the remaining unassigned players into the remaining spots to ensure even play
                    slotOrder.forEach(slot => {
                        if (currentAssignments[slot] === "") {
                            if (unassignedPlayers.length > 0) {
                                currentAssignments[slot] = unassignedPlayers[0];
                                unassignedPlayers.shift();
                            }
                        }
                    });
                    
                    subsDisplay = playersToBench.length > 0 ? ["<b>Bench:</b> " + playersToBench.join(', ')] : ["No Subs"];
                
                } else {
                    // Fill explicitly vacated spots (like goalies taking a break)
                    slotOrder.forEach(slot => {
                        if (currentAssignments[slot] === "") {
                            let eligibleBench = fieldPool.filter(n => !Object.values(currentAssignments).includes(n));
                            eligibleBench.sort((a, b) => stats[a].in - stats[b].in);
                            
                            let prefBench = eligibleBench.filter(n => isEligible(rolesMap[n], slot));
                            let playerToInsert = prefBench.length > 0 ? prefBench[0] : eligibleBench[0];

                            if (playerToInsert) {
                                currentAssignments[slot] = playerToInsert;
                                let outgoingText = vacatedByBreak ? vacatedByBreak : "Empty";
                                subsDisplay.push(`<b>${playerToInsert}</b> <span class="arrow">→</span> ${outgoingText}`);
                                vacatedByBreak = null; 
                            }
                        }
                    });

                    // Sub remaining bench players into the field
                    let benchBefore = fieldPool.filter(n => !Object.values(currentAssignments).includes(n));
                    benchBefore.sort((a, b) => stats[a].in - stats[b].in); 
                    
                    let numToSub = Math.min(benchBefore.length, slotOrder.length);
                    let playersToBringIn = benchBefore.slice(0, numToSub);
                    
                    playersToBringIn.forEach(incomingPlayer => {
                        let currentField = slotOrder.map(s => currentAssignments[s]).filter(n => n !== "");
                        
                        // FAIR PLAY OVERRIDE: Identify the exact players on the field who have the MOST shifts
                        let maxShiftsOnField = Math.max(...currentField.map(n => stats[n].in));
                        let candidatesToSit = currentField.filter(n => stats[n].in === maxShiftsOnField);
                        
                        // Can we swap out one of these max-shift players AND match the incoming player's preference?
                        let eligibleSlots = slotOrder.filter(slot => {
                            let occupant = currentAssignments[slot];
                            return occupant && candidatesToSit.includes(occupant) && isEligible(rolesMap[incomingPlayer], slot);
                        });
                        
                        let slotToSwap;
                        if (eligibleSlots.length > 0) {
                            slotToSwap = eligibleSlots[0];
                        } else {
                            // If preferences don't align, force the swap anyway. Playing time > Preference.
                            slotToSwap = slotOrder.find(slot => currentAssignments[slot] === candidatesToSit[0]);
                        }
                        
                        let outgoingPlayer = currentAssignments[slotToSwap];
                        currentAssignments[slotToSwap] = incomingPlayer;
                        subsDisplay.push(`<b>${incomingPlayer}</b> <span class="arrow">→</span> ${outgoingPlayer}`);
                    });
                    
                    if (subsDisplay.length === 0) subsDisplay = ["No Subs"];
                }
            }

            activePlayers.forEach(name => {
                if (Object.values(currentAssignments).includes(name)) stats[name].in++;
                else stats[name].bench++;
            });
            
            Object.entries(currentAssignments).forEach(([slot, player]) => {
                if (player && playedPositions[player]) {
                    playedPositions[player].add(SLOTS_TO_ROLES[slot]);
                }
            });

            let fieldHTML = formatConfig.layout.map(item => `
                <div class="pos ${item.class}">
                    <span class="label">${item.label}</span>${currentAssignments[item.id] || ''}
                </div>
            `).join('');
            
            fieldHTML += `<div class="pos row-gk center-6"><span class="label">Goalie</span>${currentAssignments.gk}</div>`;

            let cardHTML = `
                <div class="rotation-card">
                    <h2><span>QUARTER ${q}</span> <span>SHIFT ${r}</span></h2>
                    <div class="field-layout">${fieldHTML}</div>
                    <div class="subs">${subsDisplay.join('<br>')}</div>
                </div>
            `;
            
            webRowHTML += cardHTML;
            printRowHTML += cardHTML;
        }
        
        webRowHTML += `</div>`;
        printRowHTML += `</div>`;
        
        webHTMLStr += webRowHTML;
        printHTMLStr += printRowHTML;
    }
    
    printHTMLStr += footerHTML;

    let requiredRoleNames = new Set(['Goalie']); 
    formatConfig.slots.forEach(slot => {
        requiredRoleNames.add(SLOTS_TO_ROLES[slot]);
    });

    let shortPositions = [];
    const standardOrder = ['Striker', 'Forward', 'Midfield', 'Defense', 'Goalie'];

    standardOrder.forEach(roleName => {
        if (requiredRoleNames.has(roleName)) {
            let hasPreference = activePlayers.some(p => {
                let r = rolesMap[p];
                if (roleName === 'Goalie') return r.includes('G');
                if (roleName === 'Striker') return r.includes('S');
                if (roleName === 'Forward') return r.includes('F');
                if (roleName === 'Midfield') return r.includes('M');
                if (roleName === 'Defense') return r.includes('D');
                return false;
            });
            if (!hasPreference) {
                shortPositions.push(roleName);
            }
        }
    });

    let warningHTML = "";
    if (shortPositions.length > 0) {
        warningHTML = `
        <div style="background: #ffebee; border: 1px solid #e57373; padding: 12px; border-radius: 6px; margin: 20px 0 10px 0; color: #c62828; font-size: 0.9rem;">
            <b>⚠️ Position Warning:</b> Not enough players requested the following positions: <b>${shortPositions.join(', ')}</b>. The generator filled these spots automatically to ensure a complete lineup.
        </div>`;
    }

    let tableHTML = `<table class="stats-table"><tr><th>Player Name</th><th>Positions Played</th><th>Shifts In</th><th>Shifts Bench</th></tr>`;
    
    processingPlayers.forEach(p => {
        let roles = p.roles;
        let actualPlayed = Array.from(playedPositions[p.name] || []);
        
        actualPlayed.sort((a, b) => (SORT_ORDER[a] || 99) - (SORT_ORDER[b] || 99));
        
        let displayRoles = actualPlayed.length > 0 ? actualPlayed.join(', ') : 'None';

        if (roles.includes('A')) {
            if (!p.name.startsWith("Player ")) {
                tableHTML += `<tr class="absent-text"><td><del>${p.name}</del></td><td>Absent</td><td>0</td><td>0</td></tr>`;
            }
        } else {
            tableHTML += `<tr><td><b>${p.name}</b></td><td>${displayRoles}</td><td>${stats[p.name].in}</td><td>${stats[p.name].bench}</td></tr>`;
        }
    });
    tableHTML += `</table>`;
    
    document.getElementById('statsContainer').innerHTML = warningHTML + tableHTML;
    webView.innerHTML = webHTMLStr;

    if (data.includeSummary) {
        printHTMLStr += `<div class="page-break"></div>`;
        printHTMLStr += buildPrintHeaderHTML(tName, data.format, ''); 
        printHTMLStr += `<div class="summary-page-wrapper">${warningHTML}${tableHTML}</div>`;
    }
    printView.innerHTML = printHTMLStr;
    
    updateButtonStates();
}