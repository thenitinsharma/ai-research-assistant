const COLOR_MAP: Record<string, string> = {
  "Programming Language": "bg-[#EDE7DA] text-[#6B5A2A]",
  Framework: "bg-[#DCE6E2] text-[#3F6259]",
  Library: "bg-[#DCE6E2] text-[#3F6259]",
  "Model Architecture": "bg-[#E6DEE8] text-[#5B3F6B]",
  Algorithm: "bg-[#E6DEE8] text-[#5B3F6B]",
  Dataset: "bg-[#DEE4EC] text-[#33506B]",
  "Evaluation Metric": "bg-[#F0E2DE] text-[#AE3B2C]",
  "Research Concept or Technique": "bg-[#F1EEE4] text-[#5B6660]",
  "Application Domain": "bg-[#F1EEE4] text-[#5B6660]",
  "Data Type or Modality": "bg-[#DEE4EC] text-[#33506B]",
  "Task or Problem Type": "bg-[#F1EEE4] text-[#5B6660]",
  "Image Processing Task": "bg-[#DEE4EC] text-[#33506B]",
  Unclassified: "bg-[#EFEFEF] text-[#8A8A8A]",
};

export default function EntityTag({ keyword, entityType }: { keyword: string; entityType: string }) {
  const classes = COLOR_MAP[entityType] || COLOR_MAP.Unclassified;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs ${classes}`}>
      <span className="font-medium">{keyword}</span>
      <span className="opacity-60 font-mono text-[10px] uppercase tracking-wide">{entityType}</span>
    </span>
  );
}
