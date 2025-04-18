# adf-converter

A utility to convert Atlassian Document Format (ADF) JSON to other formats, starting with Markdown.

## Installation

```bash
npm install adf-converter
```

## Usage

Import the `processADF` function and the desired formatter (currently  `markdownFormatter`). Pass your ADF JSON object and the formatter to `processADF`.

```javascript
import { processADF, markdownFormatter } from 'adf-converter';

const adfInput = {
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Example Document' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is some text with ' },
        { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'italic.', marks: [{ type: 'em' }] },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] },
          ],
        },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] },
            {
              type: 'orderedList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Nested Item 2a' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'console.log("Hello");' }]
    }
  ],
};

const markdownOutput = processADF(adfInput, markdownFormatter);

console.log(markdownOutput);
```

**Output:**

```markdown
# Example Document

This is some text with **bold** and *italic.*

* Item 1
* Item 2
  1. Nested Item 2a

```javascript
console.log("Hello");
```

## API

### `processADF<T>(adf: AdfNode | AdfDoc, formatter: Formatter<T>): T`

The main function to process an ADF document or node.

*   `adf`: The Atlassian Document Format object (can be the root `doc` or any valid ADF node).
*   `formatter`: A `Formatter` object that defines how to handle each ADF node and mark type.

### `markdownFormatter: Formatter<string>`

A pre-defined formatter that converts ADF to a Markdown string.

### `Formatter<T>` Interface

You can create custom formatters by implementing the `Formatter` interface (defined in `src/types.ts`). This allows converting ADF to other formats (like HTML, plain text, etc.) or extracting specific information.

## Supported ADF Features (Markdown Conversion)

The `markdownFormatter` currently supports:

**Block Nodes:**
*   `doc`
*   `paragraph`
*   `heading` (levels 1-6)
*   `bulletList` (nested)
*   `orderedList` (nested)
*   `listItem`
*   `blockquote`
*   `codeBlock` (with language attribute)
*   `rule` (horizontal rule)
*   `panel`
*   `status` (basic text representation)

**Inline Nodes:**
*   `text`
*   `hardBreak`
*   `mention`
*   `emoji`
*   `inlineCard` (as a simple link)

**Marks:**
*   `strong` (bold)
*   `em` (italic)
*   `strike` (strikethrough)
*   `code` (inline code)
*   `link`
*   Unsupported marks (`underline`, `textColor`, `subsup`) are currently ignored.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests on the [GitHub repository](https://github.com/tkgwheeler/adf-converter).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
