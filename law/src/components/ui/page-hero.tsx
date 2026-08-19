export function PageHero({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <section className="hero-grid bg-[#132b32] py-20 text-white sm:py-28">
      <div className="container-site">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-5 max-w-4xl text-4xl sm:text-5xl">{title}</h1>
        {text && (
          <p className="mt-5 max-w-2xl leading-8 text-white/65">{text}</p>
        )}
      </div>
    </section>
  );
}
