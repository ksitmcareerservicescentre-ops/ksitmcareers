import Link from "next/link";
import Image from "next/image";
import { site } from "@/config/site";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 group perspective-800">
      <Image
        src={site.shield}
        alt="KSITM Logo"
        width={48}
        height={48}
        className="h-12 w-auto transition-all duration-500 transform-gpu group-hover:animate-rotate-3d"
      />
      <span className="text-xl font-extrabold text-white tracking-tight">
        KSITM <span className="text-[#FF7F24]">Careers</span>
      </span>
    </Link>
  );
}
