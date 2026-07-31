"use strict";

/*
  EVALUACIÓN FINAL DE JAVASCRIPT - PROYECTO B
  Archivo autorizado para edición: js/app.js

  La interfaz, los estilos y los archivos JSON ya fueron entregados.
  Complete la lógica sin escribir personajes manualmente en el HTML.
*/

const CONFIG = {
  storageKey: "examen_personajes_catalogo",
  primaryUrl: "./data/personajes.json",
  relatedUrl: "./data/especies.json",
  transactionsUrl: "./data/misiones.json",
  externalSearchUrl: "https://rickandmortyapi.com/api/character/?name=",
  externalDetailUrl: "https://rickandmortyapi.com/api/character/"
};

let registros = [];              // Personajes: entidad del CRUD.
let catalogoRelacionado = [];    // Especies.
let misiones = [];               // Misiones relacionadas con personajes.
let idEnEdicion = null;
let graficoResumen = null;
let datosExternos = [];

const dom = {
  formulario: document.getElementById("formRegistro"),
  formularioTitulo: document.getElementById("formularioTitulo"),
  botonGuardar: document.getElementById("btnGuardar"),
  botonCancelarEdicion: document.getElementById("btnCancelarEdicion"),
  botonRestaurar: document.getElementById("btnRestaurar"),
  buscador: document.getElementById("inputBusqueda"),
  filtroPrincipal: document.getElementById("filtroPrincipal"),
  filtroSecundario: document.getElementById("filtroSecundario"),
  ordenamiento: document.getElementById("ordenamiento"),
  botonLimpiarFiltros: document.getElementById("btnLimpiarFiltros"),
  contenedorRegistros: document.getElementById("contenedorRegistros"),
  estadoVacio: document.getElementById("estadoVacio"),
  modalJson: document.getElementById("modalJson"),
  salidaJson: document.getElementById("salidaJson"),
  botonJsonGeneral: document.getElementById("btnJsonGeneral"),
  inputApi: document.getElementById("inputApi"),
  botonApi: document.getElementById("btnConsultarApi"),
  resultadosApi: document.getElementById("resultadosApi"),
  modalApi: document.getElementById("modalApi"),
  contenidoModalApi: document.getElementById("contenidoModalApi"),
  grafico: document.getElementById("graficoResumen"),
  tablaEstadisticas: document.getElementById("tablaEstadisticas"),
  loader: document.getElementById("loader"),
  stat1: document.getElementById("stat1"),
  stat2: document.getElementById("stat2"),
  stat3: document.getElementById("stat3"),
  stat4: document.getElementById("stat4"),
  nombre: document.getElementById("nombre"),
  especieId: document.getElementById("especieId"),
  estado: document.getElementById("estado"),
  genero: document.getElementById("genero"),
  origen: document.getElementById("origen"),
  imagen: document.getElementById("imagen")
};

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

async function iniciarAplicacion() {
  registrarEventos();

  const datosRecuperados = recuperarDesdeLocalStorage();

  if (datosRecuperados) {
    await cargarCatalogosBase();
    completarSelectores();
    aplicarBusquedaFiltrosYOrden();
    actualizarIndicadores();
    actualizarTablaEstadisticas();
    actualizarGrafico();
  } else {
    await cargarDatosIniciales();
  }
}

function registrarEventos() {
  dom.formulario.addEventListener("submit", manejarFormulario);
  dom.botonCancelarEdicion.addEventListener("click", cancelarEdicion);
  dom.botonRestaurar.addEventListener("click", restaurarDatosOriginales);
  dom.botonLimpiarFiltros.addEventListener("click", limpiarFiltros);
  dom.botonJsonGeneral.addEventListener("click", () => mostrarJson(registros));
  dom.botonApi.addEventListener("click", consultarApiExterna);
  dom.inputApi.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      consultarApiExterna();
    }
  });

  dom.buscador.addEventListener("input", aplicarBusquedaFiltrosYOrden);
  dom.filtroPrincipal.addEventListener("change", aplicarBusquedaFiltrosYOrden);
  dom.filtroSecundario.addEventListener("change", aplicarBusquedaFiltrosYOrden);
  dom.ordenamiento.addEventListener("change", aplicarBusquedaFiltrosYOrden);

  dom.contenedorRegistros.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button");
    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.classList.contains("btn-ver-json")) {
      mostrarJson(registros.find((registro) => registro.id === id));
    } else if (boton.classList.contains("btn-editar")) {
      prepararEdicion(id);
    } else if (boton.classList.contains("btn-eliminar")) {
      eliminarRegistro(id);
    }
  });

  dom.resultadosApi.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button");
    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.classList.contains("btn-detalle-api")) {
      consultarDetalleExterno(id);
    } else if (boton.classList.contains("btn-agregar-api")) {
      const personaje = datosExternos.find((item) => item.id === id);
      if (personaje) {
        transformarYAgregarExterno(personaje);
      }
    }
  });
}

async function cargarJsonLocal(ruta) {
  try {
    const respuesta = await fetch(ruta);

    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar ${ruta}`);
    }

    return await respuesta.json();
  } catch (error) {
    console.error(error);
    mostrarError(`No se pudo cargar: ${ruta}`);
    return [];
  }
}

async function cargarCatalogosBase() {
  const especiesData = await cargarJsonLocal(CONFIG.relatedUrl);
  const misionesData = await cargarJsonLocal(CONFIG.transactionsUrl);

  catalogoRelacionado = Array.isArray(especiesData) ? especiesData : [];
  misiones = Array.isArray(misionesData) ? misionesData : [];
}

async function cargarDatosIniciales() {
  const personajesData = await cargarJsonLocal(CONFIG.primaryUrl);
  await cargarCatalogosBase();

  registros = Array.isArray(personajesData) ? personajesData : [];

  completarSelectores();
  aplicarBusquedaFiltrosYOrden();
  actualizarIndicadores();
  actualizarTablaEstadisticas();
  actualizarGrafico();
}

function recuperarDesdeLocalStorage() {
  const datos = localStorage.getItem(CONFIG.storageKey);

  if (!datos) {
    return false;
  }

  try {
    const datosParseados = JSON.  parse(datos);

    if (Array.isArray(datosParseados) && datosParseados.length > 0) {
      registros = datosParseados;
      return true;
    }
  } catch (error) {
    console.error(error);
  }

  return false;
}

function guardarEnLocalStorage() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(registros));
}

async function restaurarDatosOriginales() {
  const confirmar = await Swal.fire({
    title: "¿Restaurar datos originales?",
    text: "Se perderán los cambios guardados localmente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, restaurar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmar.isConfirmed) return;

  localStorage.removeItem(CONFIG.storageKey);
  await cargarDatosIniciales();
  mostrarToast("Datos restaurados", "success");
}

function completarSelectores() {
  dom.filtroPrincipal.innerHTML = '<option value="">Todas</option>';
  dom.especieId.innerHTML = '<option value="">Seleccione</option>';

  catalogoRelacionado.forEach((especie) => {
    const optionFiltro = document.createElement("option");
    optionFiltro.value = especie.id;
    optionFiltro.textContent = especie.nombre;
    dom.filtroPrincipal.appendChild(optionFiltro);

    const optionFormulario = document.createElement("option");
    optionFormulario.value = especie.id;
    optionFormulario.textContent = especie.nombre;
    dom.especieId.appendChild(optionFormulario);
  });
}

function manejarFormulario(evento) {
  evento.preventDefault();

  const datos = obtenerDatosFormulario();

  if (!validarDatos(datos)) {
    return;
  }

  if (idEnEdicion !== null) {
    actualizarRegistro(datos);
  } else {
    agregarRegistro(datos);
  }
}

function obtenerDatosFormulario() {
  return {
    nombre: dom.nombre.value.trim(),
    especieId: Number(dom.especieId.value),
    estado: dom.estado.value.trim(),
    genero: dom.genero.value.trim(),
    origen: dom.origen.value.trim(),
    imagen: dom.imagen.value.trim()
  };
}

function validarDatos(datos) {
  if (!datos.nombre || !datos.estado || !datos.genero || !datos.origen) {
    mostrarError("Complete los campos obligatorios.");
    return false;
  }

  if (!Number.isInteger(datos.especieId) || datos.especieId <= 0) {
    mostrarError("Seleccione una especie válida.");
    return false;
  }

  const existeNombre = registros.some((registro) => {
    if (idEnEdicion !== null && registro.id === idEnEdicion) {
      return false;
    }
    return registro.nombre.toLowerCase() === datos.nombre.toLowerCase();
  });

  if (existeNombre) {
    mostrarError("Ya existe un personaje con ese nombre.");
    return false;
  }

  return true;
}

function generarNuevoId() {
  const ids = registros.map((registro) => registro.id);
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

function agregarRegistro(datos) {
  const nuevoRegistro = {
    id: generarNuevoId(),
    nombre: datos.nombre,
    especieId: datos.especieId,
    estado: datos.estado,
    genero: datos.genero,
    origen: datos.origen,
    imagen: datos.imagen || "assets/img/default.svg"
  };

  registros.push(nuevoRegistro);
  guardarEnLocalStorage();
  aplicarBusquedaFiltrosYOrden();
  actualizarIndicadores();
  actualizarTablaEstadisticas();
  actualizarGrafico();
  mostrarToast("Personaje agregado correctamente", "success");
  dom.formulario.reset();
}

function prepararEdicion(id) {
  const personaje = registros.find((registro) => registro.id === id);

  if (!personaje) return;

  idEnEdicion = id;
  dom.nombre.value = personaje.nombre;
  dom.especieId.value = personaje.especieId;
  dom.estado.value = personaje.estado;
  dom.genero.value = personaje.genero;
  dom.origen.value = personaje.origen;
  dom.imagen.value = personaje.imagen || "";
  dom.formularioTitulo.textContent = "Editar personaje";
  dom.botonGuardar.textContent = "Guardar cambios";
  dom.botonCancelarEdicion.classList.remove("d-none");

  const botonTabFormulario = document.querySelector('[data-bs-target="#tabFormulario"]');
  if (botonTabFormulario) {
    botonTabFormulario.click();
  }

  dom.nombre.focus();
}

function actualizarRegistro(datos) {
  const indice = registros.findIndex((registro) => registro.id === idEnEdicion);

  if (indice === -1) return;

  registros[indice] = {
    ...registros[indice],
    nombre: datos.nombre,
    especieId: datos.especieId,
    estado: datos.estado,
    genero: datos.genero,
    origen: datos.origen,
    imagen: datos.imagen || "assets/img/default.svg"
  };

  guardarEnLocalStorage();
  aplicarBusquedaFiltrosYOrden();
  actualizarIndicadores();
  actualizarTablaEstadisticas();
  actualizarGrafico();
  mostrarToast("Personaje actualizado", "success");
  cancelarEdicion();
}

async function eliminarRegistro(id) {
  const confirmacion = await Swal.fire({
    title: "¿Eliminar personaje?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });
 
  if (!confirmacion.isConfirmed) return;
 
  registros = registros.filter((r) => r.id !== id);
  guardarEnLocalStorage();
 
  aplicarBusquedaFiltrosYOrden();
  actualizarIndicadores();
  actualizarTablaEstadisticas();
  actualizarGrafico();
  mostrarToast("Personaje eliminado", "success");
}

function cancelarEdicion() {
  idEnEdicion = null;
  dom.formulario.reset();
  dom.formularioTitulo.textContent = "Registrar personaje";
  dom.botonGuardar.textContent = "Agregar personaje";
  dom.botonCancelarEdicion.classList.add("d-none");
}

function obtenerNombreEspecie(especieId) {
  const especie = catalogoRelacionado.find((e) => e.id === especieId);
  return especie ? especie.nombre : "Desconocida";
}

function obtenerMisionesPersonaje(personajeId) {
  return misiones.filter((m) => m.personajeId === personajeId);
}

function obtenerPuntosPersonaje(personajeId) {
  const misionesDelPersonaje = obtenerMisionesPersonaje(personajeId);
  return misionesDelPersonaje.reduce((total, m) => total + m.puntos, 0);
}

function aplicarBusquedaFiltrosYOrden() {
 let resultado = [...registros];
 
  const texto = dom.buscador.value.trim().toLowerCase();
  const especieFiltro = dom.filtroPrincipal.value;
  const estadoFiltro = dom.filtroSecundario.value;
  const orden = dom.ordenamiento.value;
 

  if (texto) {
    resultado = resultado.filter((r) => {
      const nombreEspecie = obtenerNombreEspecie(r.especieId).toLowerCase();
      return (
        r.nombre.toLowerCase().includes(texto) ||
        r.origen.toLowerCase().includes(texto) ||
        nombreEspecie.includes(texto)
      );
    });
  }
  if (especieFiltro) {
    resultado = resultado.filter((r) => r.especieId === Number(especieFiltro));
  }

  if (estadoFiltro) {
    resultado = resultado.filter((r) => r.estado === estadoFiltro);
  }

  if (orden === "nombre-asc") {
    resultado = resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (orden === "nombre-desc") {
    resultado = resultado.sort((a, b) => b.nombre.localeCompare(a.nombre));
  } else if (orden === "puntos-desc") {
    resultado = resultado.sort(
      (a, b) => obtenerPuntosPersonaje(b.id) - obtenerPuntosPersonaje(a.id)
    );
  } else if (orden === "puntos-asc") {
    resultado = resultado.sort(
      (a, b) => obtenerPuntosPersonaje(a.id) - obtenerPuntosPersonaje(b.id)
    );
  }
 
  renderizarRegistros(resultado);
  return resultado;
}

function renderizarRegistros(datos) {
 dom.contenedorRegistros.innerHTML = "";
 
  if (datos.length === 0) {
    dom.estadoVacio.classList.remove("d-none");
    dom.estadoVacio.querySelector("h3").textContent = "Sin resultados";
    dom.estadoVacio.querySelector("p").textContent =
      "No se encontraron personajes con los filtros aplicados.";
    return;
  }
 
  dom.estadoVacio.classList.add("d-none");
 
  datos.forEach((registro) => {
    const columna = document.createElement("div");
    columna.className = "col-sm-6 col-lg-4";
    columna.appendChild(crearElementoRegistro(registro));
    dom.contenedorRegistros.appendChild(columna);
  });
}

function crearElementoRegistro(registro) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "card entity-card";
  tarjeta.dataset.id = registro.id;
 
  const img = document.createElement("img");
  img.src = registro.imagen;
  img.alt = registro.nombre;
  img.className = "character-avatar";
  tarjeta.appendChild(img);
 
  const cuerpo = document.createElement("div");
  cuerpo.className = "card-body";
 
  const titulo = document.createElement("h3");
  titulo.className = "h6 mb-1";
  titulo.textContent = registro.nombre;
  cuerpo.appendChild(titulo);
 
  const especie = document.createElement("p");
  especie.className = "small text-secondary mb-1";
  especie.textContent = `Especie: ${obtenerNombreEspecie(registro.especieId)}`;
  cuerpo.appendChild(especie);
 
  const estado = document.createElement("p");
  estado.className = "small mb-1";
  estado.textContent = `Estado: ${registro.estado}`;
  cuerpo.appendChild(estado);
 
  const genero = document.createElement("p");
  genero.className = "small mb-1";
  genero.textContent = `Género: ${registro.genero}`;
  cuerpo.appendChild(genero);
 
  const origen = document.createElement("p");
  origen.className = "small mb-1";
  origen.textContent = `Origen: ${registro.origen}`;
  cuerpo.appendChild(origen);
 
  const misionesPersonaje = obtenerMisionesPersonaje(registro.id);
  const puntos = obtenerPuntosPersonaje(registro.id);
 
  const misionesTexto = document.createElement("p");
  misionesTexto.className = "small mb-1";
  misionesTexto.textContent = `Misiones: ${misionesPersonaje.length}`;
  cuerpo.appendChild(misionesTexto);
 
  const puntosTexto = document.createElement("p");
  puntosTexto.className = "small fw-bold mb-3";
  puntosTexto.textContent = `Puntos: ${puntos}`;
  cuerpo.appendChild(puntosTexto);
 
  const grupoBotones = document.createElement("div");
  grupoBotones.className = "d-flex gap-2 flex-wrap";
 
  const botonJson = document.createElement("button");
  botonJson.className = "btn btn-sm btn-outline-secondary btn-ver-json";
  botonJson.textContent = "Ver JSON";
  botonJson.dataset.id = registro.id;
 
  const botonEditar = document.createElement("button");
  botonEditar.className = "btn btn-sm btn-outline-primary btn-editar";
  botonEditar.textContent = "Editar";
  botonEditar.dataset.id = registro.id;
 
  const botonEliminar = document.createElement("button");
  botonEliminar.className = "btn btn-sm btn-outline-danger btn-eliminar";
  botonEliminar.textContent = "Eliminar";
  botonEliminar.dataset.id = registro.id;
 
  grupoBotones.append(botonJson, botonEditar, botonEliminar);
  cuerpo.appendChild(grupoBotones);
  tarjeta.appendChild(cuerpo);
 
  return tarjeta;
}

function mostrarJson(datos) {
  dom.salidaJson.textContent = JSON.stringify(datos, null, 2);
  bootstrap.Modal.getOrCreateInstance(dom.modalJson).show();
}

function calcularEstadisticas() {
    const totalPersonajes = registros.length;
  const activos = registros.filter((r) => r.estado === "Activo").length;
  const inactivos = registros.filter((r) => r.estado === "Inactivo").length;
  const totalMisiones = misiones.length;
  const puntosAcumulados = misiones.reduce((total, m) => total + m.puntos, 0);
  const promedioPuntos = totalMisiones > 0 ? puntosAcumulados / totalMisiones : 0;

  let personajeMasMisiones = null;
  let maxMisiones = -1;
  registros.forEach((r) => {
    const cantidad = obtenerMisionesPersonaje(r.id).length;
    if (cantidad > maxMisiones) {
      maxMisiones = cantidad;
      personajeMasMisiones = r;
    }
  });
 
  let personajeMasPuntos = null;
  let maxPuntos = -1;
  registros.forEach((r) => {
    const puntos = obtenerPuntosPersonaje(r.id);
    if (puntos > maxPuntos) {
      maxPuntos = puntos;
      personajeMasPuntos = r;
    }
  });
 
  return {
    totalPersonajes,
    activos,
    inactivos,
    totalMisiones,
    puntosAcumulados,
    promedioPuntos,
    personajeMasMisiones,
    maxMisiones,
    personajeMasPuntos,
    maxPuntos
  };
}

function actualizarIndicadores() {
  const stats = calcularEstadisticas();
  dom.stat1.textContent = stats.totalPersonajes;
  dom.stat2.textContent = stats.activos;
  dom.stat3.textContent = stats.totalMisiones;
  dom.stat4.textContent = stats.puntosAcumulados;
}

function actualizarTablaEstadisticas() {
   const stats = calcularEstadisticas();
  dom.tablaEstadisticas.innerHTML = "";
 
  const items = [
    `Total de personajes: ${stats.totalPersonajes}`,
    `Personajes activos: ${stats.activos}`,
    `Personajes inactivos: ${stats.inactivos}`,
    `Total de misiones: ${stats.totalMisiones}`,
    `Puntos acumulados: ${stats.puntosAcumulados}`,
    `Promedio de puntos por misión: ${stats.promedioPuntos.toFixed(2)}`,
    `Personaje con más misiones: ${stats.personajeMasMisiones ? stats.personajeMasMisiones.nombre : "N/A"} (${stats.maxMisiones})`,
    `Personaje con mayor puntuación: ${stats.personajeMasPuntos ? stats.personajeMasPuntos.nombre : "N/A"} (${stats.maxPuntos})`
  ];
 
  items.forEach((texto) => {
    const item = document.createElement("div");
    item.className = "list-group-item";
    item.textContent = texto;
    dom.tablaEstadisticas.appendChild(item);
  });
}

function actualizarGrafico() {
  if (graficoResumen) {
    graficoResumen.destroy();
  }

  const conteoPorEspecie = registros.reduce((acumulador, personaje) => {
    const especie = catalogoRelacionado.find((item) => item.id === personaje.especieId);
    const nombreEspecie = especie ? especie.nombre : "Desconocida";
    acumulador[nombreEspecie] = (acumulador[nombreEspecie] || 0) + 1;
    return acumulador;
  }, {});

  const etiquetas = Object.keys(conteoPorEspecie);
  const datos = Object.values(conteoPorEspecie);

  graficoResumen = new Chart(dom.grafico, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Personajes",
        data: datos,
        backgroundColor: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f43f5e"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function consultarApiExterna() {
  const nombre = dom.inputApi.value.trim();

  if (!nombre) {
    mostrarError("Escriba un nombre para buscar.");
    return;
  }

  mostrarLoader(true);

  try {
    const respuesta = await fetch(CONFIG.externalSearchUrl + encodeURIComponent(nombre));

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar la API");
    }

    const datos = await respuesta.json();
    datosExternos = Array.isArray(datos.results) ? datos.results : [];
    renderizarResultadosApi(datosExternos);
  } catch (error) {
    console.error(error);
    datosExternos = [];
    renderizarResultadosApi([]);
    mostrarError("No se pudo consultar la API externa.");
  } finally {
    mostrarLoader(false);
  }
}

function renderizarResultadosApi(datos) {
  dom.resultadosApi.innerHTML = "";

  if (datos.length === 0) {
    dom.resultadosApi.innerHTML = `
      <div class="empty-state">
        <h3 class="h5">Sin resultados</h3>
        <p class="mb-0">No se encontraron personajes con esa búsqueda.</p>
      </div>`;
    return;
  }

  datos.forEach((item) => {
    const columna = document.createElement("div");
    columna.className = "col-md-6 col-lg-4";

    const tarjeta = document.createElement("div");
    tarjeta.className = "card h-100";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;
    img.className = "card-img-top";

    const cuerpo = document.createElement("div");
    cuerpo.className = "card-body";

    const titulo = document.createElement("h3");
    titulo.className = "h6";
    titulo.textContent = item.name;

    const texto = document.createElement("p");
    texto.className = "small mb-1";
    texto.textContent = `${item.status} · ${item.species}`;

    const genero = document.createElement("p");
    genero.className = "small text-secondary mb-3";
    genero.textContent = item.gender;

    const botones = document.createElement("div");
    botones.className = "d-flex gap-2 flex-wrap";

    const botonDetalle = document.createElement("button");
    botonDetalle.className = "btn btn-sm btn-outline-primary btn-detalle-api";
    botonDetalle.textContent = "Ver detalle";
    botonDetalle.dataset.id = item.id;

    const botonAgregar = document.createElement("button");
    botonAgregar.className = "btn btn-sm btn-outline-success btn-agregar-api";
    botonAgregar.textContent = "Agregar";
    botonAgregar.dataset.id = item.id;

    botones.append(botonDetalle, botonAgregar);
    cuerpo.append(titulo, texto, genero, botones);
    tarjeta.append(img, cuerpo);
    columna.appendChild(tarjeta);
    dom.resultadosApi.appendChild(columna);
  });
}

async function consultarDetalleExterno(id) {
  mostrarLoader(true);

  try {
    const respuesta = await fetch(CONFIG.externalDetailUrl + id);

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el detalle");
    }

    const detalle = await respuesta.json();
    dom.contenidoModalApi.innerHTML = `
      <p><strong>Nombre:</strong> ${detalle.name}</p>
      <p><strong>Estado:</strong> ${detalle.status}</p>
      <p><strong>Especie:</strong> ${detalle.species}</p>
      <p><strong>Género:</strong> ${detalle.gender}</p>
      <p><strong>Origen:</strong> ${detalle.origin?.name || "Desconocido"}</p>
      <img src="${detalle.image}" alt="${detalle.name}" class="img-fluid rounded mt-3">
    `;
    bootstrap.Modal.getOrCreateInstance(dom.modalApi).show();
  } catch (error) {
    console.error(error);
    mostrarError("No se pudo ver el detalle externo.");
  } finally {
    mostrarLoader(false);
  }
}

function transformarYAgregarExterno(item) {
  const nombreDuplicado = registros.some((registro) =>
    registro.nombre.toLowerCase() === item.name.toLowerCase()
  );

  if (nombreDuplicado) {
    mostrarError("Ese personaje ya existe en el catálogo.");
    return;
  }

  const especieLocal = catalogoRelacionado.find((especie) =>
    especie.nombre.toLowerCase() === (item.species || "").toLowerCase()
  );

  const especieDesconocida = catalogoRelacionado.find((especie) => especie.nombre === "Desconocida");

  const nuevoRegistro = {
    id: generarNuevoId(),
    nombre: item.name,
    especieId: especieLocal ? especieLocal.id : (especieDesconocida ? especieDesconocida.id : 8),
    estado: item.status || "Desconocido",
    genero: item.gender || "Otro",
    origen: item.origin?.name || "Desconocido",
    imagen: item.image || "assets/img/default.svg"
  };

  registros.push(nuevoRegistro);
  guardarEnLocalStorage();
  aplicarBusquedaFiltrosYOrden();
  actualizarIndicadores();
  actualizarTablaEstadisticas();
  actualizarGrafico();
  mostrarToast("Personaje agregado desde la API", "success");
}

function limpiarFiltros() {
  dom.buscador.value = "";
  dom.filtroPrincipal.value = "";
  dom.filtroSecundario.value = "";
  dom.ordenamiento.value = "";
  aplicarBusquedaFiltrosYOrden();
}

function mostrarLoader(visible) {
  dom.loader.classList.toggle("active", visible);
}

function mostrarToast(mensaje, tipo = "info") {
    const colores = {
    success: "#22c55e",
    error: "#ef4444",
    info: "#2563eb"
  };
 
  Toastify({
    text: mensaje,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: { background: colores[tipo] || colores.info }
  }).showToast();
}

function mostrarError(mensaje) {
    Swal.fire({
    title: "Atención",
    text: mensaje,
    icon: "error"
  });
}
