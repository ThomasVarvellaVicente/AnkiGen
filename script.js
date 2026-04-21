let cards = [];
let imageAssets = new Set();

// INITIALIZE PIPELINE
document.getElementById('process-btn').addEventListener('click', () => {
    const rawData = document.getElementById('raw-input').value.trim();
    if (!rawData) return;

    cards = rawData.split('\n').filter(l => l.includes('|')).map((line, i) => {
        const parts = line.split('|').map(p => p.trim());
        return {
            id: Date.now() + i,
            front: parts[0] ? parts[0].replace(/Front:\s*/i, '') : '',
            back: parts[1] ? parts[1].replace(/Back:\s*/i, '') : '',
            tags: parts[2] ? parts[2].replace(/Tags:\s*/i, '') : 'General'
        };
    });

    if (cards.length > 0) renderReviewStage();
});

// ASSET MANAGEMENT
document.getElementById('image-upload').addEventListener('change', (e) => {
    for (let file of e.target.files) imageAssets.add(file.name.trim());
    document.getElementById('file-list-count').innerText = `${imageAssets.size} assets mapped`;
});

// RENDER CARDS
function renderReviewStage() {
    document.getElementById('upload-stage').classList.add('hidden');
    document.getElementById('sift-stage').classList.remove('hidden');
    
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    cards.forEach(card => {
        const hasFrontImg = imageAssets.has(card.front.trim());
        const hasBackImg = imageAssets.has(card.back.trim());

        const cardNode = document.createElement('div');
        cardNode.className = 'review-card';
        cardNode.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <span class="tag-pill">#${card.tags}</span>
                <button onclick="removeCard(${card.id})" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
            </div>
            <label style="font-size:0.7rem; color:#94a3b8">FRONT</label>
            <input type="text" value="${card.front}" onchange="editCard(${card.id}, 'front', this.value)">
            ${hasFrontImg ? `<div style="font-size:0.75rem; color:#22d3ee; margin-top:5px;">📸 Linked: ${card.front}</div>` : ''}
            
            <div style="margin-top:15px;">
                <label style="font-size:0.7rem; color:#94a3b8">BACK</label>
                <textarea onchange="editCard(${card.id}, 'back', this.value)">${card.back}</textarea>
                ${hasBackImg ? `<div style="font-size:0.75rem; color:#22d3ee; margin-top:5px;">📸 Linked: ${card.back}</div>` : ''}
            </div>
        `;
        grid.appendChild(cardNode);
    });
    document.getElementById('card-count').innerText = cards.length;
}

// EDITING FUNCTIONS
window.editCard = (id, field, val) => { const c = cards.find(x => x.id === id); if(c) c[field] = val; };
window.removeCard = (id) => { cards = cards.filter(x => x.id !== id); renderReviewStage(); };

// FINAL CSV EXPORT
document.getElementById('export-btn').addEventListener('click', () => {
    let output = ["#separator:Semicolon", "#html:true", "#tags column:3", "Front;Back;Tags"];

    cards.forEach(c => {
        let f = imageAssets.has(c.front.trim()) ? `<img src="${c.front.trim()}">` : c.front;
        let b = imageAssets.has(c.back.trim()) ? `<img src="${c.back.trim()}">` : c.back;
        
        const row = [f, b, c.tags].map(v => `"${v.replace(/"/g, '""')}"`).join(';');
        output.push(row);
    });

    const blob = new Blob([output.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ankIMAT_${Date.now()}.csv`;
    link.click();
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());
