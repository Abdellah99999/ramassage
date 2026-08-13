import Link from "next/link";

export default function RamassagesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background text-foreground">
      <div>
        <h1 className="text-3xl font-title font-bold text-foreground">Gestion des ramassages</h1>
        <p className="text-hes-textMuted text-sm mt-1.5">Saisie et historique des ramassages effectués chez les clients.</p>
        <div className="hes-ribbon mt-2 mb-6" />
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
          <h2 className="font-title font-bold text-sm text-foreground">Liste des tournées</h2>
          <button className="primary-btn disabled:opacity-50" disabled>
            + Nouveau ramassage
          </button>
        </div>

        <div className="text-hes-textMuted font-mono text-xs text-center py-16 border border-dashed border-border rounded-md">
          Aucun ramassage enregistré aujourd'hui.
        </div>
      </div>
    </div>
  );
}
