// src/pages/api/gastos-fijos.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase'; // Ajusta la ruta a tu cliente de Supabase

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('GastosFijos')
      .select('cantidad');

    if (error) {
        console.error("🔴 Error devuelto por Supabase:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalFijos = data ? data.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0) : 0;
    return new Response(JSON.stringify({ totalFijos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};