/** Third-party embeds — always re-embedded, never rehosted. */

export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line shadow-lift">
      <div className="relative aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

/** Keyless Google Maps embed (place query). */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line shadow-lift">
      <iframe
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        title={title}
        className="h-[380px] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
