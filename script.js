let cards = [];
let imageMap = {};

// Stage 1: Processing the NotebookLM Input
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

    if (cards.length === 0) return alert("No valid card format detected. Ensure lines contain the '|' separator.");
    renderSiftingStage();
});

// Handling Image Files
document.getElementById('image-upload').addEventListener('change', (e) => {
    const files = e.target.files;
    for (let file of files) {
        imageMap[file.name] = file;
    }
    document.getElementById('file-list-count').innerText = `${Object.keys(imageMap).length} images mapped.`;
});

// UI Rendering for the Sifting Stage
function renderSiftingStage() {
    document.getElementById('upload-stage').classList.add('hidden');
    document.getElementById('sift-stage').classList.remove('hidden');
    
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'flashcard';
        
        // Preview logic
        let imgHtml = '';
        const possibleImg = imageMap[card.front] || imageMap[card.back];
        if (possibleImg) {
            const url = URL.createObjectURL(possibleImg);
            imgHtml = `<img src="${url}" class="card-preview-img">`;
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

// Final .apkg Export Logic
document.getElementById('export-btn').addEventListener('click', async () => {
    if (cards.length === 0) return alert("No cards to export.");

    // SAFETY CHECK: Detect library naming variations
    const AnkiEngine = window.GenAnki || window.genanki;
    if (!AnkiEngine) {
        return alert("Anki Library not loaded yet. Please check your internet connection or refresh.");
    }

    const { Package, Deck, Model } = AnkiEngine;

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
        // Mapping image assets based on filenames mentioned in the text
        if (imageMap[card.front]) {
            mediaTag = `<img src="${card.front}">`;
        } else if (imageMap[card.back]) {
            mediaTag = `<img src="${card.back}">`;
        }

        deck.addNote(model.note([card.front, card.back, mediaTag], [card.tags]));
    });

    const pkg = new Package();
    pkg.addDeck(deck);
    
    // Attach image binary data to the final package
    Object.keys(imageMap).forEach(name => {
        pkg.addMedia(imageMap[name], name);
    });

    try {
        const zip = await pkg.writeToFile();
        const blob = new Blob([zip], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "My_EAP_Deck.apkg";
        link.click();
    } catch (err) {
        console.error(err);
        alert("Error generating deck: " + err.message);
    }
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());
