// Lògica de control unificada i robusta per a GitHub Pages
let asignaturas = JSON.parse(localStorage.getItem('asig')) || [
    { id: "4ESO-Tecnologia-A", nombre: "4t d'ESO - Tecnologia (Grup A)", diasLectivos: [1, 2, 3] },
    { id: "1ESO-Matemàtiques-A", nombre: "1r d'ESO - Matemàtiques (Grup A)", diasLectivos: [1, 3] }
];
let historial = JSON.parse(localStorage.getItem('hist')) || [];
let secuencias = JSON.parse(localStorage.getItem('sec')) || [];

// Inicialitzar contingut si està completament net
if (secuencias.length === 0) {
    asignaturas.forEach(a => {
        for (let i = 1; i <= 15; i++) {
            secuencias.push({ id: "SEC-" + a.id + "-" + i, curso: a.id, orden: i, contenido: "Tema de treball planificat: Sessió número " + i + " de la programació curricular." });
        }
    });
}

let asignaturaSeleccionada = asignaturas[0] ? asignaturas[0].id : "";

window.addEventListener('DOMContentLoaded', () => {
    initLOMLOEDropdowns();
    initUI();
    recalcularYRenderizar();
});

function guardar() {
    localStorage.setItem('asig', JSON.stringify(asignaturas));
    localStorage.setItem('hist', JSON.stringify(historial));
    localStorage.setItem('sec', JSON.stringify(secuencias));
}

function initLOMLOEDropdowns() {
    const etapaSelect = document.getElementById('reg-etapa');
    const materiaSelect = document.getElementById('reg-materia');
    if (!etapaSelect || !materiaSelect) return;

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

        if (asignaturas.some(a => a.id === idGenerat)) return alert("⚠️ Aquesta matèria ja està registrada.");

        asignaturas.push({ id: idGenerat, nombre: nomComplet, diasLectivos: [1, 2, 3] });

        for (let i = 1; i <= 15; i++) {
            secuencias.push({ id: "SEC-" + idGenerat + "-" + i, curso: idGenerat, orden: i, contenido: "Programació de contingut: Sessió " + i });
        }

        asignaturaSeleccionada = idGenerat;
        guardar();
        actualizarSelectorTrabajo();
        marcarChecksDias();
        recalcularYRenderizar();
    });
}

function actualizarSelectorTrabajo() {
    const sel = document.getElementById('select-asignatura');
    if (!sel) return;
    sel.innerHTML = asignaturas.map(a => '<option value="' + a.id + '" ' + (a.id === asignaturaSeleccionada ? 'selected' : '') + '>' + a.nombre + '</option>').join('');
    if (asignaturas.length === 0) sel.innerHTML = '<option value="">Sense matèries actives</option>';
}

function initUI() {
    actualizarSelectorTrabajo();
    const selAsig = document.getElementById('select-asignatura');
    if(selAsig) {
        selAsig.addEventListener('change', (e) => {
            asignaturaSeleccionada = e.target.value;
            marcarChecksDias();
            recalcularYRenderizar();
        });
    }

    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.addEventListener('change', () => {
            const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
            if (!asig) return;
            asig.diasLectivos = Array.from(document.querySelectorAll('.chk-dia:checked')).map(c => parseInt(c.value));
            guardar();
            recalcularYRenderizar();
        });
    });

    document.getElementById('btn-completar').addEventListener('click', () => registrarDiaClase('IMPARTIDA'));
    document.getElementById('btn-incidencia').addEventListener('click', () => registrarDiaClase('VAGA / FESTIU'));
    document.getElementById('btn-print').addEventListener('click', () => window.print());
    
    document.getElementById('btn-eliminar-materia').addEventListener('click', () => {
        if (!asignaturaSeleccionada) return alert("No hi ha matèria.");
        if (confirm("Vols eliminar completament aquesta matèria activa?")) {
            asignaturas = asignaturas.filter(a => a.id !== asignaturaSeleccionada);
            secuencias = secuencias.filter(s => s.curso !== asignaturaSeleccionada);
            historial = historial.filter(h => h.asignaturaId !== asignaturaSeleccionada);
            asignaturaSeleccionada = asignaturas.length > 0 ? asignaturas[0].id : "";
            guardar();
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
        if (!actual) return alert("Fi de la planificació.");

        let nouText = prompt("Edita el text de la lliçó actual:", actual.contenido);
        if (nouText !== null && nouText.trim() !== "") {
            actual.contenido = nouText;
            guardar();
            recalcularYRenderizar();
        }
    });
    
    document.getElementById('btn-exportar').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ asignaturas, historial, secuencias }));
        const dl = document.createElement('a'); dl.href = dataStr; dl.download = "planificador.json"; dl.click();
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
                guardar();
                actualizarSelectorTrabajo();
                marcarChecksDias();
                recalcularYRenderizar();
            } catch(err) { alert("Error de fitxer."); }
        };
        reader.readAsText(file);
    });
    
    marcarChecksDias();
}

function marcarChecksDias() {
    const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.checked = asig ? asig.diasLectivos.includes(parseInt(chk.value)) : false;
    });
}

function registrarDiaClase(estado) {
    if (!asignaturaSeleccionada) return;
    const fecha = new Date().toISOString().split('T')[0];
    historial = historial.filter(h => !(h.fechaReal === fecha && h.asignaturaId === asignaturaSeleccionada));
    historial.push({ fechaReal: fecha, asignaturaId: asignaturaSeleccionada, estado: estado });
    guardar();
    recalcularYRenderizar();
}

window.editarFilaFutura = function(idSecuencia) {
    let item = secuencias.find(s => s.id === idSecuencia);
    if (!item) return;
    let nouText = prompt("Edita la sessió futura:", item.contenido);
    if (nouText !== null && nouText.trim() !== "") {
        item.contenido = nouText;
        guardar();
        recalcularYRenderizar();
    }
};

function recalcularYRenderizar() {
    const hoyStr = new Date().toISOString().split('T')[0];
    const fHoyElem = document.getElementById('txt-fecha-hoy');
    if(fHoyElem) fHoyElem.innerText = new Date().toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    if (!asignaturaSeleccionada) {
        document.getElementById('txt-asignatura-hoy').innerText = "Sense matèries actives";
        document.getElementById('txt-num-sesion').innerText = "Sessió --";
        document.getElementById('txt-contenido-sesion').innerText = "Crea una matèria a la configuració superior.";
        document.getElementById('grid-proyeccion').innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">No hi ha contingut projectat.</div>';
        document.getElementById('table-resumen-body').innerHTML = "";
        return;
    }

    const asigActual = asignaturas.find(a => a.id === asignaturaSeleccionada);
    if (!asigActual) return;

    document.getElementById('txt-asignatura-hoy').innerText = asigActual.nombre;

    const secuenciaAsig = secuencias.filter(s => s.curso === asignaturaSeleccionada).sort((a,b) => a.orden - b.orden);
    const historialAsig = historial.filter(h => h.asignaturaId === asignaturaSeleccionada);

    let htmlProyeccion = ""; let htmlResumen = ""; let indiceSecuenciaActual = 0; let fechaBucle = new Date(); let clasesCalculadas = 0;

    historial.forEach(h => {
        const asig = asignaturas.find(a => a.id === h.asignaturaId);
        htmlResumen += '<tr class="border-b border-slate-100">' +
            '<td class="p-3 font-semibold">' + h.fechaReal + '</td>' +
            '<td class="p-3">' + (asig ? asig.nombre : 'Matèria') + '</td>' +
            '<td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ' + (h.estado.includes('VAGA') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800') + '">' + h.estado + '</span></td>' +
            '<td class="p-3">' + (h.estado.includes('VAGA') ? 'Classe desplaçada en cascada' : 'Sessió lectiva completada') + '</td>' +
        '</tr>';
    });
    document.getElementById('table-resumen-body').innerHTML = htmlResumen || '<tr><td colspan="4" class="p-4 text-center text-slate-400">Cap registre validat encara.</td></tr>';

    while (clasesCalculadas < 15) {
        const diaSemana = fechaBucle.getDay();
        const fechaIso = fechaBucle.toISOString().split('T')[0];

        if (asigActual.diasLectivos.includes(diaSemana)) {
            const recordHistorial = historialAsig.find(h => h.fechaReal === fechaIso);
            let actualSec = secuenciaAsig[indiceSecuenciaActual];
            let estadoTexto = actualSec ? "S." + actualSec.orden : "Fi";
            let contenidoClase = actualSec ? actualSec.contenido : "Mòdul finalitzat.";
            let cssEstilo = "bg-white border-slate-200 text-slate-600";
            let botonEditarFila = actualSec ? '<button onclick="editarFilaFutura('' + actualSec.id + '')" class="text-[10px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md text-slate-500 ml-2 cursor-pointer">✏️</button>' : '';

            if (recordHistorial) {
                if (recordHistorial.estado.includes('VAGA')) {
                    estadoTexto = "⚠️ DESPLAÇAT";
                    contenidoClase = "Incidència de calendari (Vaga/Festiu). El temari sencer es mou en cascada.";
                    cssEstilo = "bg-rose-50/50 border-rose-200 text-rose-900/60 line-through";
                    botonEditarFila = "";
                } else {
                    cssEstilo = "bg-emerald-50/40 border-emerald-200 text-slate-700 font-medium";
                    if (actualSec) indiceSecuenciaActual++;
                }
            } else {
                if (actualSec) indiceSecuenciaActual++;
            }

            if (fechaIso === hoyStr) {
                const sHoy = secuenciaAsig[indiceSecuenciaActual - 1] || { orden: "--", contenido: "Cap lliçó pendent." };
                document.getElementById('txt-num-sesion').innerText = "Sessió " + sHoy.orden;
                document.getElementById('txt-contenido-sesion').innerText = sHoy.contenido;
            }

            htmlProyeccion += '<div class="p-3 border rounded-xl flex justify-between items-center ' + cssEstilo + '">' +
                '<div class="flex-1">' +
                    '<span class="text-[10px] font-bold block uppercase text-slate-400">' + fechaBucle.toLocaleDateString('ca-ES', { weekday: 'short', month: 'short', day: 'numeric' }) + '</span>' +
                    '<p class="text-xs mt-0.5">' + contenidoClase + '</p>' +
                '</div>' +
                '<div class="flex items-center gap-1">' +
                    '<span class="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 whitespace-nowrap">' + estadoTexto + '</span>' +
                    botonEditarFila +
                '</div>' +
            '</div>';
            clasesCalculadas++;
        }
        fechaBucle.setDate(fechaBucle.getDate() + 1);
    }
    document.getElementById('grid-proyeccion').innerHTML = htmlProyeccion;
}
