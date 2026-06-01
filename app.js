const MATERIES_LOMLOE = {
    "1ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques", "Geografia i Història", "Biologia i Geologia", "Educació Física", "Visual i Plàstica"],
    "2ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques", "Geografia i Història", "Física i Química", "Educació Física", "Música", "Tecnologia i Digitalització"],
    "3ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques", "Geografia i Història", "Biologia i Geologia", "Física i Química", "Educació Física", "Educació en Valors Cívics"],
    "4ESO": ["Llengua Catalana i Literatura", "Llengua Castellana i Literatura", "Anglès", "Matemàtiques (A/B)", "Geografia i Història", "Educació Física", "Llatí", "Biologia i Geologia", "Física i Química", "Economia i Emprenedoria", "Tecnologia", "Filosofia"],
    "1BAT": ["Llengua Catalana i Literatura I", "Llengua Castellana i Literatura I", "Anglès I", "Filosofia", "Educació Física", "Matemàtiques I", "Llatí I", "Matemàtiques Aplicades a les CCSS I", "Història del Món Contemporani", "Dibuix Tècnic I", "Química I", "Biologia I"],
    "2BAT": ["Llengua Catalana i Literatura II", "Llengua Castellana i Literatura II", "Anglès II", "Història d'Espanya", "Història de la Filosofia", "Matemàtiques II", "Llatí II", "Matemàtiques Aplicades a les CCSS II", "Geografia", "Física II", "Química II", "Biologia II", "Història de l'Art"]
};

let asignaturas = [];
let historial = [];
let secuencias = [];
let asignaturaSeleccionada = "";

window.addEventListener('DOMContentLoaded', async () => {
    try {
        asignaturas = await obtenerTodos('asignaturas');
        secuencias = await obtenerTodos('secuencias');
        historial = await obtenerTodos('historial');

        if (asignaturas.length === 0) {
            const defaultAsig = { id: "1ESO-Matemàtiques-A", nombre: "1r d'ESO - Matemàtiques (Grup A)", diasLectivos: [1, 3] };
            await guardarDato('asignaturas', defaultAsig);
            asignaturas.push(defaultAsig);

            const defaultSecuencias = [
                { id: "SEC1", curso: "1ESO-Matemàtiques-A", orden: 1, contenido: "Unitat 1: Nombres enters i operacions combinades curriculars." },
                { id: "SEC2", curso: "1ESO-Matemàtiques-A", orden: 2, contenido: "Unitat 1: Resolució de problemes reals i competencials." },
                { id: "SEC3", curso: "1ESO-Matemàtiques-A", orden: 3, contenido: "Unitat 2: Introducció a les fraccions de la vida diària." },
                { id: "SEC4", curso: "1ESO-Matemàtiques-A", orden: 4, contenido: "Unitat 2: Operacions complexes i sumes de fraccions." }
            ];
            for (let s of defaultSecuencias) {
                await guardarDato('secuencias', s);
                secuencias.push(s);
            }
        }

        asignaturaSeleccionada = asignaturas[0].id;
        
        initLOMLOEDropdowns();
        initUI();
        recalcularYRenderizar();
    } catch (e) {
        console.error("Error en inicialitzar l'aplicació:", e);
    }
});

function initLOMLOEDropdowns() {
    const etapaSelect = document.getElementById('reg-etapa');
    const materiaSelect = document.getElementById('reg-materia');

    function actualizarMaterias() {
        const etapa = etapaSelect.value;
        const llista = MATERIES_LOMLOE[etapa] || [];
        materiaSelect.innerHTML = llista.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    etapaSelect.addEventListener('change', actualizarMaterias);
    actualizarMaterias();

    document.getElementById('btn-afegir-materia').addEventListener('click', async () => {
        const etapaTxt = etapaSelect.options[etapaSelect.selectedIndex].text;
        const materia = materiaSelect.value;
        const grup = document.getElementById('reg-grup').value;
        
        const idGenerat = `${etapaSelect.value}-${materia.replace(/\s+/g, '')}-${grup}`;
        const nomComplet = `${etapaTxt} - ${materia} (Grup ${grup})`;

        if (asignaturas.some(a => a.id === idGenerat)) {
            alert("⚠️ Aquesta matèria i grup ja estan registrats.");
            return;
        }

        const novaAsig = { id: idGenerat, nombre: nomComplet, diasLectivos: [1, 3] };
        await guardarDato('asignaturas', novaAsig);
        asignaturas.push(novaAsig);

        for (let i = 1; i <= 15; i++) {
            const nuevaSesion = {
                id: `SEC-${idGenerat}-${i}`,
                curso: idGenerat,
                orden: i,
                contenido: `Programació LOMLOE: Contingut didàctic i pràctic per a la sessió número ${i}.`
            };
            await guardarDato('secuencias', nuevaSesion);
            secuencias.push(nuevaSesion);
        }

        asignaturaSeleccionada = idGenerat;
        actualizarSelectorTrabajo();
        marcarChecksDias();
        recalcularYRenderizar();
        alert(`🟢 S'ha donat d'alta correctament: ${nomComplet}`);
    });
}

function actualizarSelectorTrabajo() {
    const select = document.getElementById('select-asignatura');
    select.innerHTML = asignaturas.map(a => `<option value="${a.id}" ${a.id === asignaturaSeleccionada ? 'selected' : ''}>${a.nombre}</option>`).join('');
}

function initUI() {
    actualizarSelectorTrabajo();
    const select = document.getElementById('select-asignatura');
    
    select.addEventListener('change', (e) => {
        asignaturaSeleccionada = e.target.value;
        marcarChecksDias();
        recalcularYRenderizar();
    });

    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.addEventListener('change', async () => {
            const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
            const checks = Array.from(document.querySelectorAll('.chk-dia:checked')).map(c => parseInt(c.value));
            asig.diasLectivos = checks;
            await guardarDato('asignaturas', asig);
            recalcularYRenderizar();
        });
    });

    marcarChecksDias();

    document.getElementById('btn-completar').addEventListener('click', () => registrarDiaClase('IMPARTIDA'));
    document.getElementById('btn-incidencia').addEventListener('click', () => registrarDiaClase('VAGA / INCIDÈNCIA (Retardada)'));
    
    document.getElementById('btn-exportar').addEventListener('click', exportarDatos);
    document.getElementById('btn-importar').addEventListener('change', importarDatos);
    document.getElementById('btn-print').addEventListener('click', () => window.print());
}

function marcarChecksDias() {
    const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
    if (!asig) return;
    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.checked = asig.diasLectivos.includes(parseInt(chk.value));
    });
}

function getFechaHoyFormateada() {
    return new Date().toISOString().split('T')[0];
}

async function registrarDiaClase(estado) {
    const fecha = getFechaHoyFormateada();
    const registro = {
        fechaReal: fecha,
        asignaturaId: asignaturaSeleccionada,
        estado: estado
    };
    await guardarDato('historial', registro);
    historial = await obtenerTodos('historial');
    recalcularYRenderizar();
}

function recalcularYRenderizar() {
    const hoyStr = getFechaHoyFormateada();
    document.getElementById('txt-fecha-hoy').innerText = new Date().toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    const asigActual = asignaturas.find(a => a.id === asignaturaSeleccionada);
    if (!asigActual) return;

    const secuenciaAsig = secuencias.filter(s => s.curso === asignaturaSeleccionada).sort((a,b) => a.orden - b.orden);
    const historialAsig = historial.filter(h => h.asignaturaId === asignaturaSeleccionada);

    let htmlProyeccion = "";
    let htmlResumen = "";
    let indiceSecuenciaActual = 0;
    let fechaBucle = new Date();
    let clasesCalculadas = 0;

    historial.forEach(h => {
        const asig = asignaturas.find(a => a.id === h.asignaturaId);
        htmlResumen += `
            <tr class="${h.estado.includes('VAGA') ? 'bg-rose-50/40 text-rose-900' : 'bg-emerald-50/40 text-emerald-900'}">
                <td class="p-3 font-semibold">${h.fechaReal}</td>
                <td class="p-3">${asig ? asig.nombre : 'Matèria'}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${h.estado.includes('VAGA') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">${h.estado.includes('VAGA') ? 'Desplaçat' : 'Correcte'}</span></td>
                <td class="p-3 font-medium">${h.estado}</td>
            </tr>
        `;
    });
    document.getElementById('table-resumen-body').innerHTML = htmlResumen || `<tr><td colspan="4" class="p-4 text-center text-slate-400">Cap registre validat per a aquest curs acadèmic.</td></tr>`;

    while (clasesCalculadas < 20) {
        const diaSemana = fechaBucle.getDay();
        const fechaIso = fechaBucle.toISOString().split('T')[0];

        if (asigActual.diasLectivos.includes(diaSemana)) {
            const recordHistorial = historialAsig.find(h => h.fechaReal === fechaIso);
            let estadoTexto = "";
            let contenidoClase = "";
            let cssEstilo = "bg-white border-slate-200";

            if (recordHistorial) {
                if (recordHistorial.estado.includes('VAGA')) {
                    estadoTexto = "⚠️ AJORNADA";
                    contenidoClase = "Vaga o incidència detectada al centre. El temari passa automàticament al següent dia.";
                    cssEstilo = "bg-rose-50/50 border-rose-200 text-rose-900/80 opacity-75";
                } else {
                    const sesion = secuenciaAsig[indiceSecuenciaActual];
                    estadoTexto = `✓ S.${sesion ? sesion.orden : 'Fi'}`;
                    contenidoClase = sesion ? sesion.contenido : 'Temari d'aprenentatge tancat.';
                    cssEstilo = "bg-emerald-50/50 border-emerald-200 text-slate-700";
                    if (sesion) indiceSecuenciaActual++;
                }
            } else {
                const sesion = secuenciaAsig[indiceSecuenciaActual];
                estadoTexto = `S.${sesion ? sesion.orden : 'Fi'}`;
                contenidoClase = sesion ? sesion.contenido : 'Bloc completat.';
                cssEstilo = "bg-white border-slate-200 text-slate-600";
                if (sesion) indiceSecuenciaActual++;
            }

            if (fechaIso === hoyStr) {
                document.getElementById('txt-asignatura-hoy').innerText = asigActual.nombre;
                const sesionHoy = secuenciaAsig[indiceSecuenciaActual - (recordHistorial?.estado.includes('VAGA') ? 0 : 1)];
                document.getElementById('txt-num-sesion').innerText = sesionHoy ? `Sessió ${sesionHoy.orden}` : 'Finalitzat';
                document.getElementById('txt-contenido-sesion').innerText = sesionHoy ? sesionHoy.contenido : 'No queden més unitats programades per avui.';
            }

            const opcionesFecha = { weekday: 'short', month: 'short', day: 'numeric' };
            htmlProyeccion += `
                <div class="p-3.5 border rounded-xl flex justify-between items-center transition ${cssEstilo}">
                    <div>
                        <span class="text-[10px] font-bold block uppercase text-slate-400">${fechaBucle.toLocaleDateString('ca-ES', opcionesFecha)}</span>
                        <p class="text-xs font-medium mt-0.5">${contenidoClase}</p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 whitespace-nowrap ml-4">${estadoTexto}</span>
                </div>
            `;
            clasesCalculadas++;
        }
        fechaBucle.setDate(fechaBucle.getDate() + 1);
    }
    document.getElementById('grid-proyeccion').innerHTML = htmlProyeccion;
}

function exportarDatos() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ asignaturas, historial, secuencias }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Planificador_LOMLOE_v3_${new Date().getFullYear()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importarDatos(e) {
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.asignaturas && data.secuencias) {
                await vaciarStore('asignaturas');
                await vaciarStore('secuencias');
                await vaciarStore('historial');

                for (let a of data.asignaturas) await guardarDato('asignaturas', a);
                for (let s of data.secuencias) await guardarDato('secuencias', s);
                if (data.historial) {
                    for (let h of data.historial) await guardarDato('historial', h);
                }
                alert("🟢 Dades importades correctament.");
                window.location.reload();
            }
        } catch (err) {
            alert("❌ Estructura JSON incorrecta.");
        }
    };
    reader.readAsText(e.target.files[0]);
}