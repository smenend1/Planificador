const DB_NAME = 'PlanificadorDocentDB';
const DB_VERSION = 3;

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Creación limpia de los almacenes
            if (!db.objectStoreNames.contains('asignaturas')) {
                db.createObjectStore('asignaturas', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('secuencias')) {
                db.createObjectStore('secuencias', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('historial')) {
                db.createObjectStore('historial', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function guardarDato(storeName, data) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function obtenerTodos(storeName) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function vaciarStore(storeName) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
    });
}
