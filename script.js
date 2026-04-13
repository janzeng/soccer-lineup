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
    
    let teamNameInput = document.getElementById('teamName');
    teamNameInput.value = data.teamName || "";
    teamNameInput.onchange = saveUI; 
    
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

    players.sort((a, b) => {
        let nameA = a.name.toLowerCase();
        let nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
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
        if
