import { supabase } from "../lib/supabase";
import { formatYearMonth, formatShortMonth } from "../utils/formatters";

// CONFIGURACIONES FIJAS
const CUENTAS_ULTIMO_SALDO = ["Revolut C.P.", "Revolut C.R.", "Axa"];
const ORDEN_CUENTAS = ["Revolut C.P.", "Revolut C.R.", "Pulse", "Trade", "Axa"];

// 1. Obtener patrimonio por cuentas
export async function getPatrimonioData() {
  const { data: registrosCuentas } = await supabase
    .from("Cuentas")
    .select("cuenta_id, importe, fecha, tipo")
    .order("fecha", { ascending: false });

  const cuentasData = registrosCuentas || [];
  const saldosPorCuenta: Record<string, number> = {};

  cuentasData.forEach((reg) => {
    const nombreCuenta = reg.cuenta_id;
    const cantidad = Number(reg.importe) || 0;
    const tipo = reg.tipo;

    if (CUENTAS_ULTIMO_SALDO.includes(nombreCuenta)) {
      if (saldosPorCuenta[nombreCuenta] === undefined) {
        saldosPorCuenta[nombreCuenta] = cantidad;
      }
    } else {
      if (saldosPorCuenta[nombreCuenta] === undefined) {
        saldosPorCuenta[nombreCuenta] = 0;
      }

      if (tipo === "Ingreso") {
        saldosPorCuenta[nombreCuenta] += cantidad;
      } else {
        saldosPorCuenta[nombreCuenta] -= cantidad;
      }
    }
  });

  const listaCuentasDesglose = Object.entries(saldosPorCuenta)
    .map(([nombre, saldo]) => ({ nombre, saldo }))
    .sort((a, b) => {
      const posA = ORDEN_CUENTAS.indexOf(a.nombre);
      const posB = ORDEN_CUENTAS.indexOf(b.nombre);
      return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    });

  const patrimonioTotal = Object.values(saldosPorCuenta).reduce(
    (acc, saldo) => acc + saldo,
    0
  );

  return { patrimonioTotal, listaCuentasDesglose };
}

// 2. Obtener balance total y remanente de compras
export async function getBalanceData() {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("importe, tipo, categoria_id");

  const listaMovimientos = movimientos || [];

  const balanceMovimientos = listaMovimientos.reduce((acc, mov) => {
    const cantidad = Number(mov.importe) || 0;
    return mov.tipo === "Ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  const { data: gastosFijosPendientes } = await supabase
    .from("GastosFijos")
    .select("cantidad")
    .eq("gastado", false);

  const totalGastosFijosPendientes = (gastosFijosPendientes || []).reduce(
    (acc, gf) => acc + (Number(gf.cantidad) || 0),
    0
  );

  const balanceTotalFinal = balanceMovimientos + totalGastosFijosPendientes;

  const disponibleCompras = listaMovimientos
    .filter((mov) => mov.categoria_id === "Compras")
    .reduce((acc, mov) => {
      const cantidad = Number(mov.importe) || 0;
      return mov.tipo === "Ingreso" ? acc + cantidad : acc - cantidad;
    }, 0);

  return { balanceTotalFinal, disponibleCompras };
}

// 3. Obtener lista de gastos fijos pendientes
export async function getGastosPendientesData() {
  const { data: listaGastosPendientes } = await supabase
    .from("GastosFijos")
    .select("concepto_id, cantidad")
    .eq("gastado", false);

  return (listaGastosPendientes || []).map((g) => ({
    concepto: g.concepto_id,
    cantidad: g.cantidad,
  }));
}

// 4. Obtener los últimos 10 registros de cualquier cuenta
export async function getTarjetaData(nombreCuenta: string) {
  const { data: registros } = await supabase
    .from("Cuentas")
    .select("importe, fecha, tipo")
    .eq("cuenta_id", nombreCuenta)
    .order("fecha", { ascending: false });

  const lista = registros || [];
  if (lista.length === 0) {
    return { saldoActual: 0, historial10: [] };
  }

  const esUltimoSaldo = CUENTAS_ULTIMO_SALDO.includes(nombreCuenta);

  let saldoActual = 0;
  let historial10: { importe: number; fecha: string }[] = [];

  if (esUltimoSaldo) {
    saldoActual = Number(lista[0].importe) || 0;

    historial10 = lista.slice(0, 10).reverse().map((reg) => ({
      importe: Number(reg.importe) || 0,
      fecha: reg.fecha,
    }));
  } else {
    const cronologico = [...lista].reverse();
    let saldoAcumulado = 0;

    const historialEvolucion = cronologico.map((reg) => {
      const cantidad = Number(reg.importe) || 0;

      if (reg.tipo === "Ingreso") {
        saldoAcumulado += cantidad;
      } else {
        saldoAcumulado -= cantidad;
      }

      return {
        importe: saldoAcumulado,
        fecha: reg.fecha,
      };
    });

    saldoActual = saldoAcumulado;
    historial10 = historialEvolucion.slice(-10);
  }

  return { saldoActual, historial10 };
}

// 5. Obtener datos para la tarjeta principal de Compras
export async function getComprasData() {
  const { data: movsCompras } = await supabase
    .from("Movimientos")
    .select("*")
    .eq("categoria_id", "Compras")
    .order("fecha", { ascending: false });

  const todos = movsCompras || [];

  const restanteCompras = todos.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    return m.tipo === "Ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  const ultimos5 = todos.slice(0, 5);

  return { restanteCompras, ultimos5 };
}

// 6. Obtener datos para la tarjeta de Transporte (Desglose por subcategorías exactas)
export async function getTransporteData() {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("importe, tipo, subcategoria_id")
    .eq("categoria_id", "Transporte");

  const movs = movimientos || [];

  let totalGastos = 0;
  const desgloseGastos: Record<string, number> = {
    gasolina: 0,
    transporte: 0,
    motos_bicis: 0,
    limpiezas: 0,
  };

  const restanteTransporte = movs.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    const subcat = m.subcategoria_id;

    if (m.tipo === "Ingreso") {
      return acc + cantidad;
    } else {
      totalGastos += cantidad;

      if (subcat === "Gasolina") desgloseGastos.gasolina += cantidad;
      else if (subcat === "Bici/moto" || subcat === "Motos/bicis") desgloseGastos.motos_bicis += cantidad;
      else if (subcat === "Limpieza/aire") desgloseGastos.limpiezas += cantidad;
      else desgloseGastos.transporte += cantidad;

      return acc - cantidad;
    }
  }, 0);

  const porcentajes = {
    gasolina: totalGastos > 0 ? Math.round((desgloseGastos.gasolina / totalGastos) * 100) : 0,
    transporte: totalGastos > 0 ? Math.round((desgloseGastos.transporte / totalGastos) * 100) : 0,
    motos_bicis: totalGastos > 0 ? Math.round((desgloseGastos.motos_bicis / totalGastos) * 100) : 0,
    limpiezas: totalGastos > 0 ? Math.round((desgloseGastos.limpiezas / totalGastos) * 100) : 0,
  };

  return { restanteTransporte, porcentajes };
}

// 7. Obtener datos para la tarjeta de Barbería
export async function getBarberiaData() {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("importe, tipo")
    .eq("categoria_id", "Barberia");

  const movs = movimientos || [];

  const restanteBarberia = movs.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    return m.tipo === "Ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  return { restanteBarberia };
}

// 8. Función genérica para servicios con gráfico de 6 meses (Luz, Agua, etc.)
async function getServicioData(nombreCategoria: string) {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("*")
    .eq("categoria_id", nombreCategoria)
    .order("fecha", { ascending: false });

  const movs = movimientos || [];

  const restante = movs.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    return m.tipo === "Ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  const now = new Date();
  const ultimos6Meses: { key: string; label: string; gasto: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ultimos6Meses.push({
      key: formatYearMonth(d),
      label: formatShortMonth(d),
      gasto: 0,
    });
  }

  movs.forEach((m) => {
    if (!m.fecha) return;

    const fechaStr = String(m.fecha);
    const match = fechaStr.match(/^(\d{4})-(\d{2})/);
    const key = match ? `${match[1]}-${match[2]}` : formatYearMonth(new Date(m.fecha));

    if (m.tipo !== "Ingreso") {
      const mesObj = ultimos6Meses.find((item) => item.key === key);
      if (mesObj) {
        mesObj.gasto += Number(m.importe) || 0;
      }
    }
  });

  const maxGasto = Math.max(...ultimos6Meses.map((m) => m.gasto), 1);

  const historiaGrafica = ultimos6Meses.map((m) => ({
    label: m.label,
    gasto: m.gasto,
    porcentajeAltura: Math.round((m.gasto / maxGasto) * 100),
  }));

  return { restante, historiaGrafica };
}

// 9. Datos específicos para Luz
export async function getLuzData() {
  return await getServicioData("Luz");
}

// 10. Datos específicos para Agua
export async function getAguaData() {
  return await getServicioData("Agua");
}

// 11. Auxiliar para obtener el saldo (Ingresos - Gastos) de cualquier categoría exacta
export async function getAcumuladoData(nombreCategoria: string) {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("importe, tipo")
    .eq("categoria_id", nombreCategoria);

  const movs = movimientos || [];

  const restante = movs.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    return m.tipo === "Ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  return { restante };
}

// 12. Obtener estado de Gastos Fijos reales desde Supabase
export async function getGastosFijosData() {
  const { data: gastosFijos, error } = await supabase
    .from("GastosFijos")
    .select("concepto_id, cantidad, gastado, clase");

  if (error) {
    console.error("Error al obtener gastos fijos:", error);
  }

  const lista = gastosFijos || [];

  const estadoGastosFijos = lista.map((g) => ({
    concepto: String(g.concepto_id || ""),
    importeReal: Number(g.cantidad) || 0,
    pagado: Boolean(g.gastado),
    categoria: String(g.clase || "Otros"),
  }));

  const totalEstimado = estadoGastosFijos.reduce((acc, g) => acc + g.importeReal, 0);
  const totalPagado = estadoGastosFijos.filter((g) => g.pagado).reduce((acc, g) => acc + g.importeReal, 0);
  const pendiente = totalEstimado - totalPagado;

  return { estadoGastosFijos, totalEstimado, totalPagado, pendiente };
}