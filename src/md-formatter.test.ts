import { processADF } from './process-adf';
import { markdownFormatter } from './md-formatter';
import { AdfDoc } from './types'; // Import necessary types

describe('markdownFormatter', () => {

    // Helper function to wrap content in a basic doc for testing
    const createDoc = (content: AdfDoc['content']): AdfDoc => ({
        type: 'doc',
        version: 1,
        content: content,
    });

    // --- Block Nodes ---
    describe('Block Nodes', () => {

        describe('paragraph', () => {
            test('should format a simple paragraph', () => {
                const adf = createDoc([
                    { type: 'paragraph', content: [{ type: 'text', text: 'This is a paragraph.' }] }
                ]);
                const expectedMd = 'This is a paragraph.\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format multiple paragraphs', () => {
                 const adf = createDoc([
                    { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph.' }] },
                    { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph.' }] }
                ]);
                const expectedMd = 'First paragraph.\n\nSecond paragraph.\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

        });

        describe('heading', () => {
            test('should format heading level 1', () => {
                const adf = createDoc([
                    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Heading 1' }] }
                ]);
                const expectedMd = '# Heading 1\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format heading level 3', () => {
                const adf = createDoc([
                    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Heading 3' }] }
                ]);
                const expectedMd = '### Heading 3\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should default to level 1 if level attribute is missing', () => {
                const adf = createDoc([
                    { type: 'heading', content: [{ type: 'text', text: 'Default Heading' }] } // No attrs.level
                ]);
                const expectedMd = '# Default Heading\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format heading with marks', () => {
                 const adf = createDoc([
                    { type: 'heading', attrs: { level: 2 }, content: [
                        { type: 'text', text: 'Important ', marks: [{type: 'strong'}] },
                        { type: 'text', text: 'Heading'}
                    ] }
                ]);
                const expectedMd = '## **Important **Heading\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });
        });

        describe('blockquote', () => {
             test('should format a simple blockquote', () => {
                const adf = createDoc([
                    { type: 'blockquote', content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'This is quoted.' }] }
                    ]}
                ]);
                // Blockquote adds '> ' and a trailing \n\n
                // Paragraph inside adds \n\n, which gets trimmed then handled by blockquote
                 const expectedMd = '> This is quoted.\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
             });

             test('should format a multi-line blockquote', () => {
                const adf = createDoc([
                    { type: 'blockquote', content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'Line one.' }] },
                        { type: 'paragraph', content: [{ type: 'text', text: 'Line two.' }] }
                    ]}
                ]);
                 const expectedMd = '> Line one.\n> \n> Line two.\n\n'; // Note the '> ' for the blank line between paragraphs
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
             });
        });

        describe('codeBlock', () => {
            test('should format a code block without language', () => {
                const adf = createDoc([
                    { type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1;' }] }
                ]);
                const expectedMd = '```\nconst x = 1;\n```\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format a code block with language', () => {
                 const adf = createDoc([
                    { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'console.log("Hi");' }] }
                ]);
                const expectedMd = '```javascript\nconsole.log("Hi");\n```\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format a code block with multiple lines', () => {
                 const adf = createDoc([
                    { type: 'codeBlock', attrs: { language: 'python' }, content: [{ type: 'text', text: 'def greet():\n    print("Hello")' }] }
                ]);
                const expectedMd = '```python\ndef greet():\n    print("Hello")\n```\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });
        });

         describe('rule', () => {
            test('should format a horizontal rule', () => {
                const adf = createDoc([
                    { type: 'rule' }
                ]);
                const expectedMd = '---\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });
         });


    });

    // --- List Nodes ---
    describe('List Nodes', () => {
        describe('bulletList', () => {
            test('should format a simple bullet list', () => {
                const adf = createDoc([
                    { type: 'bulletList', content: [
                        { type: 'listItem', content: [
                            { type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }
                        ]}
                    ]}
                ]);
                // listItem adds \n, bulletList adds potential \n if top-level (which it is here)
                const expectedMd = '* Item 1\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format a bullet list with multiple items', () => {
                const adf = createDoc([
                    { type: 'bulletList', content: [
                        { type: 'listItem', content: [
                            { type: 'paragraph', content: [{ type: 'text', text: 'Item A' }] }
                        ]},
                        { type: 'listItem', content: [
                            { type: 'paragraph', content: [{ type: 'text', text: 'Item B' }] }
                        ]}
                    ]}
                ]);
                const expectedMd = '* Item A\n* Item B\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

            test('should format nested bullet lists with correct indentation', () => {
                const adf = createDoc([
                    { type: 'bulletList', content: [
                        { type: 'listItem', content: [ // Level 0, Item 1
                            { type: 'paragraph', content: [{ type: 'text', text: 'Outer 1' }] },
                            { type: 'bulletList', content: [ // Level 1
                                { type: 'listItem', content: [ // Level 1, Item 1a
                                    { type: 'paragraph', content: [{ type: 'text', text: 'Inner 1a' }] }
                                ]},
                                { type: 'listItem', content: [ // Level 1, Item 1b
                                    { type: 'paragraph', content: [{ type: 'text', text: 'Inner 1b' }] }
                                ]}
                            ]}
                        ]},
                        { type: 'listItem', content: [ // Level 0, Item 2
                            { type: 'paragraph', content: [{ type: 'text', text: 'Outer 2' }] }
                        ]}
                    ]}
                ]);
                // Note: The listItem formatter adds the newline for each item.
                // The nested list content is part of the outer list item content.
                const expectedMd = '* Outer 1\n  * Inner 1a\n  * Inner 1b\n* Outer 2\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

             test('should format list items with marks', () => {
                const adf = createDoc([
                    { type: 'bulletList', content: [
                        { type: 'listItem', content: [
                            { type: 'paragraph', content: [
                                { type: 'text', text: 'Item with ' },
                                { type: 'text', text: 'bold', marks: [{type: 'strong'}] }
                            ] }
                        ]},
                         { type: 'listItem', content: [
                            { type: 'paragraph', content: [
                                { type: 'text', text: 'And ' },
                                { type: 'text', text: 'italic', marks: [{type: 'em'}] }
                            ] }
                        ]}
                    ]}
                ]);
                const expectedMd = '* Item with **bold**\n* And *italic*\n\n';
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

             test('should handle empty list items gracefully', () => {
                const adf = createDoc([
                    { type: 'bulletList', content: [
                        { type: 'listItem', content: [
                            { type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }
                        ]},
                         { type: 'listItem', content: [] }, // Empty list item
                         { type: 'listItem', content: [
                            { type: 'paragraph', content: [{ type: 'text', text: 'Item 3' }] }
                        ]},
                    ]}
                ]);
                const expectedMd = '* Item 1\n* \n* Item 3\n\n'; // Empty item results in just '* '
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

             test('should handle an empty bullet list', () => {
                const adf = createDoc([
                    { type: 'bulletList', content: [] } // Empty list
                ]);
                const expectedMd = '\n'; // Empty list results in just the trailing newline
                expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
            });

        });
        // describe('orderedList', ...)
        // describe('listItem', ...) // Testing nesting, prefixes, etc.
    });

    // --- Inline Nodes ---
    describe('Inline Nodes', () => {
        // ... existing inline node tests ...
        // describe('text', ...)
        // describe('hardBreak', ...)
    });

    // --- Marks ---
    describe('Marks', () => {
        test('should format strong mark', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [{ type: 'text', text: 'Bold text', marks: [{ type: 'strong' }] }] }
            ]);
            const expectedMd = '**Bold text**\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should format em mark', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [{ type: 'text', text: 'Italic text', marks: [{ type: 'em' }] }] }
            ]);
            const expectedMd = '*Italic text*\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should format strike mark', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [{ type: 'text', text: 'Strikethrough', marks: [{ type: 'strike' }] }] }
            ]);
            const expectedMd = '~~Strikethrough~~\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should format code mark', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Inline '}, 
                    { type: 'text', text: 'code', marks: [{ type: 'code' }] },
                    { type: 'text', text: ' here'}
                ] }
            ]);
            const expectedMd = 'Inline `code` here\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should format link mark', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Link text', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }
                ] }
            ]);
            const expectedMd = '[Link text](https://example.com)\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should format link mark with missing href gracefully', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Link text', marks: [{ type: 'link', attrs: {} }] } // Missing href
                ] }
            ]);
            const expectedMd = '[Link text]()\n\n'; // Expect empty URL
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should format nested marks correctly', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Nested', marks: [{ type: 'em' }, { type: 'strong' }] } 
                ] }
            ]);
            const expectedMd = '***Nested***\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

         test('should handle multiple marks on the same node', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Important deleted code', marks: [
                         { type: 'strong' },
                         { type: 'strike' },
                         { type: 'code' }
                    ] }
                ] }
            ]);
            // Applies right-to-left: code -> strike -> strong
            const expectedMd = '**~~`Important deleted code`~~**\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

        test('should ignore unsupported marks (underline)', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Text ', },
                    { type: 'text', text: 'with underline', marks: [{ type: 'underline' }, { type: 'strong'}] }, // Add strong to check it still works
                    { type: 'text', text: ' mark'}
                ] }
            ]);
            // Expect underline to be ignored, strong to be applied
            const expectedMd = 'Text **with underline** mark\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });

         test('should apply marks correctly even if text needs escaping', () => {
            const adf = createDoc([
                { type: 'paragraph', content: [
                    { type: 'text', text: 'Text with *stars*', marks: [{ type: 'strong' }] } 
                ] }
            ]);
            // Escaping happens on text node BEFORE marks are applied
            const expectedMd = '**Text with \\*stars\\***\n\n';
            expect(processADF(adf, markdownFormatter)).toBe(expectedMd);
        });
    });

    // --- Complex/Combined Cases ---
    // ...

});
