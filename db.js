let db;

function inicializarDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PlanificadorLOMLOEDB', 3);

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains('asignaturas')) {
                dbInstance.createObjectStore('asignaturas', { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains('secuencias')) {
                dbInstance.createObjectStore('secuencias', { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains('historial')) {
                dbInstance.createObjectStore('historial', { keyPath: 'fechaReal' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => reject(event.target.error);
    });
}

async function obtenerTodos(storeName) {
    if (!db) await inicializarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(transaction.objectStoreNames[0]);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function guardarDato(storeName, data) {
    if (!db) await inicializarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(transaction.objectStoreNames[0]);
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function vaciarStore(storeName) {
    if (!db) await inicializarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(transaction.objectStoreNames[0]);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
