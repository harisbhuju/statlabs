import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders post markdown. Raw HTML is not rendered (react-markdown default), so content is XSS-safe. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:tracking-tight prose-a:text-accent prose-img:rounded-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
