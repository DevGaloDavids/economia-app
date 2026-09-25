import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { ahorroTrade, seQuedaRevolut, gastosVariables } = data;
    
    // Fecha actual YYYY-MM-DD
    const fechaHoy = new Date().toISOString().split('T')[0];

    // 1. INGRESO EN CUENTAS -> Trade
    if (ahorroTrade > 0) {
      const { error: errTrade } = await supabase
        .from('Cuentas')
        .insert({
          origen: 'Personal',
          importe: ahorroTrade,
          fecha: fechaHoy,
          tipo: 'Ingreso',
          cuenta_id: 'Trade'
        });

      if (errTrade) throw new Error(`Error en Trade: ${errTrade.message}`);
    }

    // 2. INGRESOS EN MOVIMIENTOS -> Categorías Variables
    const mapaCategorias: Record<string, string> = {
      compras: 'Compras',
      luz: 'Luz',
      agua: 'Agua',
      transporte: 'Transporte',
      seguros: 'Seguros',
      lentillas: 'Lentillas',
      limpieza: 'Limpieza',
      barberia: 'Barberia',
    };

    const insertsMovimientos = Object.entries(gastosVariables)
      .filter(([_, valor]) => Number(valor) > 0)
      .map(([clave, valor]) => ({
        fecha: fechaHoy,
        tipo: 'Ingreso',
        categoria_id: mapaCategorias[clave] || clave,
        subcategoria_id: null,
        importe: Number(valor)
      }));

    if (insertsMovimientos.length > 0) {
      const { error: errMov } = await supabase
        .from('Movimientos')
        .insert(insertsMovimientos);

      if (errMov) throw new Error(`Error en Movimientos: ${errMov.message}`);
    }

    // 3. RESETEAR GASTOS FIJOS -> gastado = FALSE
    const { error: errGastosFijos } = await supabase
      .from('GastosFijos')
      .update({ gastado: false })
      .neq('concepto_id', '');

    if (errGastosFijos) throw new Error(`Error en GastosFijos: ${errGastosFijos.message}`);

    // 4. INGRESO EN CUENTAS -> Revolut C.P. (Acumulando saldo)
    const { data: ultimoRevolut, error: errUltimo } = await supabase
      .from('Cuentas')
      .select('importe')
      .eq('cuenta_id', 'Revolut C.P.')
      .order('fecha', { ascending: false })
      .limit(1);

    if (errUltimo) throw new Error(`Error consultando Revolut: ${errUltimo.message}`);

    const saldoAnterior = ultimoRevolut && ultimoRevolut.length > 0 ? Number(ultimoRevolut[0].importe) : 0;
    const nuevoSaldoRevolut = saldoAnterior + Number(seQuedaRevolut);

    const { error: errRevolut } = await supabase
      .from('Cuentas')
      .insert({
        origen: 'Personal',
        importe: nuevoSaldoRevolut,
        fecha: fechaHoy,
        tipo: 'Ingreso',
        cuenta_id: 'Revolut C.P.'
      });

    if (errRevolut) throw new Error(`Error en Revolut C.P.: ${errRevolut.message}`);

    return new Response(JSON.stringify({ success: true, message: 'Reparto completado con éxito' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};