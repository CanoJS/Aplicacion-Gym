/* ═══════════════════════════════════════════════════════════════
   GYMTRACKER v3.0 — Historial de sesiones + Recomendaciones
   basadas en progresión real a lo largo del tiempo.

   ARQUITECTURA DE DATOS EN localStorage:
   ───────────────────────────────────────────────────────────────
   gymtracker_sesion_HOY_{dia}_{exId}
     → Sesión activa del día de hoy (borrable con Reset Día)
     → { series: [{checked, peso, reps}] }

   gymtracker_historial_{exId}
     → Array de sesiones pasadas del ejercicio (máx. 20)
     → [{ fecha, dia, series: [{peso,reps}], rm1Max, volumen }]

   LÓGICA DE RECOMENDACIONES (por orden de prioridad):
   ───────────────────────────────────────────────────────────────
   1. Si hay historial → usa el mejor 1RM histórico como base.
   2. Detecta tendencia: ¿el 1RM sube, baja o se estanca?
   3. Aplica progresión: si llevas 2+ sesiones en rango máximo
      del objetivo, sugiere subir 2.5 kg.
   4. Si no hay historial → usa la serie actual (como v2.0).
═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   1. RUTINA
────────────────────────────────────────── */
const RUTINA = {
  lunes: {
    titulo: "PECHO + HOMBROS + TRÍCEPS",
    ejercicios: [
      { id: "lun_1", nombre: "Press inclinado con barra",     series: 3, reps: "6–8 reps",   repsMin: 6,  repsMax: 8  },
      { id: "lun_2", nombre: "Press plano con mancuernas",    series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "lun_3", nombre: "Aperturas inclinadas",          series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
      { id: "lun_4", nombre: "Elevaciones laterales",         series: 4, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
      { id: "lun_5", nombre: "Fondos para pecho",             series: 3, reps: "8–12 reps",  repsMin: 8,  repsMax: 12 },
      { id: "lun_6", nombre: "Extensión de tríceps en polea", series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
    ]
  },
  martes: {
    titulo: "ESPALDA + BÍCEPS",
    ejercicios: [
      { id: "mar_1", nombre: "Dominadas / Jalón al pecho",    series: 4, reps: "6–10 reps",  repsMin: 6,  repsMax: 10 },
      { id: "mar_2", nombre: "Remo con barra",                series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "mar_3", nombre: "Jalón unilateral en polea",     series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
      { id: "mar_4", nombre: "Remo en máquina",               series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
      { id: "mar_5", nombre: "Curl con barra",                series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "mar_6", nombre: "Curl inclinado",                series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
    ]
  },
  miercoles: {
    titulo: "PIERNAS",
    ejercicios: [
      { id: "mie_1", nombre: "Sentadilla",              series: 4, reps: "5–8 reps",   repsMin: 5,  repsMax: 8  },
      { id: "mie_2", nombre: "Prensa",                  series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "mie_3", nombre: "Curl femoral",            series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
      { id: "mie_4", nombre: "Extensión de cuádriceps", series: 3, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
      { id: "mie_5", nombre: "Pantorrillas",            series: 4, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
    ]
  },
  viernes: {
    titulo: "UPPER BODY",
    ejercicios: [
      { id: "vie_1", nombre: "Press militar",            series: 3, reps: "6–8 reps",   repsMin: 6,  repsMax: 8  },
      { id: "vie_2", nombre: "Dominadas / Jalón",        series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "vie_3", nombre: "Remo pecho apoyado",       series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "vie_4", nombre: "Elevaciones laterales",    series: 4, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
      { id: "vie_5", nombre: "Face pulls",               series: 3, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
      { id: "vie_6", nombre: "Curl bíceps",              series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "vie_7", nombre: "Tríceps polea",            series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
    ]
  },
  sabado: {
    titulo: "PIERNAS",
    ejercicios: [
      { id: "sab_1", nombre: "Hack squat",              series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "sab_2", nombre: "Peso muerto rumano",      series: 3, reps: "8–10 reps",  repsMin: 8,  repsMax: 10 },
      { id: "sab_3", nombre: "Curl femoral",            series: 3, reps: "10–12 reps", repsMin: 10, repsMax: 12 },
      { id: "sab_4", nombre: "Extensión cuádriceps",    series: 3, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
      { id: "sab_5", nombre: "Pantorrillas",            series: 4, reps: "12–15 reps", repsMin: 12, repsMax: 15 },
    ]
  }
};

/* ──────────────────────────────────────────
   2. ESTADO GLOBAL
────────────────────────────────────────── */
let diaActivo       = null;
let vistaHistorial  = false;   // ¿está abierto el panel de historial?
let exHistorialId   = null;    // id del ejercicio cuyo historial se muestra

/* ──────────────────────────────────────────
   3. CLAVES Y HELPERS DE localStorage
────────────────────────────────────────── */
const LS_PREFIX   = "gymtracker_";
const LS_SESION   = (dia, exId) => `${LS_PREFIX}sesion_hoy_${dia}_${exId}`;
const LS_HISTORIAL = (exId)     => `${LS_PREFIX}historial_${exId}`;
const MAX_HISTORIAL = 20;  // máximo de sesiones guardadas por ejercicio

/** Genera clave YYYY-MM-DD de hoy */
function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

/** Formatea fecha ISO a legible: "15 Jun 2025" */
function formatearFecha(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric"
  });
}

/* ── Sesión activa (día actual) ── */
function guardarSesion(dia, exId, data)  { localStorage.setItem(LS_SESION(dia, exId), JSON.stringify(data)); }
function cargarSesion(dia, exId)         { const r = localStorage.getItem(LS_SESION(dia, exId)); return r ? JSON.parse(r) : null; }
function borrarSesionDia(dia)            { RUTINA[dia].ejercicios.forEach(ex => localStorage.removeItem(LS_SESION(dia, ex.id))); }

/* ── Historial permanente ── */
function cargarHistorial(exId) {
  const r = localStorage.getItem(LS_HISTORIAL(exId));
  return r ? JSON.parse(r) : [];
}

function guardarEnHistorial(exId, entrada) {
  let hist = cargarHistorial(exId);
  // Evitar duplicados: si ya existe una entrada del mismo día, reemplazarla
  hist = hist.filter(h => h.fecha !== entrada.fecha);
  hist.push(entrada);
  // Mantener solo las últimas MAX_HISTORIAL sesiones, ordenadas por fecha
  hist.sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (hist.length > MAX_HISTORIAL) hist = hist.slice(-MAX_HISTORIAL);
  localStorage.setItem(LS_HISTORIAL(exId), JSON.stringify(hist));
}

function borrarTodoHistorial() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(LS_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

/* ──────────────────────────────────────────
   4. FÓRMULAS DE FUERZA
────────────────────────────────────────── */

/** Fórmula de Epley: 1RM = peso × (1 + reps/30) */
function calcular1RM(peso, reps) {
  if (reps <= 0 || peso <= 0) return 0;
  if (reps === 1) return peso;
  return peso * (1 + reps / 30);
}

/** Peso para un 1RM y reps objetivo (Epley inverso), redondeado a 0.5 kg */
function pesoParaReps(rm1, repsObj) {
  if (rm1 <= 0 || repsObj <= 0) return 0;
  return Math.round((rm1 / (1 + repsObj / 30)) * 2) / 2;
}

/** Volumen total de una serie de sets: suma(peso × reps) */
function calcularVolumen(series) {
  return series.reduce((acc, s) => acc + (s.peso || 0) * (s.reps || 0), 0);
}

/** Mejor 1RM de una lista de series */
function mejor1RM(series) {
  return Math.max(0, ...series.map(s => calcular1RM(s.peso || 0, s.reps || 0)));
}

/* ──────────────────────────────────────────
   5. MOTOR DE RECOMENDACIONES CON HISTORIAL
────────────────────────────────────────── */

/**
 * Analiza el historial del ejercicio y las series de hoy
 * para generar una recomendación inteligente.
 *
 * FUENTES DE DATOS (en orden de prioridad):
 *   A) Historial de sesiones pasadas  → tendencia a largo plazo
 *   B) Series completadas hoy         → ajuste dentro de la sesión
 *
 * ALGORITMO:
 *   1. Obtener mejor 1RM de cada sesión histórica.
 *   2. Calcular tendencia: ¿sube, baja o se estanca?
 *   3. Si 2 últimas sesiones = repsMax consecutivas → progresión +2.5 kg
 *   4. Calcular peso sugerido basado en el mejor 1RM histórico.
 *   5. Si hay series de hoy, ajustar según rendimiento actual.
 *
 * @param {Object} ex          - definición del ejercicio
 * @param {Array}  seriesHoy   - series de la sesión actual [{peso,reps,checked}]
 * @returns {Object} recomendacion
 */
function generarRecomendacion(ex, seriesHoy) {
  const historial = cargarHistorial(ex.id);
  const hoyValidas = seriesHoy.filter(s => s.checked && s.peso > 0 && s.reps > 0);

  // ── Construir timeline de 1RMs históricos ──
  const timeline = historial.map(sesion => ({
    fecha:   sesion.fecha,
    rm1:     sesion.rm1Max || 0,
    volumen: sesion.volumen || 0,
    // ¿esa sesión el usuario llegó al rango máximo en al menos una serie?
    enRangoMax: sesion.series
      ? sesion.series.some(s => s.reps >= ex.repsMax && s.peso > 0)
      : false
  }));

  // ── 1RM de referencia: mejor histórico o de hoy ──
  const rm1Historicos = timeline.map(t => t.rm1).filter(v => v > 0);
  const rm1Hoy        = hoyValidas.length > 0 ? mejor1RM(hoyValidas) : 0;
  const rm1Referencia = Math.max(...rm1Historicos, rm1Hoy, 0);

  // Sin datos en absoluto → no hay sugerencia
  if (rm1Referencia === 0) return null;

  const repsMedio    = Math.round((ex.repsMin + ex.repsMax) / 2);
  let pesoSugerido   = pesoParaReps(rm1Referencia, repsMedio);

  // ── Detectar tendencia de las últimas 3 sesiones ──
  let tendencia = "estable";
  if (timeline.length >= 2) {
    const ultimas = timeline.slice(-3);
    const diffs   = [];
    for (let i = 1; i < ultimas.length; i++) {
      diffs.push(ultimas[i].rm1 - ultimas[i - 1].rm1);
    }
    const promDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (promDiff > 1)       tendencia = "subiendo";
    else if (promDiff < -1) tendencia = "bajando";
  }

  // ── Regla de progresión: 2 sesiones seguidas en rango máximo → +2.5 kg ──
  let aplicarProgresion = false;
  if (timeline.length >= 2) {
    const ultimas2 = timeline.slice(-2);
    aplicarProgresion = ultimas2.every(t => t.enRangoMax);
  }
  if (aplicarProgresion) pesoSugerido += 2.5;

  // ── Ajuste por rendimiento de hoy (si hay series) ──
  let tipo, mensaje, fuenteDatos;

  if (hoyValidas.length > 0) {
    // Ajuste dentro de la sesión actual
    fuenteDatos = "hoy";
    const ultima = hoyValidas[hoyValidas.length - 1];

    if (ultima.reps > ex.repsMax) {
      tipo    = "subir";
      mensaje = `Hiciste ${ultima.reps} reps (sobre el rango). Sube el peso en la siguiente serie.`;
    } else if (ultima.reps < ex.repsMin) {
      tipo    = "bajar";
      mensaje = `Solo ${ultima.reps} reps (bajo el rango). Baja un poco para la siguiente serie.`;
    } else if (aplicarProgresion) {
      tipo    = "subir";
      mensaje = `¡Progresión desbloqueada! Llevas ${timeline.slice(-2).length} sesiones en el rango máximo.`;
    } else if (ultima.reps === ex.repsMax && tendencia === "subiendo") {
      tipo    = "subir-leve";
      mensaje = `Llevas una racha al alza. Considera subir la próxima serie.`;
    } else if (tendencia === "bajando") {
      tipo    = "mantener";
      mensaje = `Rendimiento a la baja últimamente. Consolida este peso antes de subir.`;
    } else {
      tipo    = "mantener";
      mensaje = `Buen ritmo (${ultima.reps} reps). Mantén el peso.`;
    }
  } else {
    // Solo historial, sin series de hoy aún
    fuenteDatos = "historial";
    if (aplicarProgresion) {
      tipo    = "subir";
      mensaje = `¡Progresión! Llevas 2 sesiones seguidas en el rango máximo. Es hora de subir.`;
    } else if (tendencia === "subiendo") {
      tipo    = "subir-leve";
      mensaje = `Tu 1RM estimado lleva subiendo. Mantén la progresión.`;
    } else if (tendencia === "bajando") {
      tipo    = "mantener";
      mensaje = `Tu rendimiento bajó las últimas sesiones. Consolida antes de subir.`;
    } else {
      tipo    = "mantener";
      mensaje = `Rendimiento estable. Sigue con este peso y apunta al rango máximo.`;
    }
  }

  // ── Construir objeto de retorno ──
  return {
    pesoSugerido:    Math.round(pesoSugerido * 2) / 2,
    repsMin:         ex.repsMin,
    repsMax:         ex.repsMax,
    rm1Ref:          Math.round(rm1Referencia * 10) / 10,
    tendencia,
    aplicarProgresion,
    sesionesGuardadas: historial.length,
    fuenteDatos,
    tipo,
    mensaje,
    timeline
  };
}

/* ──────────────────────────────────────────
   6. GUARDAR SESIÓN EN HISTORIAL
   Se llama cuando el usuario marca la última serie de un ejercicio.
────────────────────────────────────────── */

/**
 * Archiva la sesión actual de un ejercicio en el historial.
 * Solo guarda si todas las series tienen al menos peso o reps.
 * @param {string} dia
 * @param {Object} ex
 * @param {Array}  series - [{checked, peso, reps}]
 */
function archivarSesion(dia, ex, series) {
  const validas = series.filter(s => s.checked && (s.peso > 0 || s.reps > 0));
  if (validas.length === 0) return;

  const entrada = {
    fecha:   fechaHoy(),
    dia,
    series:  validas.map(s => ({ peso: parseFloat(s.peso) || 0, reps: parseInt(s.reps) || 0 })),
    rm1Max:  Math.round(mejor1RM(validas.map(s => ({
               peso: parseFloat(s.peso) || 0,
               reps: parseInt(s.reps) || 0
             }))) * 10) / 10,
    volumen: Math.round(calcularVolumen(validas.map(s => ({
               peso: parseFloat(s.peso) || 0,
               reps: parseInt(s.reps) || 0
             }))))
  };

  guardarEnHistorial(ex.id, entrada);
}

/* ──────────────────────────────────────────
   7. PROGRESO DEL DÍA
────────────────────────────────────────── */
function calcularProgresoDia(dia) {
  let totalSeries = 0, seriesCompletadas = 0;
  RUTINA[dia].ejercicios.forEach(ex => {
    const s = cargarSesion(dia, ex.id);
    totalSeries += ex.series;
    if (s) s.series.forEach(sr => { if (sr.checked) seriesCompletadas++; });
  });
  const porcentaje = totalSeries > 0 ? Math.round((seriesCompletadas / totalSeries) * 100) : 0;
  return { porcentaje, completados: seriesCompletadas, total: totalSeries };
}

function actualizarBarraProgreso() {
  const fill    = document.getElementById("progressFill");
  const percent = document.getElementById("progressPercent");
  const subLbl  = document.getElementById("progressSubLabel");
  if (!diaActivo) {
    fill.style.width    = "0%";
    percent.textContent = "0%";
    subLbl.textContent  = "Selecciona un día para comenzar";
    return;
  }
  const { porcentaje, completados, total } = calcularProgresoDia(diaActivo);
  fill.style.width    = porcentaje + "%";
  percent.textContent = porcentaje + "%";
  if (porcentaje === 0)        subLbl.textContent = `0 de ${total} series — ¡A entrenar!`;
  else if (porcentaje === 100) subLbl.textContent = `✅ ¡Entrenamiento completado! ${total}/${total} series`;
  else                         subLbl.textContent = `${completados} de ${total} series completadas`;
}

/* ──────────────────────────────────────────
   8. RENDERIZADO PRINCIPAL
────────────────────────────────────────── */
function renderizarEjercicios() {
  const container  = document.getElementById("exercisesContainer");
  const emptyState = document.getElementById("emptyState");
  const actionsBar = document.getElementById("actionsBar");

  if (!diaActivo) {
    emptyState.style.display = "flex";
    container.style.display  = "none";
    actionsBar.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  container.style.display  = "flex";
  actionsBar.style.display = "flex";
  container.innerHTML = "";

  RUTINA[diaActivo].ejercicios.forEach((ex, idx) => {
    container.appendChild(crearTarjetaEjercicio(ex, idx));
  });

  actualizarBarraProgreso();
}

/* ──────────────────────────────────────────
   9. TARJETA DE EJERCICIO
────────────────────────────────────────── */
function crearTarjetaEjercicio(ex, idx) {
  const sesion = cargarSesion(diaActivo, ex.id);
  const estadoSeries = Array.from({ length: ex.series }, (_, i) => ({
    checked: sesion?.series[i]?.checked ?? false,
    peso:    sesion?.series[i]?.peso    ?? "",
    reps:    sesion?.series[i]?.reps    ?? ""
  }));

  const completo        = estadoSeries.every(s => s.checked);
  const completadasAhora = estadoSeries.filter(s => s.checked).length;
  const histLen         = cargarHistorial(ex.id).length;

  const card = document.createElement("div");
  card.className = "exercise-card" + (completo ? " completed" : "");
  card.dataset.exId = ex.id;
  card.style.animationDelay = `${idx * 60}ms`;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title-block">
        <div class="card-exercise-name">${ex.nombre}</div>
        <div class="card-meta">
          <span class="meta-tag">${ex.series} SERIES</span>
          <span class="meta-tag">${ex.reps}</span>
          ${histLen > 0 ? `<span class="meta-tag meta-hist" data-exid="${ex.id}">📈 ${histLen} sesión${histLen > 1 ? "es" : ""}</span>` : ""}
        </div>
      </div>
      <div class="card-badge" id="badge_${ex.id}">${completadasAhora}/${ex.series}</div>
    </div>
    <div class="card-divider"></div>
    <div class="card-series" id="series_${ex.id}"></div>
    <div class="suggestion-box" id="sug_${ex.id}" style="display:none;"></div>
  `;

  const seriesContainer = card.querySelector(`#series_${ex.id}`);
  estadoSeries.forEach((estado, serieIdx) => {
    seriesContainer.appendChild(crearFilaSerie(ex, serieIdx, estado));
  });

  // Clic en badge de historial → abrir panel
  card.querySelector('.meta-hist')?.addEventListener('click', () => abrirHistorial(ex));

  actualizarSugerencia(ex);
  return card;
}

/* ──────────────────────────────────────────
   10. FILA DE SERIE
────────────────────────────────────────── */
function crearFilaSerie(ex, serieIdx, estado) {
  const checkId = `check_${ex.id}_s${serieIdx}`;
  const row = document.createElement("div");
  row.className = "series-row" + (estado.checked ? " done" : "");
  row.dataset.exId     = ex.id;
  row.dataset.serieIdx = serieIdx;

  row.innerHTML = `
    <span class="series-number">S${serieIdx + 1}</span>
    <div class="series-inputs">
      <div class="input-group">
        <span class="input-label">PESO</span>
        <div class="input-with-unit">
          <input class="series-weight-input" type="number" min="0" step="0.5"
            placeholder="—" value="${estado.peso}"
            id="peso_${ex.id}_s${serieIdx}" inputmode="decimal"/>
          <span class="input-unit">kg</span>
        </div>
      </div>
      <div class="input-sep">×</div>
      <div class="input-group">
        <span class="input-label">REPS</span>
        <div class="input-with-unit">
          <input class="series-reps-input" type="number" min="1" max="99" step="1"
            placeholder="—" value="${estado.reps}"
            id="reps_${ex.id}_s${serieIdx}" inputmode="numeric"/>
          <span class="input-unit">r</span>
        </div>
      </div>
    </div>
    <span class="series-spacer"></span>
    <label class="series-check-wrapper" for="${checkId}">
      <input type="checkbox" id="${checkId}" ${estado.checked ? "checked" : ""} />
      <span class="custom-check"></span>
    </label>
  `;

  row.querySelector(".series-weight-input").addEventListener("change", () => actualizarSerie(ex, serieIdx));
  row.querySelector(".series-reps-input").addEventListener("change",   () => actualizarSerie(ex, serieIdx));
  row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
    row.classList.toggle("done", e.target.checked);
    actualizarSerie(ex, serieIdx);
  });

  return row;
}

/* ──────────────────────────────────────────
   11. ACTUALIZAR SUGERENCIA EN TARJETA
────────────────────────────────────────── */
function actualizarSugerencia(ex) {
  const sugBox = document.getElementById(`sug_${ex.id}`);
  if (!sugBox) return;

  const seriesHoy = [];
  for (let i = 0; i < ex.series; i++) {
    seriesHoy.push({
      checked: document.getElementById(`check_${ex.id}_s${i}`)?.checked ?? false,
      peso:    parseFloat(document.getElementById(`peso_${ex.id}_s${i}`)?.value) || 0,
      reps:    parseInt(document.getElementById(`reps_${ex.id}_s${i}`)?.value, 10) || 0,
    });
  }

  const rec             = generarRecomendacion(ex, seriesHoy);
  const seriesRestantes = ex.series - seriesHoy.filter(s => s.checked).length;

  if (!rec || seriesRestantes === 0) {
    sugBox.style.display = "none";
    sugBox.innerHTML     = "";
    return;
  }

  const config = {
    "subir":      { icon: "▲", cls: "sug-up",      label: "SUBE EL PESO"    },
    "subir-leve": { icon: "▲", cls: "sug-up-light", label: "CONSIDERA SUBIR" },
    "mantener":   { icon: "◆", cls: "sug-hold",     label: "MANTÉN EL PESO"  },
    "bajar":      { icon: "▼", cls: "sug-down",     label: "BAJA EL PESO"    },
  };
  const { icon, cls, label } = config[rec.tipo] || config["mantener"];

  // Indicador de fuente de datos
  const fuenteTag = rec.fuenteDatos === "historial"
    ? `<span class="sug-source">📈 Basado en ${rec.sesionesGuardadas} sesión${rec.sesionesGuardadas > 1 ? "es" : ""}</span>`
    : `<span class="sug-source">⚡ Serie actual</span>`;

  // Indicador de tendencia
  const tendenciaMap = { subiendo: "↗ SUBIENDO", estable: "→ ESTABLE", bajando: "↘ BAJANDO" };
  const tendenciaTag = rec.sesionesGuardadas >= 2
    ? `<span class="sug-trend sug-trend-${rec.tendencia}">${tendenciaMap[rec.tendencia]}</span>`
    : "";

  sugBox.style.display = "block";
  sugBox.className     = `suggestion-box ${cls}`;
  sugBox.innerHTML = `
    <div class="sug-header">
      <span class="sug-icon">${icon}</span>
      <span class="sug-label">${label}</span>
      <span class="sug-series-left">${seriesRestantes} serie${seriesRestantes > 1 ? "s" : ""} restante${seriesRestantes > 1 ? "s" : ""}</span>
    </div>
    <div class="sug-body">
      <div class="sug-main">
        <span class="sug-weight">${rec.pesoSugerido > 0 ? rec.pesoSugerido + " kg" : "— kg"}</span>
        <span class="sug-x">×</span>
        <span class="sug-reps">${rec.repsMin}–${rec.repsMax} reps</span>
      </div>
      <div class="sug-detail">
        <span class="sug-rm">1RM ref.: <strong>${rec.rm1Ref} kg</strong></span>
        ${tendenciaTag}
      </div>
    </div>
    <div class="sug-footer-row">
      ${fuenteTag}
      ${rec.aplicarProgresion ? '<span class="sug-prog-badge">🏆 PROGRESIÓN</span>' : ""}
    </div>
    <p class="sug-msg">${rec.mensaje}</p>
  `;
}

/* ──────────────────────────────────────────
   12. PERSISTIR SERIE Y ARCHIVAR SI COMPLETO
────────────────────────────────────────── */
function actualizarSerie(ex, changedIdx) {
  const series = [];
  for (let i = 0; i < ex.series; i++) {
    series.push({
      checked: document.getElementById(`check_${ex.id}_s${i}`)?.checked ?? false,
      peso:    document.getElementById(`peso_${ex.id}_s${i}`)?.value  ?? "",
      reps:    document.getElementById(`reps_${ex.id}_s${i}`)?.value  ?? "",
    });
  }

  // Guardar sesión activa
  guardarSesion(diaActivo, ex.id, { series });

  // ── Archivar en historial si todas las series están marcadas ──
  const completadas = series.filter(s => s.checked).length;
  if (completadas === ex.series) {
    archivarSesion(diaActivo, ex, series);
  }

  // Badge
  const badge = document.getElementById(`badge_${ex.id}`);
  if (badge) badge.textContent = `${completadas}/${ex.series}`;

  // Clase de la tarjeta
  const card = document.querySelector(`.exercise-card[data-ex-id="${ex.id}"]`);
  if (card) {
    const yaCompleto    = card.classList.contains("completed");
    const ahoraCompleto = completadas === ex.series;
    card.classList.toggle("completed", ahoraCompleto);
    if (!yaCompleto && ahoraCompleto) {
      card.classList.add("just-completed");
      setTimeout(() => card.classList.remove("just-completed"), 700);
    }
  }

  actualizarSugerencia(ex);
  actualizarBarraProgreso();
}

/* ──────────────────────────────────────────
   13. PANEL DE HISTORIAL
────────────────────────────────────────── */

/**
 * Abre el modal/panel lateral con el historial del ejercicio.
 * @param {Object} ex
 */
function abrirHistorial(ex) {
  const historial = cargarHistorial(ex.id);
  const panel = document.getElementById("historialPanel");
  const content = document.getElementById("historialContent");

  document.getElementById("historialTitle").textContent = ex.nombre.toUpperCase();

  if (historial.length === 0) {
    content.innerHTML = `
      <div class="hist-empty">
        <p>Sin sesiones registradas aún.</p>
        <p class="hist-empty-sub">Completa un entrenamiento para ver tu historial aquí.</p>
      </div>`;
  } else {
    // Ordenar de más reciente a más antiguo para mostrar
    const ordenadas = [...historial].reverse();

    // Mini gráfico de 1RM a lo largo del tiempo
    const maxRM = Math.max(...historial.map(h => h.rm1Max));
    const grafHTML = renderizarMiniGrafico(historial, maxRM);

    const sesionesHTML = ordenadas.map((sesion, i) => {
      const esHoy = sesion.fecha === fechaHoy();
      const seriesStr = sesion.series.map(s =>
        `<span class="hist-serie">${s.peso > 0 ? s.peso + "kg" : "—"} × ${s.reps > 0 ? s.reps : "—"}</span>`
      ).join("");

      return `
        <div class="hist-sesion ${esHoy ? "hist-sesion-hoy" : ""}">
          <div class="hist-sesion-header">
            <span class="hist-fecha">${formatearFecha(sesion.fecha)}${esHoy ? " · HOY" : ""}</span>
            <span class="hist-rm1">1RM ~${sesion.rm1Max} kg</span>
          </div>
          <div class="hist-series-row">${seriesStr}</div>
          <div class="hist-volumen">Volumen total: ${sesion.volumen} kg</div>
        </div>`;
    }).join("");

    content.innerHTML = `
      <div class="hist-stats">
        <div class="hist-stat">
          <span class="hist-stat-val">${historial.length}</span>
          <span class="hist-stat-lbl">SESIONES</span>
        </div>
        <div class="hist-stat">
          <span class="hist-stat-val">${maxRM} kg</span>
          <span class="hist-stat-lbl">MEJOR 1RM</span>
        </div>
        <div class="hist-stat">
          <span class="hist-stat-val">${historial[historial.length-1].rm1Max} kg</span>
          <span class="hist-stat-lbl">ÚLTIMO 1RM</span>
        </div>
      </div>
      ${grafHTML}
      <div class="hist-lista">${sesionesHTML}</div>`;
  }

  panel.classList.add("open");
  document.body.classList.add("panel-open");
}

/**
 * Renderiza un mini gráfico de barras ASCII/CSS del 1RM histórico.
 * @param {Array}  historial
 * @param {number} maxRM
 * @returns {string} HTML
 */
function renderizarMiniGrafico(historial, maxRM) {
  if (historial.length < 2) return "";
  // Tomar las últimas 10 sesiones para el gráfico
  const datos = historial.slice(-10);

  const barras = datos.map(s => {
    const pct    = maxRM > 0 ? Math.round((s.rm1Max / maxRM) * 100) : 0;
    const fecha  = s.fecha.slice(5); // MM-DD
    const esHoy  = s.fecha === fechaHoy();
    return `
      <div class="graf-col">
        <span class="graf-val">${s.rm1Max}</span>
        <div class="graf-bar-wrap">
          <div class="graf-bar ${esHoy ? "graf-bar-hoy" : ""}" style="height:${pct}%"></div>
        </div>
        <span class="graf-fecha">${fecha}</span>
      </div>`;
  }).join("");

  return `
    <div class="hist-grafico">
      <div class="graf-title">EVOLUCIÓN 1RM ESTIMADO (kg)</div>
      <div class="graf-chart">${barras}</div>
    </div>`;
}

function cerrarHistorial() {
  document.getElementById("historialPanel").classList.remove("open");
  document.body.classList.remove("panel-open");
}

/* ──────────────────────────────────────────
   14. NAVEGACIÓN DE DÍAS
────────────────────────────────────────── */
function activarDia(dia) {
  diaActivo = dia;
  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.day === dia);
  });
  renderizarEjercicios();
}

/* ──────────────────────────────────────────
   15. RESET
────────────────────────────────────────── */
function resetearDia() {
  if (!diaActivo) return;
  const nombre = diaActivo.charAt(0).toUpperCase() + diaActivo.slice(1);
  if (!confirm(`¿Resetear la sesión del ${nombre}?\n\nNota: el historial de sesiones anteriores se conserva.`)) return;
  borrarSesionDia(diaActivo);
  renderizarEjercicios();
}

function limpiarTodo() {
  if (!confirm("¿Borrar TODO? Se eliminarán la sesión de hoy Y el historial completo de todos los ejercicios.\n\nEsta acción no se puede deshacer.")) return;
  borrarTodoHistorial();
  if (diaActivo) renderizarEjercicios();
}

/* ──────────────────────────────────────────
   16. FECHA EN HEADER
────────────────────────────────────────── */
function actualizarFecha() {
  const el = document.getElementById("headerDate");
  if (!el) return;
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();
  const hora  = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  el.innerHTML = `${fecha}<br>${hora}`;
}

/* ──────────────────────────────────────────
   17. INICIALIZACIÓN
────────────────────────────────────────── */
function init() {
  actualizarFecha();
  setInterval(actualizarFecha, 60_000);

  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.addEventListener("click", () => activarDia(btn.dataset.day));
  });

  document.getElementById("btnResetDay").addEventListener("click", resetearDia);
  document.getElementById("btnClearAll").addEventListener("click", limpiarTodo);
  document.getElementById("historialClose").addEventListener("click", cerrarHistorial);

  // Cerrar panel al tocar el overlay
  document.getElementById("historialOverlay").addEventListener("click", cerrarHistorial);

  const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const diaHoy     = diasSemana[new Date().getDay()];
  if (RUTINA[diaHoy]) activarDia(diaHoy);
}

document.addEventListener("DOMContentLoaded", init);
