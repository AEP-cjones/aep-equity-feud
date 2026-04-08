import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, remove, push } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAHnvT7oyR9HclZmcO-5ehkR1kMeVmzkSg',
  authDomain: 'cap-table-catastrophe.firebaseapp.com',
  databaseURL: 'https://cap-table-catastrophe-default-rtdb.firebaseio.com',
  projectId: 'cap-table-catastrophe',
  storageBucket: 'cap-table-catastrophe.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

const ROOT = 'familyfeud'

export function dbRef(path: string) {
  return ref(db, `${ROOT}/${path}`)
}

export { db, ref, set, get, update, onValue, remove, push, ROOT }
