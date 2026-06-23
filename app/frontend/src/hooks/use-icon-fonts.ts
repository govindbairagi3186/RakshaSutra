import { useState, useEffect } from "react";
import * as Font from "expo-font";

export function useIconFonts(): [boolean, Error | null] {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Font.loadAsync({
          // Add fonts here if you have them, e.g.
          // 'MaterialIcons': require('../../assets/fonts/MaterialIcons.ttf')
        });
        if (mounted) setLoaded(true);
      } catch (e: any) {
        if (mounted) setError(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return [loaded, error];
}
