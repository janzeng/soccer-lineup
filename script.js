const ROLE_KEYS = ['C', 'G', 'S', 'F', 'M', 'D', 'A'];
const ROLE_MAP = { 'C': 'Cap', 'G': 'Goal', 'S': 'S', 'F': 'F', 'M': 'M', 'D': 'D', 'A': 'Abs' };
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

window.onload = () => { loadUI(); };

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function updateButtonStates() {
    let rows = document.querySelectorAll('#playerList tr');
    let hasPlayers = false;
    rows.forEach(row => {
        if (row.querySelector('.p-name').value.trim() !== "") hasPlayers = true;
    });
    
    document.getElementById('exportBtn').disabled = !hasPlayers;
    document.getElementById('clearBtn').disabled = !hasPlayers;
    
    let webViewContent = document.getElementById('web-view').innerHTML.trim();
    document.getElementById('printBtn').disabled = (webViewContent === "");
}

function checkLiveUpdate() {
    if (document.getElementById('web-view').innerHTML.trim() !== "") {
        generate();
    }
}

function loadUI() {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { teamName: "", format: "7v7", includeSummary: false, players: [] };
    
    document.getElementById('teamName').value = data.teamName || "";
    document.getElementById('fieldFormat').value = data.format || "7v7";
    document.getElementById('includeSummary').checked = data.includeSummary || false;
    
    const tbody = document.getElementById('playerList');
    tbody.innerHTML = '';
    
    let initialPlayers = data.players.length > 0 ? data.players : Array(7).fill({name: '', roles: []});
    initialPlayers.forEach(p => addPlayerRow(p.name, p.roles));
    
    updateButtonStates();
}

function saveUI() {
    let teamName = document.getElementById('teamName').value.trim();
    let format = document.getElementById('fieldFormat').value;
    let includeSummary = document.getElementById('includeSummary').checked;
    let rows = document.querySelectorAll('#playerList tr');
    let players = [];

    rows.forEach(row => {
        let name = row.querySelector('.p-name').value.trim();
        if (name !== "") {
            let roles = Array.from(row.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            players.push({ name, roles });
        }
    });

    let data = { teamName, format, includeSummary, players };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateButtonStates();
    return data;
}

function addPlayerRow(name = '', roles = []) {
    const tbody = document.getElementById('playerList');
    let tr = document.createElement('tr');
    if (roles.includes('A')) tr.className = 'absent-row';
    
    let html = `<td><input type="text" class="p-name" value="${name}" placeholder="Player Name" oninput="saveUI()"></td>`;
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

function clearRoster() {
    if (confirm("Are you sure you want to clear the entire roster?")) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('teamName').value = "";
        document.getElementById('web-view').innerHTML = "";
        document.getElementById('print-view').innerHTML = "";
        document.getElementById('statsContainer').innerHTML = "";
        loadUI();
    }
}

function exportData() {
    let data = saveUI();
    if (data.players.length === 0) return;
    
    let plainTextJson = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(plainTextJson).then(() => {
        alert("Roster JSON copied to clipboard! You can also save this text in a note or email.");
    }).catch(err => {
        prompt("Copy this roster text manually:", plainTextJson);
    });
}

function importData() {
    let text = document.getElementById('importText').value.trim();
    if (!text) return;
    try {
        let decoded = JSON.parse(text);
        if (decoded.format && decoded.players) {
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
    if (!roles || roles.length === 0 || roles.includes('A')) return false;
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
    if (roles.length === 0) return name;
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

function generate() {
    const data = saveUI();
    const webView = document.getElementById('web-view');
    const printView = document.getElementById('print-view');
    
    webView.innerHTML = "";
    printView.innerHTML = "";

    let tName = data.teamName || "Unnamed Team";
    const formatConfig = FORMATS[data.format];
    const slotOrder = formatConfig.slots;

    let rolesMap = {};
    data.players.forEach(p => rolesMap[p.name] = p.roles);

    const activePlayers = data.players.filter(p => p.roles.length > 0 && !p.roles.includes('A')).map(p => p.name);
    const absentPlayers = data.players.filter(p => p.roles.includes('A')).map(p => p.name);
    const goalies = activePlayers.filter(name => rolesMap[name].includes('G'));
    
    let stats = {};
    activePlayers.forEach(name => stats[name] = { in: 0, bench: 0 });

    let footerHTML = `<div class="roster-footer"><div><b>ROSTER:</b> ${activePlayers.map(p => formatNamePrint(p, rolesMap[p], true)).join(', ')}</div>`;
    if (absentPlayers.length > 0) footerHTML += `<div style="color: #666; margin-top: 5px;"><b>ABSENT:</b> ${absentPlayers.join(', ')}</div>`;
    footerHTML += `</div>`;

    let currentAssignments = {};
    slotOrder.forEach(s => currentAssignments[s] = "");
    currentAssignments['gk'] = "";

    let webHTMLStr = "";
    let printHTMLStr = "";

    for (let q = 1; q <= 4; q++) {
        if (q === 1) printHTMLStr += buildPrintHeaderHTML(tName, data.format, '1st Half');
        if (q === 3) {
            printHTMLStr += footerHTML;
            printHTMLStr += `<div class="page-break"></div>`;
            printHTMLStr += buildPrintHeaderHTML(tName, data.format, '2nd Half');
        }

        for (let r = 1; r <= 2; r++) {
            const isReset = (q === 1 && r === 1) || (q === 3 && r === 1);
            let subsDisplay = [];
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

            if (goalies.length === 2 && q === 2 && r === 2 && restingGK) {
                fieldPool = fieldPool.filter(n => n !== restingGK);
                let slotToVacate = slotOrder.find(s => currentAssignments[s] === restingGK);
                if (slotToVacate) {
                    currentAssignments[slotToVacate] = "";
                    vacatedByBreak = restingGK; 
                }
            }

            if (isReset) {
                let unassigned = [...fieldPool];
                slotOrder.forEach(slot => {
                    let eligible = unassigned.filter(name => isEligible(rolesMap[name], slot));
                    eligible.sort((a, b) => stats[a].in - stats[b].in); 
                    if (eligible.length > 0) {
                        currentAssignments[slot] = eligible[0];
                        unassigned = unassigned.filter(n => n !== eligible[0]);
                    } else { currentAssignments[slot] = ""; }
                });
                let benchedThisShift = unassigned;
                subsDisplay = benchedThisShift.length > 0 ? ["<b>Bench:</b> " + benchedThisShift.join(', ')] : ["No Subs"];
            } else {
                slotOrder.forEach(slot => {
                    if (currentAssignments[slot] === "") {
                        let eligibleBench = fieldPool.filter(n => !Object.values(currentAssignments).includes(n) && isEligible(rolesMap[n], slot));
                        eligibleBench.sort((a, b) => stats[a].in - stats[b].in);
                        if (eligibleBench.length > 0) {
                            currentAssignments[slot] = eligibleBench[0];
                            let outgoingText = vacatedByBreak ? vacatedByBreak : "Empty";
                            subsDisplay.push(`<b>${eligibleBench[0]}</b> <span class="arrow">→</span> ${outgoingText}`);
                            vacatedByBreak = null; 
                        }
                    }
                });

                let onFieldBefore = slotOrder.map(s => currentAssignments[s]).filter(n => n !== "");
                let benchBefore = fieldPool.filter(n => !Object.values(currentAssignments).includes(n));
                
                benchBefore.sort((a, b) => stats[a].in - stats[b].in); 
                
                benchBefore.forEach(incomingPlayer => {
                    let removableSlots = slotOrder.filter(slot => isEligible(rolesMap[incomingPlayer], slot) && currentAssignments[slot] !== "");
                    let removablePlayers = removableSlots.map(slot => currentAssignments[slot]);
                    
                    removablePlayers.sort((a, b) => stats[b].in - stats[a].in); 
                    
                    if (removablePlayers.length > 0) {
                        let outgoingPlayer = removablePlayers[0];
                        let slotToSwap = slotOrder.find(s => currentAssignments[s] === outgoingPlayer);
                        
                        currentAssignments[slotToSwap] = incomingPlayer;
                        subsDisplay.push(`<b>${incomingPlayer}</b> <span class="arrow">→</span> ${outgoingPlayer}`);
                        
                        onFieldBefore = onFieldBefore.filter(n => n !== outgoingPlayer);
                        onFieldBefore.push(incomingPlayer); 
                    }
                });
                if (subsDisplay.length === 0) subsDisplay = ["No Substitutions"];
            }

            activePlayers.forEach(name => {
                if (Object.values(currentAssignments).includes(name)) stats[name].in++;
                else stats[name].bench++;
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
            
            webHTMLStr += cardHTML;
            printHTMLStr += cardHTML;
        }
    }
    
    printHTMLStr += footerHTML;

    let tableHTML = `<table class="stats-table"><tr><th>Player Name</th><th>Roles Assigned</th><th>Shifts In</th><th>Shifts Bench</th></tr>`;
    data.players.forEach(p => {
        let roles = p.roles;
        let displayRoles = roles.length === 0 ? 'Unassigned' : roles.map(r => ROLE_MAP[r]).join(', ');

        if (roles.length === 0) {
            tableHTML += `<tr class="absent-text"><td><b>${p.name}</b></td><td>Unassigned</td><td>0</td><td>0</td></tr>`;
        } else if (roles.includes('A')) {
            tableHTML += `<tr class="absent-text"><td><del>${p.name}</del></td><td>Absent</td><td>0</td><td>0</td></tr>`;
        } else {
            tableHTML += `<tr><td><b>${p.name}</b></td><td>${displayRoles}</td><td>${stats[p.name].in}</td><td>${stats[p.name].bench}</td></tr>`;
        }
    });
    tableHTML += `</table>`;
    
    document.getElementById('statsContainer').innerHTML = tableHTML;
    webView.innerHTML = webHTMLStr;

    if (data.includeSummary) {
        printHTMLStr += `<div class="page-break"></div>`;
        printHTMLStr += buildPrintHeaderHTML(tName, data.format, ''); 
        printHTMLStr += `<div class="summary-page-wrapper">${tableHTML}</div>`;
    }
    printView.innerHTML = printHTMLStr;
    
    updateButtonStates();
}
