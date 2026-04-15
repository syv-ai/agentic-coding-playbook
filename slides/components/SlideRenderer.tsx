interface SlideRendererProps {
  html: string;
  title: string;
  isTitle?: boolean;
}

export default function SlideRenderer({ html, title, isTitle }: SlideRendererProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pb-20 pt-8">
      <div className="w-full max-w-4xl">
        {!isTitle && (
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {title}
          </h2>
        )}
        <div
          className="slide-content prose prose-invert prose-lg max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h1:text-5xl prose-h1:mb-6 prose-h1:text-white
            prose-h3:text-xl prose-h3:text-gray-200
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-code:text-cyan-300 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
            prose-blockquote:border-l-cyan-400 prose-blockquote:text-gray-300
            prose-li:text-gray-300
            prose-table:text-sm
            prose-th:text-left prose-th:text-gray-200 prose-th:border-gray-700
            prose-td:border-gray-700/50"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
