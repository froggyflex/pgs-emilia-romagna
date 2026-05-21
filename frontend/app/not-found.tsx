import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <main className="shell">
      <SiteHeader />
      <div className="page">
        <div className="card">
          <div className="card-body">
            <h1>Pagina non trovata</h1>
            <p className="muted">La sezione evento richiesta non è disponibile.</p>
            <Link className="button" href="/">Torna alla home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
