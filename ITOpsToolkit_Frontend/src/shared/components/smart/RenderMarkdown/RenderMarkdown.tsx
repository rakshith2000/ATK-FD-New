import { Link } from '@tanstack/react-router';
import type React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface RenderMarkdownProps {
    text: string;
}

const RenderMarkdown: React.FC<RenderMarkdownProps> = ({ text }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MARKDOWN_COMPONENTS}>
        {text}
    </ReactMarkdown>
);

export default RenderMarkdown;

const t = 'text-(--brand-text-color)';
const th = 'text-(--brand-title-primary-color)';
const b = 'border-(--brand-border-color)';

// Compact size tokens
const sz = {
    h1: 'text-sm',
    h2: 'text-x',
    h3: 'text-xs',
    body: 'text-xs',
    sm: 'text-xs',
    xs: 'text-[0.7rem]',
} as const;

const MARKDOWN_COMPONENTS: Components = {
    // -- Headings ----------------------------------------------

    // # Heading 1
    h1: ({ children }) => <h1 className={`${sz.h1}  font-bold     ${th} mt-5 mb-2 leading-tight  tracking-tight border-b ${b} pb-2`}>{children}</h1>,
    // ## Heading 2
    h2: ({ children }) => <h2 className={`${sz.h2}  font-bold     ${th} mt-4 mb-1.5 leading-tight`}>{children}</h2>,
    // ### Heading 3
    h3: ({ children }) => <h3 className={`${sz.h3}  font-semibold ${th} mt-3 mb-1.5`}>{children}</h3>,
    // #### Heading 4
    h4: ({ children }) => <h4 className={`${sz.sm}  font-semibold ${th} mt-2.5 mb-1`}>{children}</h4>,
    // ##### Heading 5
    h5: ({ children }) => <h5 className={`${sz.xs}  font-semibold ${th} mt-2 mb-1 uppercase tracking-wider`}>{children}</h5>,
    // ###### Heading 6
    h6: ({ children }) => <h6 className={`${sz.xs}  font-semibold ${t}  mt-2 mb-1 uppercase tracking-widest opacity-60`}>{children}</h6>,

    // -- Block -------------------------------------------------

    // Plain paragraph text
    p: ({ children }) => <p className={`${sz.body} ${t} leading-relaxed mb-2 last:mb-0`}>{children}</p>,
    // > Quoted text
    blockquote: ({ children }) => (
        <blockquote className={`border-l-[3px] border-indigo-400 pl-3 pr-2 py-1 my-2.5 rounded-r-md bg-indigo-50/50 ${sz.body} ${t} italic`}>{children}</blockquote>
    ),
    // --- or *** or ___
    hr: () => <hr className={`border-0 border-t ${b} my-3`} />,
    // ```code block``` (wraps <code>)
    pre: ({ children }) => (
        <pre className={`bg-slate-900 rounded-lg px-3 py-2.5 overflow-x-auto ${sz.xs} font-mono mb-2.5 border border-slate-800 leading-relaxed`}>{children}</pre>
    ),
    // <section>
    section: ({ children }) => <section className="mb-3 last:mb-0">{children}</section>,
    // <article>
    article: ({ children }) => <article className={`mb-3 p-2.5 border ${b} rounded-md`}>{children}</article>,
    // <aside>
    aside: ({ children }) => <aside className={`mb-2.5 p-2.5 border-l-4 border-indigo-300 bg-indigo-50/40 rounded-r-md ${sz.body} ${t}`}>{children}</aside>,
    // <div>
    // <div>
    div: ({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div className={`mb-1.5 last:mb-0 ${className || ''}`} style={style} {...props}>
            {children}
        </div>
    ),
    // <nav>
    nav: ({ children }) => <nav className={`mb-2.5 p-2 rounded-md bg-slate-50 border ${b} ${sz.body}`}>{children}</nav>,

    // -- Inline ------------------------------------------------

    // [text](url "title")
    a: ({ href, title, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const isExternal = href?.startsWith('http') || href?.startsWith('//');
        const isHash = href?.startsWith('#');

        if (isExternal || isHash) {
            return (
                <a
                    href={href}
                    title={title}
                    {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
                    rel="noopener noreferrer"
                    className="text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors break-all"
                >
                    {children}
                </a>
            );
        }

        const [path, queryString] = (href ?? '/').split('?');
        const search = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : undefined;

        return (
            <Link to={path} search={search} title={title} className="text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors break-all">
                {children}
            </Link>
        );
    },
    // **bold**
    strong: ({ children }) => <strong className={`font-semibold ${th}`}>{children}</strong>,
    // *italic*
    em: ({ children }) => <em className={`italic ${t} opacity-80`}>{children}</em>,
    // ~~strikethrough~~
    del: ({ children }) => <del className="line-through opacity-50">{children}</del>,
    // <mark>highlighted</mark>
    mark: ({ children }) => <mark className="bg-amber-100 text-amber-800 px-0.5 rounded">{children}</mark>,
    // <span>
    span: ({ children }) => <span className={t}>{children}</span>,
    // <sup>superscript</sup>
    sup: ({ children }) => <sup className={`${sz.xs} text-indigo-500 align-super leading-none`}>{children}</sup>,
    // <sub>subscript</sub>
    sub: ({ children }) => <sub className={`${sz.xs} ${t} align-sub leading-none`}>{children}</sub>,
    // <small>small</small>
    small: ({ children }) => <small className={`${sz.xs} ${t} opacity-70`}>{children}</small>,
    // <ins>inserted</ins>
    ins: ({ children }) => <ins className="underline decoration-emerald-500 decoration-2 not-italic">{children}</ins>,
    // <cite>citation</cite>
    cite: ({ children }) => <cite className={`italic ${sz.body} ${t} opacity-80`}>{children}</cite>,
    // <var>variable</var>
    var: ({ children }) => <var className={`font-mono italic text-indigo-600 ${sz.xs}`}>{children}</var>,
    // <samp>output</samp>
    samp: ({ children }) => <samp className={`font-mono ${sz.xs} bg-slate-100 text-emerald-600 px-1.5 py-0.5 rounded border border-slate-200`}>{children}</samp>,
    // <dfn>definition</dfn>
    dfn: ({ children }) => <dfn className={`italic font-medium ${th} underline decoration-dotted`}>{children}</dfn>,
    // <abbr title="...">abbr</abbr>
    abbr: ({ children, title }: React.HTMLAttributes<HTMLElement>) => (
        <abbr title={title} className="underline decoration-dotted cursor-help">
            {children}
        </abbr>
    ),
    // <kbd>Ctrl+C</kbd>
    kbd: ({ children }) => (
        <kbd className={`inline-flex items-center font-mono ${sz.xs} bg-slate-100 border border-slate-300 border-b-2 text-slate-700 rounded px-1.5 py-0.5 shadow-sm`}>
            {children}
        </kbd>
    ),
    // <q>inline quote</q>
    q: ({ children, cite: c }: React.QuoteHTMLAttributes<HTMLQuoteElement>) => (
        <q cite={c} className={`italic ${sz.body} ${t} before:content-['"'] after:content-['"']`}>
            {children}
        </q>
    ),
    // <time datetime="2024-01-01">Jan 1</time>
    time: ({ children, dateTime }: React.TimeHTMLAttributes<HTMLTimeElement>) => (
        <time dateTime={dateTime} className={`${sz.xs} font-mono ${t} opacity-80`}>
            {children}
        </time>
    ),
    // <address>contact</address>
    address: ({ children }) => <address className={`not-italic ${sz.body} ${t} border-l-2 ${b} pl-3 my-2`}>{children}</address>,
    // two trailing spaces or <br>
    br: () => <br className="block my-1" />,
    // <wbr> (word break opportunity)
    wbr: () => <wbr />,
    // <bdi> (bidirectional isolate)
    bdi: ({ children }) => <bdi>{children}</bdi>,
    // <bdo dir="rtl"> (bidirectional override)
    bdo: ({ children, dir }: React.HTMLAttributes<HTMLElement>) => <bdo dir={dir}>{children}</bdo>,

    // -- Code --------------------------------------------------

    // ```lang\ncode\n``` (fenced block) or `inline code`
    code: ({ children, className: cls }: React.HTMLAttributes<HTMLElement>) =>
        cls?.includes('language-') ? (
            <code className={`block font-mono ${sz.xs} text-slate-200 ${cls ?? ''}`}>{children}</code>
        ) : (
            <code className={`font-mono ${sz.xs} bg-slate-900 text-slate-200 px-1.5 py-0.5 rounded border-none border-slate-800`}>{children}</code>
        ),

    // -- Lists -------------------------------------------------

    // - item  or  * item
    ul: ({ children }) => <ul className={`list-disc   list-outside pl-4 space-y-0.5 mb-2 ${sz.body} ${t}`}>{children}</ul>,
    // 1. item
    ol: ({ children }) => <ol className={`list-decimal list-outside pl-4 space-y-0.5 mb-2 ${sz.body} ${t}`}>{children}</ol>,
    // - list item content
    li: ({ children }) => <li className={`${sz.body} ${t} leading-relaxed pl-1 marker:text-slate-400`}>{children}</li>,
    // - [x] done  or  - [ ] todo
    input: ({ type, checked, disabled }: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input type={type} checked={checked} disabled={disabled} readOnly className="mr-1.5 mt-0.5 align-middle accent-indigo-500 cursor-default" />
    ),

    // -- Definition list ---------------------------------------

    // <dl> wrapper
    dl: ({ children }) => <dl className={`mb-2.5 rounded-md border ${b} overflow-hidden divide-y divide-(--brand-border-color)`}>{children}</dl>,
    // <dt>term</dt>
    dt: ({ children }) => <dt className={`${sz.xs} font-semibold ${th} uppercase tracking-wider bg-slate-50 px-3 py-1`}>{children}</dt>,
    // <dd>definition</dd>
    dd: ({ children }) => <dd className={`${sz.body} ${t} px-3 py-1 pl-5`}>{children}</dd>,

    // -- Table -------------------------------------------------

    // | col | col |\n|-----|-----|
    table: ({ children }) => (
        <div className={`overflow-x-auto mb-2.5 rounded-md border ${b}`}>
            <table className={`w-full ${sz.body} border-collapse`}>{children}</table>
        </div>
    ),
    // header row section
    thead: ({ children }) => <thead className={`bg-slate-50 border-b ${b}`}>{children}</thead>,
    // body rows section
    tbody: ({ children }) => <tbody className={`divide-y ${b}`}>{children}</tbody>,
    // footer row section
    tfoot: ({ children }) => <tfoot className={`bg-slate-50 border-t ${b} font-medium`}>{children}</tfoot>,
    // | cell | cell |
    tr: ({ children }) => <tr className="hover:bg-slate-50/80 transition-colors border ${b}">{children}</tr>,
    // | **Header** |
    th: ({ children }) => <th className={`text-left ${sz.xs} font-semibold ${th} uppercase tracking-wider px-3 py-1.5 whitespace-nowrap border ${b}`}>{children}</th>,
    // | cell data |
    td: ({ children }) => <td className={`px-3 py-1.5 ${sz.xs} ${t} align-top border ${b}`}>{children}</td>,

    // -- Media -------------------------------------------------

    // ![alt](src "title")
    img: ({ src, alt, title }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        <img src={src} alt={alt ?? ''} title={title} loading="lazy" className={`rounded-md max-w-full h-auto my-2.5 border ${b} shadow-sm`} />
    ),
    // <video src="...">
    video: ({ src, ...p }: React.VideoHTMLAttributes<HTMLVideoElement>) => <video src={src} controls className={`rounded-md w-full my-2.5 border ${b}`} {...p} />,
    // <audio src="...">
    audio: ({ src, ...p }: React.AudioHTMLAttributes<HTMLAudioElement>) => <audio src={src} controls className="w-full my-2" {...p} />,
    // <figure>
    figure: ({ children }) => <figure className="my-3 flex flex-col items-center gap-1.5">{children}</figure>,
    // <figcaption>caption</figcaption>
    figcaption: ({ children }) => <figcaption className={`${sz.xs} ${t} opacity-60 text-center`}>{children}</figcaption>,

    // -- Interactive --------------------------------------------

    // <details>
    details: ({ children }) => <details className={`group mb-2.5 border ${b} rounded-md overflow-hidden open:shadow-sm`}>{children}</details>,

    // <summary>label</summary>
    summary: ({ children }) => (
        <summary
            className={`flex items-center justify-between px-3 py-1.5 ${sz.body} font-semibold ${th} cursor-pointer select-none list-none bg-slate-50 hover:bg-slate-100 transition-colors [&::-webkit-details-marker]:hidden after:content-['▸'] after:text-slate-400 after:${sz.xs} after:transition-transform group-open:after:rotate-90`}
        >
            {children}
        </summary>
    ),
};
