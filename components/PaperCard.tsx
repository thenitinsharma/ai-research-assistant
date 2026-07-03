import EntityTag from "./EntityTag";
import type { SearchResult } from "@/lib/api";

export default function PaperCard({ paper, index }: { paper: SearchResult; index: number }) {
  const relevance = Math.round(paper.score * 100);

  return (
    <article className="index-card p-6 mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="access-no mb-1">ACCESSION No. {String(index + 1).padStart(3, "0")}</p>
          <h3 className="font-serif text-lg leading-snug text-ink">{paper.title.trim()}</h3>
        </div>
        <span className="stamp shrink-0 mt-1">{relevance}% MATCH</span>
      </div>

      <p className="text-sm text-ink-muted leading-relaxed mb-4">{paper.summary}</p>

      {paper.keywords?.length > 0 && (
        <div className="pt-3 border-t hairline">
          <p className="access-no mb-2">CATALOGUED TERMS</p>
          <div className="flex flex-wrap gap-2">
            {paper.keywords.map((k, i) => (
              <EntityTag key={i} keyword={k.keyword} entityType={k.entity_type} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
