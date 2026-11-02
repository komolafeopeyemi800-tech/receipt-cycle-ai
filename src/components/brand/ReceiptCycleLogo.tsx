import { Link } from "react-router-dom";

const LOGO_SRC = "/icon-64.webp";

type Props = {
  /** Pixel size for the circular mark (default 36). */
  size?: number;
  /** Show wordmark next to the icon. */
  showText?: boolean;
  className?: string;
};

/** The same app mark, sized for the public header and footer. */
export function ReceiptCycleLogo({ size = 36, showText = true, className = "" }: Props) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-display font-bold tracking-tight text-slate-900 ${className}`}>
      <img
        src={LOGO_SRC}
        width={size}
        height={size}
        alt="Receipt Cycle"
        className="shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5"
      />
      {showText ? <span>Receipt Cycle</span> : null}
    </Link>
  );
}
