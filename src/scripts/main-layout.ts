const topNavigation = document.querySelector<HTMLElement>(
  "[data-top-navigation]",
);

if (topNavigation) {
  const storageKey = "top-navigation-scroll-left";
  const savedScrollLeft = sessionStorage.getItem(storageKey);
  const parsedScrollLeft = Number(savedScrollLeft);

  if (savedScrollLeft !== null && Number.isFinite(parsedScrollLeft)) {
    topNavigation.scrollLeft = parsedScrollLeft;
  }

  const saveScrollPosition = () => {
    sessionStorage.setItem(storageKey, String(topNavigation.scrollLeft));
  };

  topNavigation.addEventListener("scroll", saveScrollPosition, {
    passive: true,
  });
  topNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", saveScrollPosition);
  });
}

const actualizarPrivacidadGlobal = () => {
  const iconoPrivacidad = document.getElementById("icono-privacidad-global");
  const montosPrivados = document.querySelectorAll(".monto-privado");
  const modoOculto = localStorage.getItem("modo_privado") === "true";

  montosPrivados.forEach((el) => {
    const elemento = el as HTMLElement;
    const valorReal = elemento.getAttribute("data-valor") || "0,00 €";
    elemento.textContent = modoOculto ? "•••••• €" : valorReal;
  });

  if (iconoPrivacidad) {
    iconoPrivacidad.textContent = modoOculto ? "🙈" : "👁️";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  actualizarPrivacidadGlobal();

  const btnPrivacidad = document.getElementById("btn-privacidad-global");
  btnPrivacidad?.addEventListener("click", () => {
    const modoOcultoActual = localStorage.getItem("modo_privado") === "true";
    localStorage.setItem("modo_privado", String(!modoOcultoActual));
    actualizarPrivacidadGlobal();
  });

  const btnMas = document.getElementById("btn-nav-mas");
  const btnActualizar = document.getElementById("btn-nav-actualizar");
  const btnReparto = document.getElementById("btn-nav-reinicio");

  const modalMovimiento = document.getElementById("modal-nuevo-movimiento");
  const modalCuenta = document.getElementById("modal-actualizar-cuenta");
  const modalReparto = document.getElementById("modal-reparto");

  btnMas?.addEventListener("click", (e) => {
    e.stopPropagation();
    modalMovimiento?.classList.remove("hidden");
  });

  btnActualizar?.addEventListener("click", (e) => {
    e.stopPropagation();
    modalCuenta?.classList.remove("hidden");
  });

  btnReparto?.addEventListener("click", (e) => {
    e.stopPropagation();
    modalReparto?.classList.remove("hidden");
  });
});
