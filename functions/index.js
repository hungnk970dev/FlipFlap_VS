

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");


setGlobalOptions({ maxInstances: 10 });

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ========== DECK FUNCTIONS ==========

/**
 * Tạo deck mới
 * POST /api/decks
 */
exports.createDeck = functions.https.onCall(async (data, context) => {
    // Kiểm tra authentication (tùy chọn)
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
    // }
    
    const { name, description, color } = data;
    
    if (!name) {
        throw new functions.https.HttpsError('invalid-argument', 'Deck name is required');
    }
    
    const deckRef = await db.collection('decks').add({
        name,
        description: description || '',
        color: color || '#FF7B00',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        cardCount: 0,
        folderCount: 0
    });
    
    return { id: deckRef.id, message: 'Deck created successfully' };
});


exports.getDecks = functions.https.onCall(async (data, context) => {
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
    
    return { decks };
});


exports.deleteDeck = functions.https.onCall(async (data, context) => {
    const { deckId } = data;
    
    if (!deckId) {
        throw new functions.https.HttpsError('invalid-argument', 'Deck ID is required');
    }
    
    const deckRef = db.collection('decks').doc(deckId);
    
    // Xóa tất cả cards trong deck
    const cardsSnapshot = await deckRef.collection('cards').get();
    const batch = db.batch();
    
    cardsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    // Xóa deck
    batch.delete(deckRef);
    
    await batch.commit();
    
    return { message: 'Deck deleted successfully' };
});


exports.onDeckDelete = functions.firestore
    .document('decks/{deckId}')
    .onDelete(async (snap, context) => {
        const deckId = context.params.deckId;
        
        // Xóa tất cả cards
        const cardsSnapshot = await db.collection('decks').doc(deckId)
            .collection('cards').get();
        
        const batch = db.batch();
        cardsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`Deleted all cards for deck: ${deckId}`);
    });


exports.onCardWrite = functions.firestore
    .document('decks/{deckId}/cards/{cardId}')
    .onWrite(async (change, context) => {
        const deckId = context.params.deckId;
        const deckRef = db.collection('decks').doc(deckId);
        
        // Đếm số cards hiện tại
        const cardsSnapshot = await deckRef.collection('cards').get();
        const cardCount = cardsSnapshot.size;
        
        // Cập nhật deck
        await deckRef.update({
            cardCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
