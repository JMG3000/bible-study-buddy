export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span className="chip-accent">No matching lessons</span>
      <h2 className="section-title">{title}</h2>
      <p className="lead">{description}</p>
    </div>
  );
}
