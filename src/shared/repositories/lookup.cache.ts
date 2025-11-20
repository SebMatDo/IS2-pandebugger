import { db } from '../database/connection';

/**
 * Lookup cache for frequently accessed reference data
 * Matches Python's db.lookup_cache
 */
class LookupCache {
  private actions: Map<string, { id: number; nombre: string }> = new Map();
  private targetTypes: Map<string, { id: number; nombre: string }> = new Map();
  private bookStates: Map<string, { id: number; nombre: string; orden: number }> = new Map();
  private roles: Map<string, { id: number; nombre: string }> = new Map();

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadActions(),
      this.loadTargetTypes(),
      this.loadBookStates(),
      this.loadRoles(),
    ]);
  }

  private async loadActions(): Promise<void> {
    const result = await db.query<{ id: number; nombre: string }>('SELECT id, nombre FROM accion');
    result.rows.forEach(row => {
      this.actions.set(row.nombre.toLowerCase(), row);
    });
  }

  private async loadTargetTypes(): Promise<void> {
    const result = await db.query<{ id: number; nombre: string }>('SELECT id, nombre FROM target_type');
    result.rows.forEach(row => {
      this.targetTypes.set(row.nombre.toLowerCase(), row);
    });
  }

  private async loadBookStates(): Promise<void> {
    const result = await db.query<{ id: number; nombre: string; orden: number }>(
      'SELECT id, nombre, orden FROM estados_libro ORDER BY orden'
    );
    result.rows.forEach(row => {
      this.bookStates.set(row.nombre.toLowerCase(), row);
    });
  }

  private async loadRoles(): Promise<void> {
    const result = await db.query<{ id: number; nombre: string }>('SELECT id, nombre FROM roles');
    result.rows.forEach(row => {
      this.roles.set(row.nombre.toLowerCase(), row);
    });
  }

  // Getters matching Python's lookup_cache attributes
  get accionCrear() {
    return this.actions.get('crear') || this.actions.get('create');
  }

  get accionEditar() {
    return this.actions.get('editar') || this.actions.get('edit');
  }

  get accionEliminar() {
    return this.actions.get('eliminar') || this.actions.get('delete');
  }

  get ttLibro() {
    return this.targetTypes.get('libro') || this.targetTypes.get('book');
  }

  get ttUsuario() {
    return this.targetTypes.get('usuario') || this.targetTypes.get('user');
  }

  get estadoRegistrado() {
    return this.bookStates.get('registrado') || this.bookStates.get('registered');
  }

  getAction(nombre: string) {
    return this.actions.get(nombre.toLowerCase());
  }

  getTargetType(nombre: string) {
    return this.targetTypes.get(nombre.toLowerCase());
  }

  getBookState(nombre: string) {
    return this.bookStates.get(nombre.toLowerCase());
  }

  getRole(nombre: string) {
    return this.roles.get(nombre.toLowerCase());
  }

  getAllBookStates() {
    return Array.from(this.bookStates.values()).sort((a, b) => a.orden - b.orden);
  }

  getAllRoles() {
    return Array.from(this.roles.values());
  }
}

export const lookupCache = new LookupCache();
