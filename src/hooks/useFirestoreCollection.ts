import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useFirestoreCollection<T>(
  collectionName: string,
  filterField?: string,
  filterValue?: string,
  initialFallbackData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialFallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      const colRef = collection(db, collectionName);
      const q = filterField && filterValue ? query(colRef, where(filterField, '==', filterValue)) : colRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          if (snapshot.empty && initialFallbackData.length > 0) {
            setData(initialFallbackData);
          } else {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
            setData(items.length > 0 ? items : initialFallbackData);
          }
          setLoading(false);
        },
        (err) => {
          console.warn(`[useFirestoreCollection] Warning on ${collectionName}:`, err.message);
          if (isMounted) {
            setData(initialFallbackData);
            setLoading(false);
          }
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e: any) {
      console.warn(`[useFirestoreCollection] Init fallback on ${collectionName}:`, e?.message);
      if (isMounted) {
        setData(initialFallbackData);
        setLoading(false);
      }
    }
  }, [collectionName, filterField, filterValue]);

  return { data, loading, error, setData };
}
