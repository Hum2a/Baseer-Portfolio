import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import clsx from "clsx";

type MarkdownBodyProps = {
  content: string;
  className?: string;
};

export function MarkdownBody({ content, className }: MarkdownBodyProps) {
  if (!content.trim()) return null;

  return (
    <div
      className={clsx(
        "prose-base font-body text-graphite/90 measure space-y-4",
        "[&_a]:text-steel [&_a]:underline",
        "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:mt-8",
        "[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-6",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_code]:font-mono [&_code]:text-sm [&_code]:bg-mist/40 [&_code]:px-1",
        className,
      )}
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
    </div>
  );
}
