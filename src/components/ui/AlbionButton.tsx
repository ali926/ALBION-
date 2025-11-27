export default function AlbionButton({
  children,
  onClick
}: {
  children: any;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="albion-btn mt-2">
      {children}
    </button>
  );
}
