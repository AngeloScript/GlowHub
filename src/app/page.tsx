import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-foreground">
      <main className="flex w-full max-w-lg flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            GlowHub
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestão de alto desempenho para o seu Salão.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="flex h-12 flex-1 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Cadastrar Salão
          </Link>
          <Link
            href="/login"
            className="flex h-12 flex-1 items-center justify-center rounded-md border border-border bg-background px-6 font-medium transition-colors hover:bg-muted"
          >
            Entrar
          </Link>
        </div>
      </main>
    </div>
  );
}
