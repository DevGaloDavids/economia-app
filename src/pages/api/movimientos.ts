import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Obtener los últimos 10 movimientos de una categoría
export const GET: APIRoute = async ({ url }) => {
  const categoria = url.searchParams.get('categoria');
  if (!categoria) {
    return new Response(JSON.stringify({ error: 'Categoría requerida' }), { status: 400 });
  }

  const { data, error } = await supabase
    .from('Movimientos')
    .select('*')
    .eq('categoria_id', categoria)
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
    const { id, importe, tipo } = await request.json();

    const { error } = await supabase
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
    const { id } = await request.json();

    const { error } = await supabase
      .from('Movimientos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};