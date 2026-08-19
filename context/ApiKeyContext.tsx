import React, { createContext, useContext, useEffect, useState } from 'react';
import { getApiKey, setApiKey as storeApiKey } from '../lib/storage';

type ApiKeyContextValue = {
  apiKey: string | null;
  setApiKey: (k: string) => Promise<void>;
  ready: boolean;
};

const ApiKeyContext = createContext<ApiKeyContextValue>({
  apiKey: null,
  setApiKey: async () => {},
  ready: false,
});

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [apiKey, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getApiKey()
      .then((k) => {
        if (mounted) setKey(k);
      })
      .catch((e) => console.warn('ApiKeyProvider load failed', e))
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setApiKey = async (k: string) => {
    await storeApiKey(k);
    setKey(k);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, ready }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextValue => useContext(ApiKeyContext);
