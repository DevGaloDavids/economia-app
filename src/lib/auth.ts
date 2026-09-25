import { supabase } from "./supabase";

// Obtener la sesión actual del usuario
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.error("Error obteniendo sesión:", error.message);
  return session;
}

// Iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Registro de nuevo usuario
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Cerrar sesión
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}