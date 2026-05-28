import { FEATURE_META } from "@/lib/features";
import { Badge } from "@/components/ui/badge";

export function FeatureGlossary() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Column</th>
            <th className="px-4 py-3 font-semibold">What it captures</th>
            <th className="px-4 py-3 font-semibold">Example question</th>
            <th className="px-4 py-3 font-semibold">Encoding</th>
          </tr>
        </thead>
        <tbody>
          {FEATURE_META.map((f, i) => (
            <tr key={f.key} className={i % 2 ? "bg-muted/20" : ""}>
              <td className="px-4 py-3 align-top">
                <div className="font-medium">{f.label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{f.key}</div>
              </td>
              <td className="px-4 py-3 align-top text-foreground/80">{f.description}</td>
              <td className="px-4 py-3 align-top italic text-muted-foreground">{f.example}</td>
              <td className="px-4 py-3 align-top">
                {f.encoding === "binary" ? (
                  <Badge variant="outline">0 / 1</Badge>
                ) : (
                  <Badge variant="secondary">Likert or 0/1</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
