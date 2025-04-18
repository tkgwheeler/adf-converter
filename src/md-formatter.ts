import { ConversionContext, Formatter, MarkMapper, NodeMapper } from "./types";


// --- Helper: Markdown Escaping ---
function escapeMarkdown(text: string): string {
    if (!text) return '';
    text = text.replace(/\\/g, '\\\\'); // Escape backslashes first
    // Escape markdown characters: `*_{}[]()#+-.!|~>` (escape > for blockquotes)
    // Note: Don't escape backticks within code spans/blocks - handled separately.
    text = text.replace(/([*_~`[\]()#+\-.!|>])/g, '\\$1');
    return text;
  }
  
  
  // --- Node Mappers ---
  
  const defaultNodeMapper: NodeMapper<string> = (node, processChildren, context) => {
      console.warn(`Unsupported ADF node type: "${node.type}". Processing children.`);
      return processChildren(context).join(''); // Process children as a fallback
  };
  
  const markdownNodeMappers: { [nodeType: string]: NodeMapper<string> | undefined } = {
      doc: (_node, processChildren, context) => {
          return processChildren(context).join('').trim() + '\n';
      },
  
      paragraph: (_node, processChildren, context) => {
          return processChildren(context).join('') + '\n\n';
      },
  
      heading: (node, processChildren, context) => {
          const level = node.attrs?.level || 1;
          const prefix = '#'.repeat(level) + ' ';
          return prefix + processChildren(context).join('') + '\n\n';
      },
  
      bulletList: (_node, processChildren, context) => {
          const newLevel = (context.listItemLevel ?? -1) + 1;
          // Process listItems with updated context
          const childrenContent = processChildren({ listItemLevel: newLevel, listType: 'bullet' }).join('');
           // Add extra newline after the list if it's not nested within another list item
          const suffix = (context.listItemLevel ?? -1) < 0 ? '\n' : '';
          return childrenContent + suffix;
      },
  
      orderedList: (_node, processChildren, context) => {
          const newLevel = (context.listItemLevel ?? -1) + 1;
           // Process listItems with updated context
          const childrenContent = processChildren({ listItemLevel: newLevel, listType: 'ordered'}).join('');
          // Add extra newline after the list if it's not nested within another list item
          const suffix = (context.listItemLevel ?? -1) < 0 ? '\n' : '';
          return childrenContent + suffix;
      },
  
      listItem: (node, processChildren, context, siblingIndex) => {
          const indent = '  '.repeat(context.listItemLevel ?? 0);
          let itemPrefix = '* ';
          if (context.listType === 'ordered') {
              // Use siblingIndex + 1 for numbering (adjust if list attrs.order is present)
              itemPrefix = `${(node.attrs?.order ?? siblingIndex) + 1}. `;
          }
  
          // Process content of the list item.
          // Reset list context for elements *inside* the list item,
          // but keep track of the current level for potential nested lists.
          const contentContext: ConversionContext = { listItemLevel: context.listItemLevel };
          const contentMarkdown = processChildren(contentContext).join('');
  
          // Remove paragraph spacing if a paragraph is the only child, common case
          const trimmedContent = contentMarkdown.replace(/^\s+|\s+$/g, ''); // Trim ends aggressively
                                          // .replace(/\n\n$/, '\n'); // Reduce trailing space, tricky
  
          // Ensure nested lists start on a new line if preceded by text
          const formattedContent = trimmedContent.replace(/(\S)\n([*#>`\d])/, '$1\n\n$2'); // Add space before nested lists/blocks if needed
  
  
          return `${indent}${itemPrefix}${formattedContent}\n`;
      },
  
      blockquote: (_node, processChildren, context) => {
          const quoteContent = processChildren(context).join('').trim();
          const quoteLines = quoteContent.split('\n');
          return quoteLines.map(line => `> ${line}`).join('\n') + '\n\n';
      },
  
      codeBlock: (node, _processChildren) => { // Don't process children for code block
          const language = node.attrs?.language || '';
          // Code blocks contain raw text, typically in a single text node.
          const codeContent = node.content?.map(n => n.text || '').join('\n') || '';
          // No Markdown escaping needed for the content itself
          return '```' + language + '\n' + codeContent + '\n```\n\n';
      },
  
      rule: () => {
          return '---\n\n';
      },
  
      text: (node) => {
          // Escape markdown characters here, *before* marks are applied
          return escapeMarkdown(node.text || '');
      },
  
      hardBreak: () => {
          // Use double space for hard line break in Markdown, or just newline
          return '  \n';
      },
  
      mention: (node) => {
          return `@${node.attrs?.text || node.attrs?.id || 'mention'}`;
      },
  
      emoji: (node) => {
          return node.attrs?.shortName || node.attrs?.text || '';
      },
  
      inlineCard: (node) => {
        // Simple link representation
        const url = node.attrs?.url || '';
        return `[${url}](${url})`;
      },
  
      panel: (node, processChildren, context) => {
           // Represent as a blockquote with a title
           const panelContent = processChildren(context).join('').trim();
           const title = node.attrs?.panelType ? `**Panel (${node.attrs.panelType}):**` : '**Panel:**';
           return `> ${title}\n> ${panelContent.split('\n').join('\n> ')}\n\n`;
      },
  
       status: (node) => {
          return `[${node.attrs?.text?.toUpperCase() || 'STATUS'}]`; // Simple text representation
       },
  
       // Add handlers for table, media, etc. if needed
  };
  
  // --- Mark Mappers (Applied only to 'text' nodes in this setup) ---
  
  const markdownMarkMappers: { [markType: string]: MarkMapper<string> | undefined } = {
      strong: (_mark, next) => `**${next()}**`,
      em: (_mark, next) => `*${next()}*`, // Or use _
      strike: (_mark, next) => `~~${next()}~~`,
      code: (_mark, next) => `\`${next()}\``, // Note: Escaping should handle backticks in text
      link: (mark, next, _parentTextNode) => {
          const href = mark.attrs?.href || '';
          // Use next() which contains the processed text (potentially with other marks)
          // Markdown escaping was already done in the 'text' node handler
          return `[${next()}](${href})`;
      },
      underline: (_mark, next) => next(), // Markdown doesn't support underline, ignore
      textColor: (_mark, next) => next(), // Markdown doesn't support color, ignore
      subsup: (_mark, next) => next(), // Markdown doesn't support sub/sup, ignore (or use HTML)
  };
  
  // --- Construct the Formatter ---
  
  export const markdownFormatter: Formatter<string> = {
      defaultNodeMapper: defaultNodeMapper,
      nodes: markdownNodeMappers,
      marks: {
          // Define marks only for 'text' nodes, as that's typical ADF structure
          text: markdownMarkMappers,
      },
  };