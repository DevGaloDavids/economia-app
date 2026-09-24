import { supabase } from "../lib/supabase";

// CONFIGURACIONES
const CUENTAS_ULTIMO_SALDO = ["RevolutCP", "RevolutCR", "Axa"];
const ORDEN_CUENTAS = ["RevolutCP", "RevolutCR", "Pulse", "Trade", "Axa"];

// 1. Obtener patrimonio por cuentas
export async function getPatrimonioData() {
  const { data: registrosCuentas } = await supabase
    .from("Cuentas")
    .select("cuenta, importe, fecha, tipo")
    .order("fecha", { ascending: false });

  const cuentasData = registrosCuentas || [];
  const saldosPorCuenta: Record<string, number> = {};

  cuentasData.forEach((reg) => {
    const nombreCuenta = reg.cuenta;
    const cantidad = Number(reg.importe) || 0;
    const tipoLimpio = String(reg.tipo || "").trim().toLowerCase();

    if (CUENTAS_ULTIMO_SALDO.includes(nombreCuenta)) {
      if (saldosPorCuenta[nombreCuenta] === undefined) {
        saldosPorCuenta[nombreCuenta] = cantidad;
      }
    } else {
      if (saldosPorCuenta[nombreCuenta] === undefined) {
        saldosPorCuenta[nombreCuenta] = 0;
      }

      if (tipoLimpio === "ingreso") {
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
    .select("importe, tipo, categoria");

  const listaMovimientos = movimientos || [];

  const balanceMovimientos = listaMovimientos.reduce((acc, mov) => {
    const cantidad = Number(mov.importe) || 0;
    const tipoLimpio = String(mov.tipo || "").trim().toLowerCase();
    return tipoLimpio === "ingreso" ? acc + cantidad : acc - cantidad;
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
    .filter((mov) => String(mov.categoria || "").trim().toLowerCase() === "compras")
    .reduce((acc, mov) => {
      const cantidad = Number(mov.importe) || 0;
      const tipoLimpio = String(mov.tipo || "").trim().toLowerCase();
      return tipoLimpio === "ingreso" ? acc + cantidad : acc - cantidad;
    }, 0);

  return { balanceTotalFinal, disponibleCompras };
}

// 3. Obtener lista de gastos fijos pendientes
export async function getGastosPendientesData() {
  const { data: listaGastosPendientes } = await supabase
    .from("GastosFijos")
    .select("concepto, cantidad")
    .eq("gastado", false);

  return listaGastosPendientes || [];
}

// 5. Obtener los últimos 10 registros de cualquier cuenta
export async function getTarjetaData(nombreCuenta: string) {
  // 1. Obtenemos los registros ordenados por fecha de la cuenta
  const { data: registros } = await supabase
    .from("Cuentas")
    .select("importe, fecha, tipo")
    .eq("cuenta", nombreCuenta)
    .order("fecha", { ascending: false });

  const lista = registros || [];
  if (lista.length === 0) {
    return { saldoActual: 0, historial10: [] };
  }

  const esUltimoSaldo = CUENTAS_ULTIMO_SALDO.includes(nombreCuenta);

  let saldoActual = 0;
  let historial10: { importe: number; fecha: string }[] = [];

  if (esUltimoSaldo) {
    // A) Para RevolutCP, RevolutCR y Axa:
    // El saldo actual es simplemente el importe del registro más reciente (el primero del array descendente)
    saldoActual = Number(lista[0].importe) || 0;

    // Para la gráfica tomamos los últimos 10 registros y los ordenamos cronológicamente
    historial10 = lista.slice(0, 10).reverse().map(reg => ({
      importe: Number(reg.importe) || 0,
      fecha: reg.fecha
    }));

  } else {
    // B) Para Pulse y Trade (Suma/Resta de ingresos y gastos):
    // Calculamos el saldo acumulado total acumulando de más antiguo a más reciente
    const cronologico = [...lista].reverse();
    let saldoAcumulado = 0;

    // Calculamos el historial evolutivo del saldo tras cada movimiento
    const historialEvolucion = cronologico.map((reg) => {
      const cantidad = Number(reg.importe) || 0;
      const tipoLimpio = String(reg.tipo || '').trim().toLowerCase();

      if (tipoLimpio === "ingreso") {
        saldoAcumulado += cantidad;
      } else {
        saldoAcumulado -= cantidad;
      }

      return {
        importe: saldoAcumulado, // Guardamos el saldo resultante en ese momento para pintar la línea
        fecha: reg.fecha
      };
    });

    // El saldo actual será la suma acumulada total
    saldoActual = saldoAcumulado;

    // Tomamos los últimos 10 puntos de la evolución acumulada para la gráfica
    historial10 = historialEvolucion.slice(-10);
  }

  return { saldoActual, historial10 };
}

// 6. Obtener datos para la tarjeta principal de Compras (Restante + Últimos 5 movimientos)
export async function getComprasData() {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("*")
    .order("fecha", { ascending: false });

  const todos = movimientos || [];

  // Filtrado que revisa CUALQUIER campo (categoria, subcategoria, cartera, concepto)
  const movsCompras = todos.filter((m) => {
    const cat = String(m.categoria || "").trim().toLowerCase();
    const subcat = String(m.subcategoria || "").trim().toLowerCase();
    const cartera = String(m.cartera || "").trim().toLowerCase();
    const concepto = String(m.concepto || "").trim().toLowerCase();

    return (
      cat.includes("compra") || cat.includes("casa") ||
      subcat.includes("compra") || subcat.includes("casa") ||
      cartera.includes("compra") || cartera.includes("casa") ||
      concepto.includes("compra") || concepto.includes("casa")
    );
  });

  // Calcular el restante disponible (Ingresos - Gastos)
  const restanteCompras = movsCompras.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    const tipo = String(m.tipo || "").trim().toLowerCase();
    return tipo === "ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  const ultimos5 = movsCompras.slice(0, 5);

  return { restanteCompras, ultimos5 };
}

// 7. Obtener datos para la tarjeta de Transporte (Restante + Desglose por subcategorías)
export async function getTransporteData() {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("importe, tipo, subcategoria, categoria")
    .filter("categoria", "ilike", "transporte");

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
    const tipo = String(m.tipo || "").trim().toLowerCase();
    const subcat = String(m.subcategoria || "").trim().toLowerCase();

    if (tipo === "ingreso") {
      return acc + cantidad;
    } else {
      totalGastos += cantidad;
      // Asignar al grupo correspondiente según la subcategoría
      if (subcat.includes("gasolina")) desgloseGastos.gasolina += cantidad;
      else if (subcat.includes("moto") || subcat.includes("bici")) desgloseGastos.motos_bicis += cantidad;
      else if (subcat.includes("limp")) desgloseGastos.limpiezas += cantidad;
      else desgloseGastos.transporte += cantidad;

      return acc - cantidad;
    }
  }, 0);

  // Calcular porcentajes sobre el total gastado
  const porcentajes = {
    gasolina: totalGastos > 0 ? Math.round((desgloseGastos.gasolina / totalGastos) * 100) : 0,
    transporte: totalGastos > 0 ? Math.round((desgloseGastos.transporte / totalGastos) * 100) : 0,
    motos_bicis: totalGastos > 0 ? Math.round((desgloseGastos.motos_bicis / totalGastos) * 100) : 0,
    limpiezas: totalGastos > 0 ? Math.round((desgloseGastos.limpiezas / totalGastos) * 100) : 0,
  };

  return { restanteTransporte, porcentajes };
}

// 8. Obtener datos para la tarjeta de Barbería (Restante)
export async function getBarberiaData() {
  const { data: movimientos } = await supabase
    .from("Movimientos")
    .select("importe, tipo, categoria")
    .filter("categoria", "ilike", "barberia");

  const movs = movimientos || [];

  const restanteBarberia = movs.reduce((acc, m) => {
    const cantidad = Number(m.importe) || 0;
    const tipo = String(m.tipo || "").trim().toLowerCase();
    return tipo === "ingreso" ? acc + cantidad : acc - cantidad;
  }, 0);

  return { restanteBarberia };
}
