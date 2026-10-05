import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Obtener los últimos 10 movimientos de una categoría
export const GET: APIRoute = async ({ url }) => {
  const categoria = url.searchParams.get('categoria');
  const cuenta = url.searchParams.get('cuenta');
  if (Boolean(categoria) === Boolean(cuenta)) {
    return new Response(JSON.stringify({ error: 'Categoría requerida' }), { status: 400 });
  }

  const { data, error } = cuenta
    ? await supabase
        .from('Cuentas')
        .select('*')
        .eq('cuenta_id', cuenta)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)
    : await supabase
        .from('Movimientos')
        .select('*')
        .eq('categoria_id', categoria ?? '')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};

// PUT: Actualizar importe de un movimiento
export const PUT: APIRoute = async ({ request }) => {
  try {
    const { id, importe, tipo, tipoRegistro = 'categoria' } = await request.json();
    if (tipoRegistro !== 'categoria' && tipoRegistro !== 'cuenta') {
      return new Response(JSON.stringify({ error: 'Tipo de registro no válido' }), { status: 400 });
    }

    const { error } = tipoRegistro === 'cuenta'
      ? await supabase
          .from('Cuentas')
          .update({ importe: Number(importe), tipo })
          .eq('id', id)
      : await supabase
          .from('Movimientos')
          .update({ importe: Number(importe), tipo })
          .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// DELETE: Eliminar un movimiento por ID
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id, tipoRegistro = 'categoria' } = await request.json();
    if (tipoRegistro !== 'categoria' && tipoRegistro !== 'cuenta') {
      return new Response(JSON.stringify({ error: 'Tipo de registro no válido' }), { status: 400 });
    }

    const { error } = tipoRegistro === 'cuenta'
      ? await supabase
          .from('Cuentas')
          .delete()
          .eq('id', id)
      : await supabase
          .from('Movimientos')
          .delete()
          .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};