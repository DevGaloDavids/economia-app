import { supabase } from "../lib/supabase";

export interface NuevoRegistroCuenta {
  cuenta_id: string;
  origen: string;
  importe: number;
  fecha: string;
  tipo: "Ingreso" | "Gasto";
  concepto?: string | null;
}

export async function insertRegistroCuenta(registro: NuevoRegistroCuenta) {
  const { data, error } = await supabase
    .from("Cuentas")
    .insert([
      {
        cuenta_id: registro.cuenta_id,
        origen: registro.origen,
        importe: registro.importe,
        fecha: registro.fecha,
        tipo: registro.tipo,
        concepto: registro.concepto || null,
      },
    ])
    .select();

  if (error) {
    console.error("Error insertando en Cuentas:", error);
    throw new Error(error.message);
  }

  return data;
}

export interface NuevoRegistroInversion {
  cuenta_id: string;
  origen: string;
  importe: number;
  fecha: string;
  tipo: "Ingreso" | "Valor";
}

export async function insertRegistroInversion(registro: NuevoRegistroInversion) {
  const { data, error } = await supabase
    .from("Inversiones")
    .insert([
      {
        cuenta_id: registro.cuenta_id,
        Origen: registro.origen,
        importe: registro.importe,
        fecha: registro.fecha,
        tipo: registro.tipo,
      },
    ])
    .select();

  if (error) {
    console.error("Error insertando en Inversiones:", error);
    throw new Error(error.message);
  }

  return data;
}

export interface NuevoMovimiento {
  categoria_id: string;
  subcategoria_id?: string | null;
  tipo: "Ingreso" | "Gasto";
  fecha: string;
  importe: number;
}

export async function insertRegistroMovimiento(movimiento: NuevoMovimiento) {
  const { data, error } = await supabase
    .from("Movimientos")
    .insert([movimiento])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function marcarGastoFijoComoPagado(conceptoId: string, gastado: boolean = true) {
  if (conceptoId === "Pago moto" && gastado) {
    const { data: gastoFijo, error: errorGastoFijo } = await supabase
      .from("GastosFijos")
      .select("cantidad, gastado")
      .eq("concepto_id", conceptoId)
      .maybeSingle();

    if (errorGastoFijo) {
      throw new Error(
        `Error consultando el gasto fijo ${conceptoId}: ${errorGastoFijo.message}`,
      );
    }
    if (!gastoFijo) {
      throw new Error(`No se encontró el gasto fijo ${conceptoId}.`);
    }
    if (gastoFijo.gastado) {
      return [gastoFijo];
    }

    const importe = Number(gastoFijo.cantidad);
    if (!Number.isFinite(importe) || importe <= 0) {
      throw new Error(
        `El importe del gasto fijo ${conceptoId} no es válido.`,
      );
    }

    const { data: movimiento, error: errorMovimiento } = await supabase
      .from("Movimientos")
      .insert({
        importe,
        tipo: "Ingreso",
        categoria_id: "Deuda",
        subcategoria_id: "Moto",
        fecha: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();

    if (errorMovimiento) {
      throw new Error(
        `Error registrando el pago del préstamo de la moto: ${errorMovimiento.message}`,
      );
    }

    const { data, error } = await supabase
      .from("GastosFijos")
      .update({ gastado: true })
      .eq("concepto_id", conceptoId)
      .eq("gastado", false)
      .select();

    if (error || !data?.length) {
      const { error: errorReversion } = await supabase
        .from("Movimientos")
        .delete()
        .eq("id", movimiento.id);

      if (errorReversion) {
        throw new Error(
          `No se pudo marcar el gasto fijo como pagado (${error?.message || "ya estaba pagado"}) ni revertir el movimiento creado: ${errorReversion.message}`,
        );
      }
      if (error) {
        throw new Error(`Error actualizando el gasto fijo ${conceptoId}: ${error.message}`);
      }
      throw new Error(`El gasto fijo ${conceptoId} ya se había marcado como pagado.`);
    }

    return data;
  }

  const { data, error } = await supabase
    .from("GastosFijos")
    .update({ gastado })
    .eq("concepto_id", conceptoId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}