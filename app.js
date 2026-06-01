let asignaturas = [];
let historial = [];
let secuencias = [];
let asignaturaSeleccionada = "";

const ASIGNATURAS_DEFAULT = [
    { id: "MAT1", nombre: "Matemáticas 1º ESO", diasLectivos: [1, 3] },
    { id: "HIS2", nombre: "Historia 2º Bachillerato", diasLectivos: [2, 4] }
];

const SECUENCIAS_DEFAULT = [
    { id: "S1", curso: "MAT1", orden: 1, contenido: "Presentación del curso y criterios de evaluación." },
    { id: "S2", curso: "MAT1", orden: 2, contenido: "Números enteros: Concepto y valor absoluto." },
    { id: "S3", curso: "MAT1", orden: 3, contenido: "Operaciones elementales de suma y resta con enteros." },
    { id: "S4", curso: "MAT1", orden: 4, contenido: "Multiplicación y propiedades distributivas básicas." },
    { id: "S5", curso: "MAT1", orden: 5, contenido: "Introducción a las fracciones y mínimos comunes." },
    { id: "S6", curso: "HIS2", orden: 1, contenido: "Crisis del Antiguo Régimen y Revolución Liberal." },
    { id: "S7", curso: "HIS2", orden: 2, contenido: "Las Cortes de Cádiz y la Constitución de 1812." }
];

window.addEventListener('DOMContentLoaded', async () => {
    try {
        asignaturas = await obtenerTodos('asignaturas');
        if (asignaturas.length === 0) {
            for (let a of ASIGNATURAS_DEFAULT) await guardarDato('asignaturas', a);
            asignaturas = ASIGNATURAS_DEFAULT;
        }

        secuencias = await obtenerTodos('secuencias');
        if (secuencias.length === 0) {
            for (let s of SECUENCIAS_DEFAULT) await guardarDato('secuencias', s);
            secuencias = SECUENCIAS_DEFAULT;
        }

        historial = await obtenerTodos('historial');
        asignaturaSeleccionada = asignaturas[0].id;
        
        initUI();
        recalcularYRenderizar();
    } catch (e) {
        console.error("Error inicializando la app:", e);
    }
});

function initUI() {
    const select = document.getElementById('select-asignatura');
    select.innerHTML = asignaturas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
    
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
    document.getElementById('btn-incidencia').addEventListener('click', () => registrarDiaClase('INCIDENCIA/HUELGA'));
    
    document.getElementById('btn-exportar').addEventListener('click', exportarDatos);
    document.getElementById('btn-importar').addEventListener('change', importarDatos);
    document.getElementById('btn-print').addEventListener('click', () => window.print());
}

function marcarChecksDias() {
    const asig = asignaturas.find(a => a.id === asignaturaSeleccionada);
    document.querySelectorAll('.chk-dia').forEach(chk => {
        chk.checked = asig.diasLectivos.includes(parseInt(chk.value));
    });
}

function getFechaHoyFormateada() {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
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
    document.getElementById('txt-fecha-hoy').innerText = `Hoy es: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    const asigActual = asignaturas.find(a => a.id === asignaturaSeleccionada);
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
            <tr class="${h.estado.includes('HUELGA') ? 'bg-red-50' : 'bg-green-50'}">
                <td class="p-3 font-semibold">${h.fechaReal}</td>
                <td class="p-3">${asig ? asig.nombre : 'S/N'}</td>
                <td class="p-3 font-mono">${h.estado.includes('HUELGA') ? 'N/A' : 'Ejecutada'}</td>
                <td class="p-3 font-medium">${h.estado}</td>
            </tr>
        `;
    });
    document.getElementById('table-resumen-body').innerHTML = htmlResumen || `<tr><td colspan="4" class="p-4 text-center text-gray-400">No hay registros guardados en el año académico.</td></tr>`;

    while (clasesCalculadas < 20) {
        const diaSemana = fechaBucle.getDay();
        const fechaIso = fechaBucle.toISOString().split('T')[0];

        if (asigActual.diasLectivos.includes(diaSemana)) {
            const recordHistorial = historialAsig.find(h => h.fechaReal === fechaIso);
            let estadoTexto = "";
            let contenidoClase = "";
            let cssEstilo = "bg-white border-gray-200";

            if (recordHistorial) {
                if (recordHistorial.estado === 'INCIDENCIA/HUELGA') {
                    estadoTexto = "⚠️ CLASE CANCELADA (Desplazada)";
                    contenidoClase = "Incidencia registrada. La secuencia se movió al siguiente día lectivo.";
                    cssEstilo = "bg-red-50 border-red-200 text-red-900 line-through opacity-75";
                } else {
                    const sesion = secuenciaAsig[indiceSecuenciaActual];
                    estadoTexto = `✅ Sesión ${sesion ? sesion.orden : '(Finalizado)'}`;
                    contenidoClase = sesion ? sesion.contenido : 'Temario finalizado completamente.';
                    cssEstilo = "bg-green-50 border-green-200 text-green-900";
                    if (sesion) indiceSecuenciaActual++;
                }
            } else {
                const sesion = secuenciaAsig[indiceSecuenciaActual];
                estadoTexto = `🔮 Proyección: Sesión ${sesion ? sesion.orden : '(Fin)'}`;
                contenidoClase = sesion ? sesion.contenido : 'Fin de la secuenciación.';
                cssEstilo = "bg-white border-blue-200 border-l-4";
                if (sesion) indiceSecuenciaActual++;
            }

            if (fechaIso === hoyStr) {
                document.getElementById('txt-asignatura-hoy').innerText = asigActual.nombre;
                const sesionHoy = secuenciaAsig[indiceSecuenciaActual - (recordHistorial?.estado === 'INCIDENCIA/HUELGA' ? 0 : 1)];
                document.getElementById('txt-num-sesion').innerText = sesionHoy ? `Sesión ${sesionHoy.orden}` : 'Finalizado';
                document.getElementById('txt-contenido-sesion').innerText = sesionHoy ? sesionHoy.contenido : 'No hay más sesiones planificadas.';
            }

            const opcionesFecha = { weekday: 'short', month: 'short', day: 'numeric' };
            htmlProyeccion += `
                <div class="p-3 border rounded-lg flex justify-between items-center shadow-xs ${cssEstilo}">
                    <div class="flex-1">
                        <span class="text-xs font-bold block uppercase">${fechaBucle.toLocaleDateString('es-ES', opcionesFecha)}</span>
                        <p class="text-sm font-medium mt-0.5">${contenidoClase}</p>
                    </div>
                    <span class="text-xs font-black px-2 py-1 rounded bg-black/5">${estadoTexto}</span>
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
    downloadAnchor.setAttribute("download", `Plan_Docente_Curso_${new Date().getFullYear()}.json`);
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
                alert("🟢 Datos importados con éxito.");
                window.location.reload();
            }
        } catch (err) {
            alert("❌ Archivo JSON no válido.");
        }
    };
    reader.readAsText(e.target.files[0]);
}