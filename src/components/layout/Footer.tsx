export function Footer() {
  return (
    <footer className="mt-8 pb-4 text-center text-[11px] text-muted-foreground/80 leading-relaxed select-none">
      <p>
        تم التطوير بواسطة{" "}
        <span className="font-semibold text-foreground">مجاهد آدم</span>
        {" · "}
        <a
          href="https://suda-technologies.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          suda-technologies.com
        </a>
        {" · "}
        <span>© 2026</span>
      </p>
    </footer>
  );
}
