const MATERIES_LOMLOE = {
    "1ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques", "Geografia i Història", "Biologia i Geologia", "Educació Física", "Visual i Plàstica"],
    "2ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques", "Geografia i Història", "Física i Química", "Educació Física", "Música", "Tecnologia i Digitalització"],
    "3ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques", "Geografia i Història", "Biologia i Geologia", "Física i Química", "Educació Física", "Educació en Valors Cívics"],
    "4ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques (A/B)", "Geografia i Història", "Educació Física", "Llatí", "Biologia i Geologia", "Física i Química", "Economia i Emprenedoria", "Tecnologia", "Filosofia"],
    "1BAT": ["Llengua Catalana i Literatura I", "Llengua Castellana i Literatura I", "Anglès I", "Filosofia", "Educació Física", "Matemàtiques I", "Llatí I", "Matemàtiques Aplicades a les CCSS I", "Història del Món Contemporani", "Dibuix Tècnic I", "Química I", "Biologia I"],
    "2BAT": ["Llengua Catalana i Literatura II", "Llengua Castellana i Literatura II", "Anglès II", "Història d'Espanya", "Història de la Filosofia", "Matemàtiques II", "Llatí II", "Matemàtiques Aplicades a les CCSS II", "Geografia", "Física II", "Química II", "Biologia II", "Història de l'Art"]
};

function readLocalStorage(key, defaultData) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultData;
    } catch (e) {
        return defaultData;
    }
}

function writeLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
}
