import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
/** Reading controls belong to the console, never to the tile hit area. */
export function ReadingControl({children}:{children:ReactNode}) {
  const [dock,setDock]=useState<HTMLElement|null>(null);
  useEffect(()=>setDock(document.getElementById('expedition-reading-controls')),[]);
  return dock ? createPortal(children,dock) : null;
}
