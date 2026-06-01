let asignaturas = readLocalStorage('asig', [
    { id: "4ESO-Tecnologia-A", nombre: "4t d'ESO - Tecnologia (Grup A)", diasLectivos: [1, 2, 3] },
    { id: "1ESO-Matemàtiques-A", nombre: "1r d'ESO - Matemàtiques (Grup A)", diasLectivos: [1, 3] }
]);
let historial = readLocalStorage('hist', []);
let secuencias = readLocalStorage('sec', []);

// Generar temari per defecte si està net
if (secuencias.length === 0) {
    asignaturas.forEach(a => {
        for (let i = 1; i <= 20; i++) {
            secuencias.push({ id: "SEC-" + a.id + "-" + i, curso: a.id, orden: i, contenido: "Tema de treball planificat: Sessió número " + i + " de la programació curricular." });
        }
    });
    writeLocalStorage('sec', secuencias);
}

let asignaturaSeleccionada = asignaturas[0] ? asignaturas[0].id : "";

document.addEventListener('DOMContentLoaded', () => {
    initLOMLOEDropdowns();
    initUIElements();
    recalcularYRenderizar();
});

function initLOMLOEDropdowns() {
    const etapaSelect = document.getElementById('reg-etapa');
    const materiaSelect = document.getElementById('reg-materia');
    if(!etapaSelect || !materiaSelect) return;

    function actualizarMaterias() {
        const etapa = etapaSelect.value;
        const llista = MATERIES_LOMLOE[etapa] || [];
        materiaSelect.innerHTML = llista.map(m => '<option value="' + m + '">' + m + '</option>').join('');
    }

    etapaSelect.addEventListener('change', actualizarMaterias);
    actualizarMaterias();

    document.getElementById('btn-afegir-materia').addEventListener('click', () => {
        const etapaTxt = etapaSelect.options[etapaSelect.selectedIndex].text;
        const materia = materiaSelect.value;
        const grup = document.getElementById('reg-grup').value;
        
        const idGenerat = etapaSelect.value + "-" + materia.replace(/\s+/g, '') + "-" + grup;
        const nomComplet = etapaTxt + " - " + materia + " (Grup " + grup + ")";

        if (asignaturas.some(a => a.id === idGenerat)) return alert("⚠️ Ja existeix aquesta matèria.");

        asignaturas.push({ id: idGenerat, nombre: nomComplet, diasLectivos: [1, 2, 3] });

        for (let i = 1; i <= 20; i++) {
            secuencias.push({ id: "SEC-" + idGenerat + "-" + i, curso: idGenerat, orden: i, contenido: "Tema de treball planificat: Sessió número " + i + " de la programació curricular." });
        }

        asignaturaSeleccionada = idGenerat;
        saveAll();
        actualizarSelectorTrabajo();
        marcarChecksDias();
        recalcularYRenderizar();
    });
}

function actualizarSelectorTrabajo() {
    const sel = document.getElementById('select-asignatura');
    if(!sel) return;
    sel.innerHTML = asignaturas.map(a => '<option value="' + a.id + '" ' + (a.id === asignaturaSeleccionada ? 'selected' : '') + '>' + a.nombre + '</option>').join('');
    if (asignaturas.length === 0) sel.innerHTML = '<option value="">Sense matèries actives</option>';
}

function marcarChecksDias() {
    const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.checked = asig ? asig.diasLectivos.includes(parseInt(chk.value)) : false;
    });
}

function initUIElements() {
    actualizarSelectorTrabajo();
    
    document.getElementById('select-asignatura').addEventListener('change', (e) => {
        asignaturaSeleccionada = e.target.value;
        marcarChecksDias();
        recalcularYRenderizar();
    });

    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.addEventListener('change', () => {
            const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
            if (!asig) return;
            asig.diasLectivos = Array.from(document.querySelectorAll('.chk-dia:checked')).map(c => parseInt(c.value));
            saveAll();
            recalcularYRenderizar();
        });
    });

    document.getElementById('btn-completar').addEventListener('click', () => registrarDia('IMPARTIDA'));
    document.getElementById('btn-incidencia').addEventListener('click', () => registrarDia('VAGA / FESTIU / BAIXA'));
    document.getElementById('btn-print').addEventListener('click', () => window.print());

    document.getElementById('btn-eliminar-materia').addEventListener('click', () => {
        if (!asignaturaSeleccionada) return alert("Selecciona una matèria.");
        if (confirm("Vols eliminar de la memòria aquesta matèria i totes les seves dades associades?")) {
            asignaturas = asignaturas.filter(a => a.id !== asignaturaSeleccionada);
            secuencias = secuencias.filter(s => s.curso !== asignaturaSeleccionada);
            historial = historial.filter(h => h.asignaturaId !== asignaturaSeleccionada);
            asignaturaSeleccionada = asignaturas.length > 0 ? asignaturas[0].id : "";
            saveAll();
            actualizarSelectorTrabajo();
            marcarChecksDias();
            recalcularYRenderizar();
        }
    });

    document.getElementById('btn-editar-hoy').addEventListener('click', () => {
        const secuenciaAsig = secuencias.filter(s => s.curso === asignaturaSeleccionada).sort((a,b) => a.orden - b.orden);
        const historialAsig = historial.filter(h => h.asignaturaId === asignaturaSeleccionada);
        let numImpartidas = historialAsig.filter(h => h.estado === 'IMPARTIDA').length;
        let actual = secuenciaAsig[numImpartidas];
        if (!actual) return alert("No hi ha sessions pendents.");

        let nouText = prompt("Modifica la lliçó d'avui:", actual.contenido);
        if (nouText !== null && nouText.trim() !== "") {
            actual.contenido = nouText;
            saveAll();
            recalcularYRenderizar();
        }
    });

    document.getElementById('btn-exportar').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ asignaturas, historial, secuencias }));
        const dl = document.createElement('a'); dl.href = dataStr; dl.download = "planificador_data.json"; dl.click();
    });

    document.getElementById('btn-importar').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (parsed.asignaturas) asignaturas = parsed.asignaturas;
                if (parsed.historial) historial = parsed.historial;
                if (parsed.secuencias) secuencias = parsed.secuencias;
                asignaturaSeleccionada = asignaturas.length > 0 ? asignaturas[0].id : "";
                saveAll();
                actualizarSelectorTrabajo();
                marcarChecksDias();
                recalcularYRenderizar();
            } catch(e) { alert("Format incorrecte."); }
        };
        reader.readAsText(file);
    });

    marcarChecksDias();
}

function registrarDia(estado) {
    if (!asignaturaSeleccionada) return;
    const fStr = new Date().toISOString().split('T')[0];
    historial = historial.filter(h => !(h.fechaReal === fStr && h.asignaturaId === asignaturaSeleccionada));
    historial.push({ fechaReal: fStr, asignaturaId: asignaturaSeleccionada, estado: estado });
    saveAll();
    recalcularYRenderizar();
}

window.editarFilaFutura = function(idSec) {
    let item = secuencias.find(s => s.id === idSec);
    if (!item) return;
    let nou = prompt("Modifica aquesta sessió futura:", item.contenido);
    if (nou !== null && nou.trim() !== "") {
        item.contenido = nou;
        saveAll();
        recalcularYRenderizar();
    }
};

function saveAll() {
    writeLocalStorage('asig', asignaturas);
    writeLocalStorage('hist', historial);
    writeLocalStorage('sec', secuencias);
}

function recalcularYRenderizar() {
    const hoyStr = new Date().toISOString().split('T')[0];
    document.getElementById('txt-fecha-hoy').innerText = new Date().toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    if (!asignaturaSeleccionada) {
        document.getElementById('txt-asignatura-hoy').innerText = "Sense matèries actives";
        document.getElementById('txt-num-sesion').innerText = "Sessió --";
        document.getElementById('txt-contenido-sesion').innerText = "Configureu una matèria a dalt.";
        document.getElementById('grid-proyeccion').innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Sense projecció.</div>';
        document.getElementById('table-resumen-body').innerHTML = "";
        return;
    }

    const asigActual = asignaturas.find(a => a.id === asignaturaSeleccionada);
    document.getElementById('txt-asignatura-hoy').innerText = asigActual ? asigActual.nombre : "-";

    const secuenciaAsig = secuencias.filter(s => s.curso === asignaturaSeleccionada).sort((a,b) => a.orden - b.orden);
    const historialAsig = historial.filter(h => h.asignaturaId === asignaturaSeleccionada);

    let htmlProyeccion = ""; let htmlResumen = ""; let idxSec = 0; let fLoop = new Date(); let totalClases = 0;

    historial.forEach(h => {
        const asig = asignaturas.find(a => a.id === h.asignaturaId);
        htmlResumen += '<tr class="border-b border-slate-100">' +
            '<td class="p-3 font-semibold">' + h.fechaReal + '</td>' +
            '<td class="p-3">' + (asig ? asig.nombre : 'Matèria') + '</td>' +
            '<td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ' + (h.estado.includes('VAGA') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800') + '">' + h.estado + '</span></td>' +
            '<td class="p-3">' + (h.estado.includes('VAGA') ? 'Classe desplaçada en cascada' : 'Sessió lectiva completada') + '</td>' +
        '</tr>';
    });
    document.getElementById('table-resumen-body').innerHTML = htmlResumen || '<tr><td colspan="4" class="p-3 text-center text-slate-400">Cap registre guardat encara.</td></tr>';

    while (totalClases < 12) {
        const wDay = fLoop.getDay();
        const fIso = fLoop.toISOString().split('T')[0];

        if (asigActual.diasLectivos.includes(wDay)) {
            const histRecord = historialAsig.find(h => h.fechaReal === fIso);
            let curSec = secuenciaAsig[idxSec];
            let labelS = curSec ? "S." + curSec.orden : "Fi";
            let txtConten = curSec ? curSec.contenido : "Bloc acadèmic completat.";
            let styleBox = "bg-white border-slate-200 text-slate-600";
            let btnEdit = curSec ? '<button onclick="editarFilaFutura('' + curSec.id + '')" class="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-slate-500 ml-2">✏️</button>' : '';

            if (histRecord) {
                if (histRecord.estado.includes('VAGA')) {
                    labelS = "⚠️ MOVED";
                    txtConten = "Incidència de calendari (Vaga / Festiu / Baixa). El temari sencer es mou en cascada.";
                    styleBox = "bg-rose-50/50 border-rose-200 text-rose-900/60 line-through";
                    btnEdit = "";
                } else {
                    styleBox = "bg-emerald-50/40 border-emerald-200 text-slate-700 font-medium";
                    if (curSec) idxSec++;
                }
            } else {
                if (curSec) idxSec++;
            }

            if (fIso === hoyStr) {
                const sHoy = secuenciaAsig[idxSec - 1] || { orden: "--", contenido: "Cap lliçó pendent." };
                document.getElementById('txt-num-sesion').innerText = "Sessió " + sHoy.orden;
                document.getElementById('txt-contenido-sesion').innerText = sHoy.contenido;
            }

            let dayLabel = fLoop.toLocaleDateString('ca-ES', { weekday: 'short' }).toUpperCase();
            let dateLabel = fLoop.toLocaleDateString('ca-ES', { month: 'short', day: 'numeric' }).toUpperCase();

            htmlProyeccion += '<div class="p-3 border rounded-xl flex justify-between items-center ' + styleBox + '">' +
                '<div class="flex-1">' +
                    '<span class="text-[10px] font-bold block uppercase text-slate-400">' + dayLabel + '., ' + dateLabel + '</span>' +
                    '<p class="text-xs mt-0.5">' + txtConten + '</p>' +
                '</div>' +
                '<div class="flex items-center gap-1">' +
                    '<span class="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 whitespace-nowrap">' + labelS + '</span>' +
                    btnEdit +
                '</div>' +
            '</div>';
            totalClases++;
        }
        fLoop.setDate(fLoop.getDate() + 1);
    }
    document.getElementById('grid-proyeccion').innerHTML = htmlProyeccion;
}
