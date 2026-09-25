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