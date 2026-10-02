import { marcarGastoFijoComoPagado } from "../services/mutations";

document.querySelectorAll(".btn-pagar").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const conceptoId = target.dataset.conceptoId;

    if (!conceptoId) return;

    const textoOriginal = target.innerText;
    target.innerText = "...";
    target.disabled = true;

    try {
      await marcarGastoFijoComoPagado(conceptoId, true);
      window.location.reload();
    } catch (error: any) {
      console.error("Error al pagar:", error);
      alert(
        `Error al marcar como pagado ${conceptoId}: ${error.message || "Inténtalo de nuevo"}`,
      );
      target.innerText = textoOriginal;
      target.disabled = false;
    }
  });
});
