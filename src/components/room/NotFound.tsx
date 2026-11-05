import Link from "next/link";

interface NotFoundProps {
  error?: string | null;
}

export function NotFound({ error = null }: NotFoundProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-4xl font-medium tracking-[-0.03em]">
        {error ? "Couldn’t load this room." : "No room here."}
      </h1>
      <p className="mt-3 text-mute">
        {error ??
          "The link may be wrong, or the room was made in demo mode in another browser."}
      </p>
      <Link href="/" className="mt-8 font-medium underline underline-offset-4 hover:text-signal">
        Start a new room
      </Link>
    </main>
  );
}
