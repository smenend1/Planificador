const DB_NAME = 'DocentePlannerDB';
const DB_VERSION = 1;
let dbInstance = null;

function initDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('asignaturas')) {
                db.createObjectStore('asignaturas', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('historial')) {
                db.createObjectStore('historial', { keyPath: 'fechaReal' });
            }
            if (!db.objectStoreNames.contains('secuencias')) {
                db.createObjectStore('secuencias', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => reject(event.target.error);
    });
}

async function guardarDato(storeName, objeto) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(objeto);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

async function obtenerTodos(storeName) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function vaciarStore(storeName) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}