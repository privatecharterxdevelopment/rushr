// app/pro/signals/rules/new/page.tsx
export default function NewSignalRulePage() {
  return (
    <section className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold text-primary">New Signal Rule</h1>
      <p className="text-slate-600">
        Build your alert: jurisdiction, permit types, license status, and delivery method.
      </p>
      <div className="rounded-xl border bg-white p-4">
        {/* TODO: your form goes here */}
        <p className="text-sm text-slate-500">Form placeholder</p>
      </div>
    </section>
  )
}
