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
          <form action={signOutUser}>
            <button className="ghost-button" type="submit">Esci</button>
          </form>
        ) : (
          <form action={signInWithGoogle}>
            <button className="button" type="submit">Accedi con Google</button>
          </form>
        )}
      </nav>
    </header>
  );
}
