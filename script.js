const ROLE_KEYS = ['C', 'S', 'F', 'M', 'D', 'G', 'A'];
const ROLE_MAP = { 'C': 'Cap', 'S': 'S', 'F': 'F', 'M': 'M', 'D': 'D', 'G': 'Goal', 'A': 'Abs' };
const STORAGE_KEY = 'v1_SmartSub_Data';
const STATE_KEY = 'v1_SmartSub_MatchState';

const FORMATS = {
    '7v7': {
        slots: ['s', 'lf', 'rf', 'm', 'ld', 'rd'],
        layout: [
            { class: 'row-s center-6', id: 's', label: 'Striker' },
            { class: 'row-f span-6', id: 'lf', label: 'Forward L' },
            { class: 'row-f span-6', id: 'rf', label: 'Forward R' },
            { class: 'row-m center-6', id: 'm', label: 'Midfield' },
            { class: 'row-d span-6', id: 'ld', label: 'Defense L' },
            { class: 'row-d span-6', id: 'rd', label: 'Defense R' }
        ]
    },
    '9v9': {
        slots: ['lf', 'rf', 'lm', 'cm', 'rm', 'ld', 'cd', 'rd'],
        layout: [
            { class: 'row-f span-6', id: 'lf', label: 'Forward L' },
            { class: 'row-f span-6', id: 'rf', label: 'Forward R' },
            { class: 'row-m span-4', id: 'lm', label: 'Mid L' },
            { class: 'row-m span-4', id: 'cm', label: 'Mid C' },
            { class: 'row-m span-4', id: 'rm', label: 'Mid R' },
            { class: 'row-d span-4', id: 'ld', label: 'Defense L' },
            { class: 'row-d span-4', id: 'cd', label: 'Defense C' },
            { class: 'row-d span-4', id: 'rd', label: 'Defense R' }
        ]
    },
    '11v11': {
        slots: ['lf', 'rf', 'lm', 'lcm', 'rcm', 'rm', 'lb', 'lcb', 'rcb', 'rb'],
        layout: [
            { class: 'row-f span-6', id: 'lf', label: 'Forward L' },
            { class: 'row-f span-6', id: 'rf', label: 'Forward R' },
            { class: 'row-m span-3', id: 'lm', label: 'Mid L' },
            { class: 'row-m span-3', id: 'lcm', label: 'Mid LC' },
            { class: 'row-m span-3', id: 'rcm', label: 'Mid RC' },
            { class: 'row-m span-3', id: 'rm', label: 'Mid R' },
            { class: 'row-d span-3', id: 'lb', label: 'Defense L' },
            { class: 'row-d span-3', id: 'lcb', label: 'Defense LC' },
            { class: 'row-d span-3', id: 'rcb', label: 'Defense RC' },
            { class: 'row-d span-3', id: 'rb', label: 'Defense R' }
        ]
    }
};

const SLOTS_TO_ROLES = {
    'gk': 'Goalie', 's': 'Striker', 'lf': 'Forward', 'rf': 'Forward',
    'm': 'Midfield', 'lm': 'Midfield', 'cm': 'Midfield', 'rm': 'Midfield', 'lcm': 'Midfield', 'rcm': 'Midfield',
    'ld': 'Defense', 'cd': 'Defense', 'rd': 'Defense', 'lb': 'Defense', 'lcb': 'Defense', 'rcb': 'Defense', 'rb': 'Defense'
};

const SORT_ORDER = { 'Striker': 1, 'Forward': 2, 'Midfield': 3, 'Defense': 4, 'Goalie': 5 };

// --- DRAG AND DROP STATE HANDLERS ---
let dragSrcPos = null;

window.dragStart = function(e) {
    dragSrcPos = e.target.closest('.pos');
    e.dataTransfer.effectAllowed = 'move';
    dragSrcPos.style.opacity = '0.4';
};

window.dragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
};

window.dragEnter = function(e) {
    e.preventDefault();
    let targetPos = e.target.closest('.pos');
    // Only highlight if it's within the exact same shift card
    if (targetPos && dragSrcPos && targetPos !== dragSrcPos && targetPos.getAttribute('data-shift') === dragSrcPos.getAttribute('data-shift')) {
        targetPos.classList.add('drag-target');
    }
};

window.dragLeave = function(e) {
    let targetPos = e.target.closest('.pos');
    if (targetPos) {
        targetPos.classList.remove('drag-target');
    }
};

window.dropField = function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    let targetPos = e.target.closest('.pos');
    if (targetPos) targetPos.classList.remove('drag-target');

    if (dragSrcPos) dragSrcPos.style.opacity = '1';

    if (dragSrcPos && targetPos && dragSrcPos !== targetPos) {
        let dragShift = dragSrcPos.getAttribute('data-shift');
        let targetShift = targetPos.getAttribute('data-shift');

        // Swap state if dragged inside the exact same shift
        if (dragShift === targetShift) {
            let shiftIdx = parseInt(dragShift);
            let dragSlot = dragSrcPos.getAttribute('data-slot');
            let targetSlot = targetPos.getAttribute('data-slot');

            let temp = window.matchState[shiftIdx].assignments[dragSlot];
            window.matchState[shiftIdx].assignments[dragSlot] = window.matchState[shiftIdx].assignments[targetSlot];
            window.matchState[shiftIdx].assignments[targetSlot] = temp;

            let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            let currentHash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
            localStorage.setItem(STATE_KEY, JSON.stringify({ hash: currentHash, state: window.matchState }));

            renderLineups();
        }
    }
    dragSrcPos = null;
    return false;
};

window.dragEnd = function(e) {
    if (dragSrcPos) dragSrcPos.style.opacity = '1';
    document.querySelectorAll('.pos').forEach(el => el.classList.remove('drag-target'));
    dragSrcPos = null;
};

window.onload = () => { 
    checkURLParams();
    loadUI(); 
    attemptLoadSavedState();
};

function packData(data, matchState) {
    let packed = {
        t: data.teamName,
        f: data.format,
        s: data.includeSummary ? 1 : 0,
        p: data.players.map(p => [p.name, p.roles]) 
    };
    
    // Add memory state to the shareable URL if it exists
    if (matchState && matchState.length > 0) {
        packed.m = matchState.map(shift => shift.assignments);
    }
    
    return packed;
}

function unpackData(data) {
    let roster = {
        teamName: data.t || "",
        format: data.f || "7v7",
        includeSummary: data.s === 1,
        players: (data.p || []).map(arr => ({
            name: arr[0],
            roles: arr[1] || ""
        }))
    };

    let matchState = null;
    if (data.m) {
        matchState = data.m.map((assig, i) => ({
            q: Math.floor(i / 2) + 1,
            r: (i % 2) + 1,
            assignments: assig
        }));
    }

    return { roster, matchState };
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('data')) {
        try {
            let decoded = JSON.parse(decodeURIComponent(atob(params.get('data'))));
            let unpackedRoster, matchState;
            
            if (decoded.players) { // Legacy link catch
                unpackedRoster = decoded;
            } else {
                let unpackedData = unpackData(decoded); 
                unpackedRoster = unpackedData.roster;
                matchState = unpackedData.matchState;
            }
            
            if (unpackedRoster.format && unpackedRoster.players) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(unpackedRoster));
                
                if (matchState) {
                    let currentHash = btoa(unescape(encodeURIComponent(JSON.stringify(unpackedRoster))));
                    localStorage.setItem(STATE_KEY, JSON.stringify({ hash: currentHash, state: matchState }));
                    window.matchState = matchState;
                } else {
                    localStorage.removeItem(STATE_KEY);
                    window.matchState = null;
                }
                
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
        emptyPlayers.push({name: "", roles: ""});
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
        let roles = Array.from(row.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).join('');
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

function addPlayerRow(name = '', roles = '') {
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
        localStorage.removeItem(STATE_KEY);
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
    
    let stateData = null;
    let savedStateStr = localStorage.getItem(STATE_KEY);
    if (savedStateStr) {
        let savedObj = JSON.parse(savedStateStr);
        let currentHash = btoa(unescape(encodeURIComponent(JSON.stringify(exportData))));
        if (savedObj.hash === currentHash) {
            stateData = savedObj.state;
        }
    }

    let packedData = packData(exportData, stateData); 
    let jsonStr = JSON.stringify(packedData);
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
        if (decoded.p && !decoded.players) decoded = unpackData(decoded).roster; // Base JSON ignores match state intentionally
        
        if (decoded.format && decoded.players) {
            decoded.players.sort((a, b) => {
                return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded));
            localStorage.removeItem(STATE_KEY); 
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
    let abbrStr = roles.includes('A') ? 'Abs' : roles.split('').map(r => ROLE_MAP[r]).join(', ');
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

// --- STATE MANAGEMENT ---
function attemptLoadSavedState() {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data || !data.players) return;
    
    let savedStateStr = localStorage.getItem(STATE_KEY);
    if (savedStateStr) {
        let savedObj = JSON.parse(savedStateStr);
        let currentHash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        
        if (savedObj.hash === currentHash) {
            window.matchState = savedObj.state;
            renderLineups();
        }
    }
}

function generate() {
    const data = saveUI();
    loadUI(); 

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
        let rolesToUse = (i < emptyPlayersList.length) ? emptyPlayersList[i].roles : "";
        processingPlayers.push({ name: `Player ${generatedPlayerIndex++}`, roles: rolesToUse });
    }

    let rolesMap = {};
    processingPlayers.forEach(p => rolesMap[p.name] = p.roles);

    const activePlayers = processingPlayers.filter(p => !p.roles.includes('A')).map(p => p.name);
    
    let goalies = activePlayers.filter(name => rolesMap[name].includes('G') || rolesMap[name].length === 0);
    if (goalies.length === 0 && activePlayers.length > 0) goalies = [...activePlayers];
    
    let stats = {};
    let remainingGoalieShifts = {};
    activePlayers.forEach(name => {
        stats[name] = { in: 0, bench: 0 };
        remainingGoalieShifts[name] = 0;
    });

    for (let q = 1; q <= 4; q++) {
        for (let r = 1; r <= 2; r++) {
            let scheduledGK = "";
            if (goalies.length === 1) scheduledGK = goalies[0];
            else if (goalies.length === 2) scheduledGK = (q <= 2) ? goalies[0] : goalies[1];
            else scheduledGK = goalies[(q - 1) % goalies.length];
            if (scheduledGK) remainingGoalieShifts[scheduledGK]++;
        }
    }

    let isNoSubsGame = (activePlayers.length <= formatMin);
    window.matchState = []; 

    for (let q = 1; q <= 4; q++) {
        for (let r = 1; r <= 2; r++) {
            let currentAssignments = {};
            slotOrder.forEach(s => currentAssignments[s] = "");
            currentAssignments['gk'] = "";

            const isReset = (q === 1 && r === 1) || (q === 3 && r === 1);

            let activeGK = "";
            if (goalies.length === 1) activeGK = goalies[0];
            else if (goalies.length === 2) activeGK = (q <= 2) ? goalies[0] : goalies[1];
            else activeGK = goalies[(q - 1) % goalies.length];
            
            currentAssignments['gk'] = activeGK;
            let fieldPool = activePlayers.filter(n => n !== activeGK);

            if (isReset || isNoSubsGame) {
                let sortedPool = [...fieldPool].sort((a, b) => {
                    if (stats[a].in !== stats[b].in) return stats[a].in - stats[b].in;
                    if (remainingGoalieShifts[a] !== remainingGoalieShifts[b]) return remainingGoalieShifts[a] - remainingGoalieShifts[b];
                    if (stats[a].bench !== stats[b].bench) return stats[b].bench - stats[a].bench;
                    return 0;
                });
                
                let playersToField = sortedPool.slice(0, slotOrder.length);
                let unassignedPlayers = [...playersToField];
                
                slotOrder.forEach(slot => {
                    let eligibleIndex = unassignedPlayers.findIndex(name => isEligible(rolesMap[name], slot));
                    if (eligibleIndex !== -1) {
                        currentAssignments[slot] = unassignedPlayers[eligibleIndex];
                        unassignedPlayers.splice(eligibleIndex, 1);
                    }
                });
                
                slotOrder.forEach(slot => {
                    if (currentAssignments[slot] === "" && unassignedPlayers.length > 0) {
                        currentAssignments[slot] = unassignedPlayers[0];
                        unassignedPlayers.shift();
                    }
                });
            
            } else {
                let previousAssignments = window.matchState[window.matchState.length - 1].assignments;
                
                slotOrder.forEach(slot => currentAssignments[slot] = previousAssignments[slot]);
                
                slotOrder.forEach(slot => {
                    if (currentAssignments[slot] === activeGK) currentAssignments[slot] = "";
                });

                let benchBefore = fieldPool.filter(n => !Object.values(currentAssignments).includes(n));
                
                benchBefore.sort((a, b) => {
                    if (stats[a].in !== stats[b].in) return stats[a].in - stats[b].in;
                    if (remainingGoalieShifts[a] !== remainingGoalieShifts[b]) return remainingGoalieShifts[a] - remainingGoalieShifts[b];
                    if (stats[a].bench !== stats[b].bench) return stats[b].bench - stats[a].bench;
                    return 0;
                });
                
                let emptySlots = slotOrder.filter(slot => currentAssignments[slot] === "");
                let incomingPlayers = benchBefore.slice(0, emptySlots.length);
                
                incomingPlayers.forEach(incPlayer => {
                    let eligibleSlots = emptySlots.filter(slot => isEligible(rolesMap[incPlayer], slot));
                    let slotToFill = eligibleSlots.length > 0 ? eligibleSlots[0] : emptySlots[0];
                    currentAssignments[slotToFill] = incPlayer;
                    emptySlots = emptySlots.filter(s => s !== slotToFill);
                });

                benchBefore = fieldPool.filter(n => !Object.values(currentAssignments).includes(n));
                
                let currentField = slotOrder.map(s => currentAssignments[s]).filter(n => n !== "");
                let sortedField = [...currentField].sort((a, b) => {
                    if (stats[a].in !== stats[b].in) return stats[b].in - stats[a].in; 
                    if (remainingGoalieShifts[a] !== remainingGoalieShifts[b]) return remainingGoalieShifts[b] - remainingGoalieShifts[a];
                    if (stats[a].bench !== stats[b].bench) return stats[a].bench - stats[b].bench; 
                    return 0;
                });
                
                let numToSub = Math.min(benchBefore.length, slotOrder.length);
                let playersToBringIn = benchBefore.slice(0, numToSub);
                
                playersToBringIn.forEach(incomingPlayer => {
                    let topCandidate = sortedField[0];
                    let candidatesToSit = sortedField.filter(n => 
                        stats[n].in === stats[topCandidate].in && 
                        remainingGoalieShifts[n] === remainingGoalieShifts[topCandidate] &&
                        stats[n].bench === stats[topCandidate].bench
                    );
                    
                    let eligibleSlots = slotOrder.filter(slot => {
                        let occupant = currentAssignments[slot];
                        return occupant && candidatesToSit.includes(occupant) && isEligible(rolesMap[incomingPlayer], slot);
                    });
                    
                    let slotToSwap = eligibleSlots.length > 0 ? eligibleSlots[0] : slotOrder.find(slot => currentAssignments[slot] === candidatesToSit[0]);
                    
                    let outgoingPlayer = currentAssignments[slotToSwap];
                    currentAssignments[slotToSwap] = incomingPlayer;
                    sortedField = sortedField.filter(n => n !== outgoingPlayer); 
                });
            }

            window.matchState.push({
                q: q, r: r, assignments: currentAssignments
            });

            activePlayers.forEach(name => {
                if (Object.values(currentAssignments).includes(name)) stats[name].in++;
                else stats[name].bench++;
            });
            if (currentAssignments['gk']) remainingGoalieShifts[currentAssignments['gk']]--;
        }
    }

    let currentHash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    localStorage.setItem(STATE_KEY, JSON.stringify({ hash: currentHash, state: window.matchState }));
    
    renderLineups();
}

// --- RENDERING ENGINE ---
function renderLineups() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const formatConfig = FORMATS[data.format];
    const slotOrder = formatConfig.slots;
    
    const webView = document.getElementById('web-view');
    const printView = document.getElementById('print-view');
    
    let tName = data.teamName || "Unnamed Team";
    
    let realPlayersList = data.players.filter(p => p.name.trim() !== "");
    let emptyPlayersList = data.players.filter(p => p.name.trim() === "");
    let processingPlayers = [];
    realPlayersList.forEach(p => processingPlayers.push({ name: p.name.trim(), roles: p.roles }));
    let formatMin = getDefaultPlayerCount(data.format);
    let neededToFill = Math.max(0, formatMin - realPlayersList.length);
    let generatedPlayerIndex = realPlayersList.length + 1;
    for (let i = 0; i < neededToFill; i++) {
        processingPlayers.push({ name: `Player ${generatedPlayerIndex++}`, roles: (i < emptyPlayersList.length) ? emptyPlayersList[i].roles : "" });
    }

    let rolesMap = {};
    processingPlayers.forEach(p => rolesMap[p.name] = p.roles);
    const activePlayers = processingPlayers.filter(p => !p.roles.includes('A')).map(p => p.name);
    const absentPlayers = processingPlayers.filter(p => p.roles.includes('A') && !p.name.startsWith("Player ")).map(p => p.name);

    let stats = {};
    let playedPositions = {}; 
    activePlayers.forEach(name => {
        stats[name] = { in: 0, bench: 0 };
        playedPositions[name] = new Set();
    });

    let footerHTML = `<div class="roster-footer"><div><b>ROSTER:</b> ${activePlayers.map(p => formatNamePrint(p, rolesMap[p], true)).join(', ')}</div>`;
    if (absentPlayers.length > 0) footerHTML += `<div style="color: #666; margin-top: 5px;"><b>ABSENT:</b> ${absentPlayers.join(', ')}</div>`;
    footerHTML += `</div>`;

    let webHTMLStr = "";
    let printHTMLStr = "";
    let isNoSubsGame = (activePlayers.length <= formatMin);

    window.matchState.forEach((shiftState, shiftIndex) => {
        let q = shiftState.q;
        let r = shiftState.r;
        let currAssig = shiftState.assignments;
        
        activePlayers.forEach(name => {
            if (Object.values(currAssig).includes(name)) stats[name].in++;
            else stats[name].bench++;
        });
        Object.entries(currAssig).forEach(([slot, player]) => {
            if (player) playedPositions[player].add(SLOTS_TO_ROLES[slot]);
        });

        if (q === 1 && r === 1) {
            printHTMLStr += buildPrintHeaderHTML(tName, data.format, '1st Half');
            webHTMLStr += buildWebHeaderHTML(tName, data.format, '1st Half', true);
        }
        if (q === 3 && r === 1) {
            printHTMLStr += footerHTML;
            printHTMLStr += `<div class="page-break"></div>`;
            printHTMLStr += buildPrintHeaderHTML(tName, data.format, '2nd Half');
            webHTMLStr += buildWebHeaderHTML(tName, data.format, '2nd Half', false);
        }

        if (r === 1) {
            webHTMLStr += `<div class="card-row">`;
            printHTMLStr += `<div class="card-row">`;
        }

        let subsDisplay = [];
        let currBench = activePlayers.filter(p => !Object.values(currAssig).includes(p));

        if (isNoSubsGame) {
            subsDisplay = ["No Subs"];
        } else if (shiftIndex === 0 || shiftIndex === 4) { // Start of Half
            subsDisplay = currBench.length > 0 ? ["<b>Bench:</b> " + currBench.join(', ')] : ["No Subs"];
        } else {
            let prevAssig = window.matchState[shiftIndex - 1].assignments;
            let prevBench = activePlayers.filter(p => !Object.values(prevAssig).includes(p));

            let incoming = [];
            let shifting = [];
            
            Object.keys(currAssig).forEach(slot => {
                let currP = currAssig[slot];
                let prevP = prevAssig[slot];
                
                if (currP && currP !== prevP) {
                    let slotLabel = slot === 'gk' ? 'Goalie' : formatConfig.layout.find(item => item.id === slot).label;
                    if (prevBench.includes(currP)) {
                        incoming.push(`<b>IN: ${currP}</b> <span class="arrow">→</span> ${slotLabel}`);
                    } else {
                        shifting.push(`<b>${currP}</b> <span class="arrow">→</span> ${slotLabel}`);
                    }
                }
            });
            
            let outgoing = activePlayers.filter(p => currBench.includes(p) && !prevBench.includes(p));
            
            if (incoming.length > 0) subsDisplay.push(...incoming);
            
            if (shifting.length > 0) {
                subsDisplay.push(`<div style="color: #666; margin-top: 2px;"><i>Shift: ${shifting.join(', ')}</i></div>`);
            }
            
            if (outgoing.length > 0) {
                subsDisplay.push(`<div style="margin-top: 4px; color: #d32f2f;"><b>OFF TO BENCH:</b> ${outgoing.join(', ')}</div>`);
            }

            if (subsDisplay.length === 0) subsDisplay.push("No Subs");

            let stayingOnBench = currBench.filter(p => prevBench.includes(p));
            if (stayingOnBench.length > 0) {
                subsDisplay.push(`<div style="margin-top: 4px; color: #888;"><b>Staying on Bench:</b> ${stayingOnBench.join(', ')}</div>`);
            }
        }

        // --- NEW DOM DROPPABLE ZONE TARGETS (.pos) ---
        let fieldHTML = formatConfig.layout.map(item => `
            <div class="pos ${item.class}" draggable="true" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondrop="dropField(event)" ondragend="dragEnd(event)" data-shift="${shiftIndex}" data-slot="${item.id}">
                <span class="label">${item.label}</span>
                <div class="player-name">${currAssig[item.id] || ''}</div>
            </div>
        `).join('');
        
        fieldHTML += `
            <div class="pos row-gk center-6" draggable="true" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondrop="dropField(event)" ondragend="dragEnd(event)" data-shift="${shiftIndex}" data-slot="gk">
                <span class="label">Goalie</span>
                <div class="player-name">${currAssig.gk || ''}</div>
            </div>`;

        let cardHTML = `
            <div class="rotation-card">
                <h2><span>QUARTER ${q}</span> <span>SHIFT ${r}</span></h2>
                <div class="field-layout">${fieldHTML}</div>
                <div class="subs">${subsDisplay.join('<br>')}</div>
            </div>
        `;
        
        webHTMLStr += cardHTML;
        printHTMLStr += cardHTML;

        if (r === 2) {
            webHTMLStr += `</div>`;
            printHTMLStr += `</div>`;
        }
    });

    printHTMLStr += footerHTML;

    let requiredRoleNames = new Set(['Goalie']); 
    formatConfig.slots.forEach(slot => requiredRoleNames.add(SLOTS_TO_ROLES[slot]));
    let shortPositions = [];
    ['Striker', 'Forward', 'Midfield', 'Defense', 'Goalie'].forEach(roleName => {
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
            if (!hasPreference) shortPositions.push(roleName);
        }
    });

    let warningHTML = "";
    if (shortPositions.length > 0) {
        warningHTML = `
        <div style="background: #ffebee; border: 1px solid #e57373; padding: 12px; border-radius: 6px; margin: 20px 0 10px 0; color: #c62828; font-size: 0.9rem;">
            <b>⚠️ Position Warning:</b> Not enough players requested the following positions: <b>${shortPositions.join(', ')}</b>. The generator filled these spots automatically.
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
    
    document.getElementById('statsContainer').innerHTML = warningHTML + `<div id="statsTableWrapper">${tableHTML}</div>`;
    webView.innerHTML = webHTMLStr;

    if (data.includeSummary) {
        printHTMLStr += `<div class="page-break"></div>`;
        printHTMLStr += buildPrintHeaderHTML(tName, data.format, ''); 
        printHTMLStr += `<div class="summary-page-wrapper">${warningHTML}<div id="statsTableWrapperPrint">${tableHTML}</div></div>`;
    }
    printView.innerHTML = printHTMLStr;
    
    updateButtonStates();
}