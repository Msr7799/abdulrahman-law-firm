import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Adapted from the SVG sources in chat-ui/src/lib/components/icons so they can
// be consumed directly by this React/Next.js application.
export function ChatUiNewIcon(props: IconProps) {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}><path d="M7.258 1.856c.333 0 .66.024.979.07-.558.319-.972.86-1.123 1.503A5.254 5.254 0 1 0 9.32 13.513l.275-.127c.334-.17.712-.229 1.08-.17l.158.031.01.003 1.343.36-.359-1.345a1.77 1.77 0 0 1 .137-1.247 5.23 5.23 0 0 0 .538-2.041 2.356 2.356 0 0 0 1.544-1 6.808 6.808 0 0 1-.676 3.742v.001c-.034.066-.031.116-.025.14l.36 1.345a1.572 1.572 0 0 1-1.823 1.945l-.1-.024-1.334-.357a.2.2 0 0 0-.14.018l-.012.005A6.825 6.825 0 1 1 7.259 1.856Zm4.837-1.36c.434 0 .785.352.785.786v1.905h1.9a.785.785 0 0 1 0 1.57h-1.9v1.9a.786.786 0 1 1-1.57 0v-1.9H9.404a.785.785 0 0 1 0-1.57h1.906V1.282c0-.434.352-.787.785-.787Z" fill="currentColor" /></svg>;
}

export function ChatUiPaperclipIcon(props: IconProps) {
  return <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...props}><path d="M19.02 5.57a5.77 5.77 0 1 1 8.56 7.74L16.6 25.45l-.02.01v.01A7.87 7.87 0 0 1 4.92 14.9L12.95 6A1.18 1.18 0 0 1 14.7 7.6l-8.03 8.87a5.51 5.51 0 1 0 8.19 7.4l10.97-12.14a3.41 3.41 0 1 0-5.06-4.58l-9.32 10.3a1.27 1.27 0 1 0 1.88 1.7l6.28-6.94a1.18 1.18 0 0 1 1.75 1.59l-6.28 6.94a3.63 3.63 0 0 1-5.41-4.83l.02-.02 9.33-10.32Z" /></svg>;
}

export function ChatUiChevronIcon(props: IconProps) {
  return <svg viewBox="0 0 15 8" fill="none" aria-hidden="true" {...props}><path d="m1.672 1 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function ChatUiBurgerIcon(props: IconProps) {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}><path d="M8.795 10.418a.84.84 0 1 1 0 1.681H1.907a.84.84 0 0 1 0-1.681h6.888ZM14.093 3.9a.841.841 0 0 1 0 1.682H1.907a.84.84 0 0 1 0-1.682h12.186Z" fill="currentColor" /></svg>;
}

