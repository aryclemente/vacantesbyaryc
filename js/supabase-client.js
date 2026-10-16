/**
 * supabase-client.js - Módulo de conexión e identidad con Supabase Cloud
 * Maneja credenciales, autenticación de usuario y suscripción a eventos en tiempo real.
 */

const SUPABASE_CONFIG_KEY = 'aryc_supabase_config';
const DEFAULT_SUPABASE_URL = 'https://mlvqbdanzazqmbbmwend.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_la-NdXdQxPpE-Uv9OfN6dw_111os5iD';

class SupabaseService {
  constructor() {
    this.client = null;
    this.currentUser = null;
    this.currentSession = null;
    this.authListeners = [];
    this.realtimeChannel = null;
    this.init();
  }

  /**
   * Carga la configuración guardada o inicializa el cliente con valores por defecto
   */
  init() {
    const config = this.getConfig();
    if (config && config.url && config.anonKey) {
      this.initClient(config.url, config.anonKey);
    }
  }

  /**
   * Devuelve las credenciales almacenadas o las predeterminadas del proyecto
   */
  getConfig() {
    try {
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        url: parsed.url || DEFAULT_SUPABASE_URL,
        anonKey: parsed.anonKey || DEFAULT_SUPABASE_ANON_KEY
      };
    } catch (e) {
      console.error('Error al leer credenciales de Supabase:', e);
      return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
    }
  }

  /**
   * Guarda o actualiza las credenciales de conexión
   */
  saveConfig(url, anonKey) {
    const cleanUrl = (url || '').trim().replace(/\/$/, '');
    const cleanKey = (anonKey || '').trim();
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
    return this.initClient(cleanUrl, cleanKey);
  }

  /**
   * Inicializa la instancia del SDK de Supabase
   */
  initClient(url, anonKey) {
    if (!url || !anonKey) {
      this.client = null;
      return false;
    }

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('Librería de Supabase no disponible aún en window.supabase');
      return false;
    }

    try {
      this.client = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      // Escuchar cambios de sesión
      this.client.auth.onAuthStateChange((event, session) => {
        this.currentSession = session;
        this.currentUser = session?.user || null;
        this.notifyAuthListeners(event, session);
      });

      // Recuperar sesión activa inicial
      this.client.auth.getSession().then(({ data: { session } }) => {
        this.currentSession = session;
        this.currentUser = session?.user || null;
        this.notifyAuthListeners('INITIAL_SESSION', session);
      });

      return true;
    } catch (e) {
      console.error('Error al inicializar cliente de Supabase:', e);
      this.client = null;
      return false;
    }
  }

  /**
   * Verifica si el cliente está conectado y configurado
   */
  isConfigured() {
    return Boolean(this.client);
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  getUser() {
    return this.currentUser;
  }

  /**
   * Registro con correo y contraseña
   */
  async signUp(email, password) {
    if (!this.client) throw new Error('Supabase no está configurado');
    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  /**
   * Inicio de sesión con correo y contraseña
   */
  async signIn(email, password) {
    if (!this.client) throw new Error('Supabase no está configurado');
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  /**
   * Inicio de sesión con Magic Link (sin contraseña)
   */
  async signInWithOtp(email) {
    if (!this.client) throw new Error('Supabase no está configurado');
    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
    return data;
  }

  /**
   * Cerrar sesión
   */
  async signOut() {
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.currentUser = null;
    this.currentSession = null;
    this.notifyAuthListeners('SIGNED_OUT', null);
  }

  /**
   * Suscribirse a cambios en el estado de autenticación
   */
  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.authListeners.push(callback);
      if (this.currentUser) {
        callback('CURRENT_STATE', this.currentSession);
      }
    }
  }

  notifyAuthListeners(event, session) {
    this.authListeners.forEach(cb => {
      try {
        cb(event, session);
      } catch (e) {
        console.error('Error en callback de autenticación:', e);
      }
    });
  }

  /**
   * Conectar a cambios de datos en tiempo real
   */
  subscribeToChanges(onInsert, onUpdate, onDelete) {
    if (!this.client || !this.currentUser) return null;

    if (this.realtimeChannel) {
      this.client.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.client
      .channel('vacantes-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vacantes',
        filter: `user_id=eq.${this.currentUser.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new);
        if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new);
        if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old);
      })
      .subscribe();

    return this.realtimeChannel;
  }
}

window.appSupabase = new SupabaseService();
