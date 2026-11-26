/** Om logo tile (D-033): gold ॐ on the deep-brown hero colour. Decorative. */
export function OmMark({ className = "h-10 w-10 text-2xl" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`hero-dark inline-flex shrink-0 items-center justify-center rounded-xl font-deva leading-none text-[#F3C35B] shadow-elev-1 ${className}`}
    >
      ॐ
    </span>
  );
}
