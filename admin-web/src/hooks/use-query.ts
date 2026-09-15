import { useEffect, useRef, useState } from 'react';

/** Bỏ qua phản hồi cũ khi người dùng thay đổi bộ lọc hoặc rời trang. */
export function useQuery<T>(key: string, loader: () => Promise<T>) {
  const currentLoader = useRef(loader);
  currentLoader.current = loader;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setData(null);

    currentLoader
      .current()
      .then((value) => {
        if (active) {
          setData(value);
        }
      })
      .catch((failure: Error) => {
        if (active) {
          setError(failure.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [key, version]);

  return { data, loading, error, reload: () => setVersion((value) => value + 1) };
}
