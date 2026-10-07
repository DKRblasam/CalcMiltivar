const paleta = [
  "#0000ff", "#2244ff", "#2288ff", "#22ccff", "#22cc88",
  "#22cc44", "#88cc22", "#cccc22", "#ff8822", "#ff0000",
];

const Z_LIMITE_MIN = -99.46;
const Z_LIMITE_MAX = 99.99;
const TAM = 10;

// null = celda sin valor todavía
const puntos = new Array(TAM * TAM).fill(null);

const grid = document.querySelector("#raster-grid");
const rangos = document.querySelectorAll(".pal-color");
const lectura = document.querySelector("#lectura");

const inputX = document.querySelector("#cx");
const inputY = document.querySelector("#cy");
const inputZ = document.querySelector("#cz");
const statMin = document.querySelector("#stat-zmin");
const statMax = document.querySelector("#stat-zmax");

// Las 100 celdas se crean aquí; hay que hacerlo antes de guardarlas en una lista
for (let i = 0; i < TAM * TAM; i++) {
  const div = document.createElement("div");
  div.className = "color";
  div.dataset.index = i;
  grid.appendChild(div);
}
const celdas = grid.querySelectorAll(".color");

function indiceDe(x, y) {
  return (y - 1) * TAM + (x - 1);
}

function limitesGlobales() {
  let min = Infinity;
  let max = -Infinity;
  for (const p of puntos) {
    if (!p) continue;
    if (p.z < min) min = p.z;
    if (p.z > max) max = p.z;
  }
  return min === Infinity ? null : { min, max };
}

function colorPara(z, min, max) {
  if (max === min) return paleta[0];
  const i = Math.floor(((z - min) / (max - min)) * paleta.length);
  return paleta[Math.min(i, paleta.length - 1)];
}

function actualizarLeyenda(lim) {
  rangos.forEach((el, i) => {
    el.style.backgroundColor = paleta[i];
    const texto = el.querySelector("p");
    if (!lim) {
      texto.textContent = "Sin datos";
      return;
    }
    const paso = (lim.max - lim.min) / paleta.length;
    const desde = lim.min + paso * i;
    const hasta = i === paleta.length - 1 ? lim.max : desde + paso;
    texto.textContent = `${desde.toFixed(2)} a ${hasta.toFixed(2)}`;
  });
}

// El min/max global cambia con cada punto, así que se repinta todo
function renderizar() {
  const lim = limitesGlobales();

  puntos.forEach((p, i) => {
    celdas[i].style.backgroundColor = p ? colorPara(p.z, lim.min, lim.max) : "";
  });

  statMin.textContent = lim ? lim.min.toFixed(2) : "-";
  statMax.textContent = lim ? lim.max.toFixed(2) : "-";
  actualizarLeyenda(lim);
}

function describir(i) {
  const x = (i % TAM) + 1;
  const y = Math.floor(i / TAM) + 1;
  const p = puntos[i];
  return p
    ? `x ${x}, y ${y}   z = ${p.z.toFixed(2)}`
    : `x ${x}, y ${y}   sin valor`;
}

function guardarPunto() {
  const x = Number(inputX.value);
  const y = Number(inputY.value);

  if (inputZ.value.trim() === "") {
    alert("Escribe un valor para Z.");
    return;
  }
  const z = Math.round(Number(inputZ.value) * 100) / 100;

  if (!Number.isInteger(x) || x < 1 || x > TAM) {
    alert("X debe ser un entero entre 1 y 10.");
    return;
  }
  if (!Number.isInteger(y) || y < 1 || y > TAM) {
    alert("Y debe ser un entero entre 1 y 10.");
    return;
  }
  if (!Number.isFinite(z) || z < Z_LIMITE_MIN || z > Z_LIMITE_MAX) {
    alert(`Z debe estar entre ${Z_LIMITE_MIN} y ${Z_LIMITE_MAX}.`);
    return;
  }

  puntos[indiceDe(x, y)] = { x, y, z };
  renderizar();
}

function llenarAlAzar() {
  for (let y = 1; y <= TAM; y++) {
    for (let x = 1; x <= TAM; x++) {
      const z = Z_LIMITE_MIN + Math.random() * (Z_LIMITE_MAX - Z_LIMITE_MIN);
      puntos[indiceDe(x, y)] = { x, y, z: Math.round(z * 100) / 100 };
    }
  }
  renderizar();
}

function vaciar() {
  puntos.fill(null);
  renderizar();
}

document.querySelector("#btn-add").addEventListener("click", guardarPunto);
document.querySelector("#btn-random").addEventListener("click", llenarAlAzar);
document.querySelector("#btn-clear").addEventListener("click", vaciar);

[inputX, inputY, inputZ].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarPunto();
  });
});

// Hover: muestra el valor de la celda debajo de la cuadrícula
grid.addEventListener("mouseover", (e) => {
  if (!e.target.classList.contains("color")) return;
  lectura.textContent = describir(Number(e.target.dataset.index));
});

grid.addEventListener("mouseleave", () => {
  lectura.textContent = "Pasa el cursor sobre una celda.";
});

// Clic: carga X, Y (y Z si ya existe) en el formulario para editar rápido
grid.addEventListener("click", (e) => {
  if (!e.target.classList.contains("color")) return;
  const i = Number(e.target.dataset.index);

  inputX.value = (i % TAM) + 1;
  inputY.value = Math.floor(i / TAM) + 1;
  inputZ.value = puntos[i] ? puntos[i].z : "";
  inputZ.focus();

  celdas.forEach((c) => c.classList.remove("elegida"));
  e.target.classList.add("elegida");
});

renderizar();