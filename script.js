let cards = [];
let imageMap = {};

// --- 1. DATA PROCESSING ---
document.getElementById('process-btn').addEventListener('click', () => {
    const text = document.getElementById('raw-input').value;
    if (!text.trim()) return alert("Please enter data.");

    const lines = text.split('\n');
    cards = lines.filter(line => line.includes('|')).map((line, index) => {
        const parts = line.split('|').map(p => p.trim());
        return {
            id: Date.now() + index,
            front: parts[0] ? parts[0].replace(/Front:\s*/i, '') : '',
            back: parts[1] ? parts[1].replace(/Back:\s*/i, '') : '',
            tags: parts[2] ? parts[2].replace(/Tags:\s*/i, '') : 'General'
        };
    });

    if (cards.length === 0) return alert("Format Error: Use '|' to separate fields.");
    renderSiftingStage();
});

// --- 2. ASSET MAPPING ---
document.getElementById('image-upload').addEventListener('change', (e) => {
    for (let file of e.target.files) {
        imageMap[file.name] = file;
    }
    document.getElementById('file-list-count').innerText = `${Object.keys(imageMap).length} assets ready`;
});

// --- 3. UI RENDERING ---
function renderSiftingStage() {
    document.getElementById('upload-stage').style.display = 'none';
    document.getElementById('sift-stage').classList.remove('hidden');
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'review-card';
        
        // Check for images in both fields
        const frontImg = imageMap[card.front.trim()] ? `<div class="img-preview">📸 ${card.front}</div>` : '';
        const backImg = imageMap[card.back.trim()] ? `<div class="img-preview">📸 ${card.back}</div>` : '';

        cardEl.innerHTML = `
            <div class="card-controls">
                <span class="tag-pill">#${card.tags}</span>
                <button class="delete-icon" onclick="deleteCard(${card.id})">✕</button>
            </div>
            <div class="field-label">Front</div>
            <input type="text" value="${card.front}" onchange="updateCard(${card.id}, 'front', this.value)">
            ${frontImg}
            <div class="field-label">Back</div>
            <textarea onchange="updateCard(${card.id}, 'back', this.value)">${card.back}</textarea>
            ${backImg}
        `;
        grid.appendChild(cardEl);
    });
    document.getElementById('card-count').innerText = cards.length;
}

window.updateCard = (id, field, value) => {
    const card = cards.find(c => c.id === id);
    if (card) card[field] = value;
};

window.deleteCard = (id) => {
    cards = cards.filter(c => c.id !== id);
    renderSiftingStage();
};

// --- 4. CSV EXPORT (PRODUCTION READY) ---
document.getElementById('export-btn').addEventListener('click', () => {
    if (cards.length === 0) return;

    // Header row with Anki formatting directives
    let csvRows = ["#separator:Semicolon", "#html:true", "#tags column:3"];
    csvRows.push("Front;Back;Tags"); 

    cards.forEach(card => {
        let f = card.front;
        let b = card.back;

        // Convert image filenames to Anki HTML tags
        if (imageMap[f.trim()]) f = `<img src="${f.trim()}">`;
        if (imageMap[b.trim()]) b = `<img src="${b.trim()}">`;

        // Wrap in quotes and escape internal quotes for CSV safety
        const safeF = `"${f.replace(/"/g, '""')}"`;
        const safeB = `"${b.replace(/"/g, '""')}"`;
        const safeT = `"${card.tags.replace(/"/g, '""')}"`;

        csvRows.push(`${safeF};${safeB};${safeT}`);
    });

    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvBlob);
    link.download = `ankIMAT_Export_${Date.now()}.csv`;
    link.click();
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());
