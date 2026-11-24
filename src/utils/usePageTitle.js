import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · VELORA` : 'VELORA · The art of dressing';
  }, [title]);
}
