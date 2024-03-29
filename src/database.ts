import {FirebaseApp, initializeApp} from 'firebase/app';
import {getDatabase, ref, set, get, onValue, child} from 'firebase/database';

// The LED grid ID. We always use 1, since we want this to be relected for all users.
const LED_GRID_ID = "1";

const firebaseConfig = {
  apiKey: "AIzaSyD87rzf0euVP2PXOz82XcqQBbyOoi1TyE0",
  authDomain: "emoji-led-matrix-controller.firebaseapp.com",
  databaseURL: "https://emoji-led-matrix-controller-default-rtdb.firebaseio.com",
  projectId: "emoji-led-matrix-controller",
  storageBucket: "emoji-led-matrix-controller.appspot.com",
  messagingSenderId: "848106107839",
  appId: "1:848106107839:web:26343953651f355cbe670a"
};

export class EmojiDatabase {
  private app: FirebaseApp;

  constructor() {
    this.app = initializeApp(firebaseConfig); 
  }
  
  // Sets an emoji to the database.
  async setEmoji(emoji: string) {
    const db = getDatabase(this.app);
    set(ref(db, 'ledgrids/' + LED_GRID_ID), {
      emoji: emoji 
    });
  }
  
  // Reads the current emoji on the database.
  async getEmoji(): Promise<string> {
    const dbRef = ref(getDatabase());
    const snapshot = await get(child(dbRef, `ledgrids/${LED_GRID_ID}`));
    if (snapshot.exists()) {
      return snapshot.val() as string;
    } else {
      return '🦙';
    }
  }
  
  // Listens for changes to the emoji on the database.
  async onEmojiUpdate(callback: (string) => void) {
    const db = getDatabase();
    const starCountRef = ref(db, 'ledgrids/' + LED_GRID_ID + '/emoji');
    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val() as string;
      callback(data);
    });
  }
}

