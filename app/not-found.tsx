import Link from "next/link";
export default function NotFound() {
  return (
    <section className="section narrow">
      <p className="eyebrow">404 · A WRONG TURN</p>
      <h1>Let’s get you back on route.</h1>
      <p>This page could not be found.</p>
      <Link href="/" className="button dark">
        Back to home
      </Link>
    </section>
  );
}
