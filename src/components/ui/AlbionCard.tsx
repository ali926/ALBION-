export default function AlbionCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        border border-amber-700 rounded-xl 
        bg-[rgb(20,20,20)] 
        shadow-[0_0_25px_rgba(255,200,80,0.25)]
        p-5 
        mb-6
      "
    >
      {title && (
        <h2 className="text-amber-400 text-xl font-bold mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}
