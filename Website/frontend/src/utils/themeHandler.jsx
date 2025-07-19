import { useEffect } from 'react';
import { useSelector } from 'react-redux';

function ThemeHandler() {
  const { mode } = useSelector((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return null;
}
export default ThemeHandler;