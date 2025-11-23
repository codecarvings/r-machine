export default function HelloWorldPage() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="min-h-92 flex flex-col items-center justify-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">Hello, world!</h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          This is a simple page not localized and served under the (non-localized) path segment.
        </p>
      </div>
    </section>
  );
}
