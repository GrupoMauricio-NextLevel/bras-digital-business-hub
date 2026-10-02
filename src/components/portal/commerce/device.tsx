/** Molduras de dispositivo em CSS puro (sem imagem). O conteúdo é sempre interface legível, nunca retângulo abstrato. */
export function Tablet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.6rem] bg-[#0b1426] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/15 ${className}`}>
      <div className="overflow-hidden rounded-[1.15rem] bg-white">{children}</div>
    </div>
  );
}

export function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[2.2rem] bg-[#0b1426] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/15 ${className}`}>
      <span aria-hidden className="absolute left-1/2 top-3 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-[#0b1426]" />
      <div className="overflow-hidden rounded-[1.75rem] bg-white">{children}</div>
    </div>
  );
}
