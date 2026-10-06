import { marcarGastoFijoComoPagado } from "../services/mutations";

document.querySelectorAll(".btn-pagar, .btn-devolver").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const conceptoId = target.dataset.conceptoId;
    const gastado = target.classList.contains("btn-pagar");

    if (!conceptoId) return;

    const textoOriginal = target.innerText;
    target.innerText = "...";
    target.disabled = true;

    try {
      await marcarGastoFijoComoPagado(conceptoId, gastado);
      window.location.reload();
    } catch (error: any) {
      console.error("Error al actualizar el gasto fijo:", error);
      alert(
        `Error al ${gastado ? "marcar como pagado" : "devolver"} ${conceptoId}: ${error.message || "Inténtalo de nuevo"}`,
      );
      target.innerText = textoOriginal;
      target.disabled = false;
    }
  });
});
