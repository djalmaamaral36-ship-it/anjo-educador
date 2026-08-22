/**
 * indexedDB.ts
 * Implementação de fila local resiliente com IndexedDB para o Anjo Cuidador.
 * Mantém os registros capturados offline seguros no dispositivo do cuidador.
 */

export interface ItemFilaOffline {
  id_local: string;
  idoso_id: string;
  cuidador_id: string;
  atividade_id: string; // id correspondente de remédio/rotina/etc
  tipo: 'medicacao' | 'alimentacao' | 'hidratacao' | 'banho' | 'sinal_vital' | 'outros';
  titulo: string;
  status: 'realizado' | 'recusado' | 'atrasado';
  horario_planejado: string; // "HH:MM"
  horario_registrado_dispositivo: string; // ISO String do momento exato do toque
  horario_sincronizado_servidor?: string; // ISO String de quando subiu para o servidor
  observacao: string;
  modo_registro: 'online' | 'offline';
  status_sincronizacao: 'pendente' | 'sincronizado';
}

const DB_NAME = 'AnjoCuidadorLocalDB';
const DB_VERSION = 1;
const STORE_NAME = 'fila_offline';

/**
 * Inicializa de forma segura o banco de dados IndexedDB
 */
export function initOfflineDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('⚠️ IndexedDB não é suportado neste navegador. Utilizando fallback local.');
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id_local' });
          console.log(`✅ ObjectStore "${STORE_NAME}" criada com sucesso no IndexedDB.`);
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        console.error('❌ Erro ao abrir IndexedDB:', event.target.error);
        resolve(null);
      };
    } catch (e) {
      console.error('❌ Exceção ao abrir IndexedDB:', e);
      resolve(null);
    }
  });
}

/**
 * Adiciona um item na fila de sincronização offline (IndexedDB)
 */
export async function adicionarItemFila(item: ItemFilaOffline): Promise<boolean> {
  const db = await initOfflineDB();
  if (!db) {
    // Fallback para LocalStorage se o IndexedDB falhar ou não estiver disponível
    try {
      const filaLocalStorage = JSON.parse(localStorage.getItem('anjo_fila_offline_fallback') || '[]');
      filaLocalStorage.push(item);
      localStorage.setItem('anjo_fila_offline_fallback', JSON.stringify(filaLocalStorage));
      return true;
    } catch (e) {
      return false;
    }
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (err) => {
        console.error('❌ Erro ao salvar na fila do IndexedDB:', err);
        resolve(false);
      };
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Retorna todos os itens pendentes de sincronização
 */
export async function obterItensPendentes(): Promise<ItemFilaOffline[]> {
  const db = await initOfflineDB();
  if (!db) {
    try {
      const local = JSON.parse(localStorage.getItem('anjo_fila_offline_fallback') || '[]');
      return local.filter((x: ItemFilaOffline) => x.status_sincronizacao === 'pendente');
    } catch (e) {
      return [];
    }
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event: any) => {
        const todos = event.target.result as ItemFilaOffline[];
        resolve(todos.filter(item => item.status_sincronizacao === 'pendente'));
      };

      request.onerror = () => {
        resolve([]);
      };
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Retorna o histórico de itens offline já sincronizados no aparelho para fins de auditoria
 */
export async function obterItensSincronizados(): Promise<ItemFilaOffline[]> {
  const db = await initOfflineDB();
  if (!db) {
    try {
      const local = JSON.parse(localStorage.getItem('anjo_fila_offline_fallback') || '[]');
      return local.filter((x: ItemFilaOffline) => x.status_sincronizacao === 'sincronizado');
    } catch (e) {
      return [];
    }
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event: any) => {
        const todos = event.target.result as ItemFilaOffline[];
        resolve(todos.filter(item => item.status_sincronizacao === 'sincronizado'));
      };

      request.onerror = () => {
        resolve([]);
      };
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Sincroniza um item marcando-o como sincronizado e definindo o carimbo de data/hora do servidor
 */
export async function atualizarStatusSincronizado(idLocal: string, servidorTime: string): Promise<boolean> {
  const db = await initOfflineDB();
  if (!db) {
    try {
      const local = JSON.parse(localStorage.getItem('anjo_fila_offline_fallback') || '[]');
      const atualizados = local.map((x: ItemFilaOffline) => {
        if (x.id_local === idLocal) {
          return {
            ...x,
            status_sincronizacao: 'sincronizado' as const,
            horario_sincronizado_servidor: servidorTime
          };
        }
        return x;
      });
      localStorage.setItem('anjo_fila_offline_fallback', JSON.stringify(atualizados));
      return true;
    } catch (e) {
      return false;
    }
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(idLocal);

      getRequest.onsuccess = (event: any) => {
        const item = event.target.result as ItemFilaOffline;
        if (item) {
          item.status_sincronizacao = 'sincronizado';
          item.horario_sincronizado_servidor = servidorTime;
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => resolve(false);
        } else {
          resolve(false);
        }
      };

      getRequest.onerror = () => {
        resolve(false);
      };
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Limpa todo o histórico local se desejado
 */
export async function limparBancoOfflineSync(): Promise<boolean> {
  const db = await initOfflineDB();
  if (!db) {
    localStorage.removeItem('anjo_fila_offline_fallback');
    return true;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}
