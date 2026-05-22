import Image from "next/image";
import Link from "next/link";
import { isAdminEmail, safeAuth } from "@/auth";
import { signInWithGoogle, signOutUser } from "@/app/actions";
import { isAuthBypassed } from "@/lib/auth-flags";

export async function SiteHeader() {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await safeAuth();
  const isAdmin = bypassAuth || isAdminEmail(session?.user?.email);

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <Image src="/assets/pgs-emilia-romagna.png" width={96} height={96} alt="PGS Emilia-Romagna" />
        <span>PGS Eventi Live</span>
      </Link>
      <nav className="nav" aria-label="Navigazione principale">
        <Link href="/events/don-bosco-cup-2026">Evento</Link>
        {isAdmin ? <Link href="/admin">Admin</Link> : null}
        {bypassAuth ? (
          <span className="status">Auth bypass</span>
        ) : session?.user ? (
          <>
            <span className="profile-chip" title={session.user.email || session.user.name || "Profilo"}>
              <span className="profile-avatar">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" />
                ) : (
                  getInitials(session.user.name, session.user.email)
                )}
              </span>
              <span className="profile-name">{session.user.name || session.user.email}</span>
            </span>
            <form action={signOutUser}>
              <button className="ghost-button" type="submit">Esci</button>
            </form>
          </>
        ) : (
          <form action={signInWithGoogle}>
            <button className="button" type="submit">Accedi con Google</button>
          </form>
        )}
      </nav>
    </header>
  );
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "U";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return initials || "U";
}
