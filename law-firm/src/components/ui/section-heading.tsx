export function SectionHeading({
  eyebrow,
  title,
  text,
  center = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display mt-4 text-3xl sm:text-4xl">{title}</h2>
      {text && <p className="mt-5 leading-8 text-[#657073]">{text}</p>}
    </div>
  );
}
