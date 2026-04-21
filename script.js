let cards = [];
let imageMap = {};

// --- STAGE 1: PARSING ---
document.getElementById('process-btn').addEventListener('click', () => {
    const text = document.getElementById('raw-input').value;
    if (!text.trim()) return alert("Please paste data first.");

    const lines = text.split('\n');
    cards = lines.filter(line => line.includes('|')).map((line, index) => {
        const parts = line.split('|').map(p => p.trim());
        return {
            id: Date.now() + index,
            front: parts[0] ? parts[0].replace(/Front:\s*/i, '').trim() : '',
            back: parts[1] ? parts[1].replace(/Back:\s*/i, '').trim() : '',
            type: parts[2] ? parts[2].replace(/Type:\s*/i, '').trim() : 'String',
            tags: parts[3] ? parts[3].replace(/Tags:\s*/i, '').trim() : 'General'
        };
    });

    if (cards.length === 0) return alert("No valid format detected (ensure you use the '|' separator)");
    renderSiftingStage();
});

// --- STAGE 2: IMAGES ---
document.getElementById('image-upload').addEventListener('change', (e) => {
    for (let file of e.target.files) {
        imageMap[file.name] = file;
    }
    document.getElementById('file-list-count').innerText = `${Object.keys(imageMap).length} images mapped.`;
});

// --- STAGE 3: UI ---
function renderSiftingStage() {
    document.getElementById('upload-stage').classList.add('hidden');
    document.getElementById('sift-stage').classList.remove('hidden');
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'flashcard';
        let imgHtml = '';
        const possibleImg = imageMap[card.front] || imageMap[card.back];
        if (possibleImg) {
            const url = URL.createObjectURL(possibleImg);
            imgHtml = `<img src="${url}" class="card-preview-img" style="max-width:100%; margin-top:10px;">`;
        }
        cardEl.innerHTML = `
            <button class="delete-btn" onclick="deleteCard(${card.id})">✕</button>
            <div class="card-type">${card.type.toUpperCase()}</div>
            <input type="text" value="${card.front}" onchange="updateCard(${card.id}, 'front', this.value)">
            <textarea onchange="updateCard(${card.id}, 'back', this.value)">${card.back}</textarea>
            ${imgHtml}
            <div style="font-size:10px; color:#aaa; margin-top:5px">#${card.tags}</div>
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

// --- STAGE 4: EXPORT ---
document.getElementById('export-btn').addEventListener('click', async () => {
    if (cards.length === 0) return alert("No cards to export.");
    if (!window.SQL) return alert("SQL Engine is still loading. Wait 2 seconds.");

    // Detect the library from your local genanki.js
    const AnkiLib = window.Anki || window.genanki || window.GenAnki;

    if (!AnkiLib) {
        console.error("DEBUG: window.Anki is", window.Anki);
        return alert("Anki Library not loaded yet. Ensure genanki.js is in your GitHub folder and refresh.");
    }

    try {
        const { Package, Deck, Model } = AnkiLib;

        const model = new Model({
            name: "EAP_Model",
            id: "1616161616",
            flds: [{ name: "Front" }, { name: "Back" }, { name: "Media" }],
            tmpls: [{
                name: "Default",
                qfmt: '<div style="text-align:center; font-family: Arial; font-size:24px;">{{Front}}</div><div style="margin-top:20px; text-align:center;">{{Media}}</div>',
                afmt: '{{FrontSide}}<hr id="answer"><div style="text-align:center; font-family: Arial; font-size:20px;">{{Back}}</div>',
            }],
        });

        const deck = new Deck(Date.now(), "EAP Generated Deck");

        cards.forEach(card => {
            let mediaTag = "";
            if (imageMap[card.front]) mediaTag = `<img src="${card.front}">`;
            else if (imageMap[card.back]) mediaTag = `<img src="${card.back}">`;
            deck.addNote(model.note([card.front, card.back, mediaTag], [card.tags]));
        });

        const pkg = new Package();
        pkg.addDeck(deck);
        Object.keys(imageMap).forEach(name => pkg.addMedia(imageMap[name], name));

        const zip = await pkg.writeToFile();
        const blob = new Blob([zip], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "EAP_Deck.apkg";
        link.click();

    } catch (err) {
        console.error("Export Error:", err);
        alert("Export failed: " + err.message);
    }
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm("Start over?")) location.reload();
});
