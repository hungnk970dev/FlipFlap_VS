

// Đợi Firebase khởi tạo xong
document.addEventListener('DOMContentLoaded', function() {
    
    // ========== DECK OPERATIONS ==========
    
    // Tạo Deck mới
    async function createDeck(deckData) {
        try {
            const docRef = await db.collection('decks').add({
                name: deckData.name,
                description: deckData.description,
                color: deckData.color,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                cardCount: 0,
                folderCount: 0
            });
            console.log("Deck created with ID: ", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error adding deck: ", error);
        }
    }

    // Lấy tất cả Decks
    async function getAllDecks() {
        try {
            const snapshot = await db.collection('decks')
                .orderBy('createdAt', 'desc')
                .get();
            
            const decks = [];
            snapshot.forEach(doc => {
                decks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return decks;
        } catch (error) {
            console.error("Error getting decks: ", error);
        }
    }

    // Cập nhật Deck
    async function updateDeck(deckId, updatedData) {
        try {
            await db.collection('decks').doc(deckId).update({
                ...updatedData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Deck updated successfully!");
        } catch (error) {
            console.error("Error updating deck: ", error);
        }
    }

    // Xóa Deck
    async function deleteDeck(deckId) {
        try {
            await db.collection('decks').doc(deckId).delete();
            console.log("Deck deleted successfully!");
        } catch (error) {
            console.error("Error deleting deck: ", error);
        }
    }

    // ========== FLASHCARD OPERATIONS ==========

    // Tạo Flashcard mới
    async function createCard(deckId, cardData) {
        try {
            const docRef = await db.collection('decks').doc(deckId)
                .collection('cards').add({
                    front: cardData.front,
                    back: cardData.back,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastReviewed: null,
                    reviewCount: 0
                });
            
            // Cập nhật số lượng card trong deck
            await db.collection('decks').doc(deckId).update({
                cardCount: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("Card created with ID: ", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error adding card: ", error);
        }
    }

    // Lấy tất cả Cards trong một Deck
    async function getCardsInDeck(deckId) {
        try {
            const snapshot = await db.collection('decks').doc(deckId)
                .collection('cards')
                .orderBy('createdAt', 'desc')
                .get();
            
            const cards = [];
            snapshot.forEach(doc => {
                cards.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return cards;
        } catch (error) {
            console.error("Error getting cards: ", error);
        }
    }

    // ========== EXPORT TO GLOBAL SCOPE ==========
    window.createDeck = createDeck;
    window.getAllDecks = getAllDecks;
    window.updateDeck = updateDeck;
    window.deleteDeck = deleteDeck;
    window.createCard = createCard;
    window.getCardsInDeck = getCardsInDeck;

    // ========== INITIAL LOAD ==========
    loadDecks();
});

// Load decks khi trang load
async function loadDecks() {
    const decks = await window.getAllDecks();
    renderDecks(decks);
}

// Render decks ra HTML
function renderDecks(decks) {
    const container = document.querySelector('.grid');
    if (!container) return;
    
    // Xóa decks cũ (giữ lại nút "Create New Deck")
    const createButton = container.querySelector('button:last-child');
    container.innerHTML = '';
    
    decks.forEach(deck => {
        const deckElement = createDeckElement(deck);
        container.appendChild(deckElement);
    });
    
    if (createButton) {
        container.appendChild(createButton);
    }
}