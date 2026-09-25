import { supabase } from "../lib/supabase";

export interface NuevoRegistroCuenta {
  cuenta_id: string;
  origen: string;
  importe: number;
  fecha: string;
  tipo: "Ingreso" | "Gasto";
  conceptp?: string | null;
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
        conceptp: registro.conceptp || null,
      },
    ])
    .select();

  if (error) {
    console.error("Error insertando en Cuentas:", error);
    throw new Error(error.message);
  }

  return data;
}