import { AUTHOR } from "@/content/author";

type Platform = (typeof AUTHOR.links)[number]["label"];

/** Font Awesome brand icon and the colour each button turns on hover. Font Awesome is already loaded site-wide. */
const BRAND: Record<Platform, { icon: string; hover: string }> = {
  YouTube: { icon: "fa-youtube", hover: "hover:border-[#ff0000] hover:text-[#ff0000] focus-visible:border-[#ff0000] focus-visible:text-[#ff0000]" },
  Instagram: { icon: "fa-instagram", hover: "hover:border-[#e4405f] hover:text-[#e4405f] focus-visible:border-[#e4405f] focus-visible:text-[#e4405f]" },
  Pinterest: { icon: "fa-pinterest-p", hover: "hover:border-[#bd081c] hover:text-[#bd081c] focus-visible:border-[#bd081c] focus-visible:text-[#bd081c]" },
  Facebook: { icon: "fa-facebook-f", hover: "hover:border-[#1877f2] hover:text-[#1877f2] focus-visible:border-[#1877f2] focus-visible:text-[#1877f2]" },
};

const BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[17px] text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2";

/** Round icon buttons for the author's real profiles, in the same style as the "Summarize with AI" buttons. */
export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`m-0 flex list-none flex-wrap items-center gap-2.5 p-0 ${className}`} aria-label={`${AUTHOR.name} on social media`}>
      {AUTHOR.links.map((l) => (
        <li key={l.href} className="m-0 p-0">
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`${AUTHOR.name} on ${l.label}`}
            title={`${l.label}`}
            className={`${BUTTON} ${BRAND[l.label].hover}`}
          >
            <i className={`fab ${BRAND[l.label].icon}`} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
