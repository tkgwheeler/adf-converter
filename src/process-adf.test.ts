import { processADF } from './process-adf';
import { Formatter, AdfDoc} from './types';


describe('processADF with Simple Formatter', () => {
  test('should concatenate text from a basic ADF document', () => {
    const sampleAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello, ',
            },
            {
              type: 'text',
              text: 'world!',
            },
          ],
        },
      ],
    };

    const simpleFormatter: Formatter<string> = {
      // Default behavior: process children and join results
      defaultNodeMapper: (_node, processChildren) => processChildren().join(''),
      nodes: {
        // Text nodes return their text content
        text: (node) => node.text || '',
        // Other nodes (doc, paragraph) just process children via defaultNodeMapper
      },
      marks: {},
    };

    const result = processADF(sampleAdf, simpleFormatter);
    expect(result).toBe('Hello, world!');
  });

  test('should visit nodes in depth-first order', () => {
    const traversalAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'P1T1' },
            { type: 'text', text: 'P1T2' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [
            { type: 'text', text: 'H1T1' },
          ],
        },
      ],
    };

    const visitedNodes: string[] = [];

    const traversalFormatter: Formatter<void> = {
      defaultNodeMapper: (node, processChildren) => {
        visitedNodes.push(`default:${node.type}`);
        processChildren();
      },
      nodes: {
        doc: (node, processChildren) => {
          visitedNodes.push(node.type);
          processChildren();
        },
        paragraph: (node, processChildren) => {
          visitedNodes.push(node.type);
          processChildren();
        },
        heading: (node, processChildren) => {
          visitedNodes.push(node.type);
          processChildren();
        },
        text: (node) => {
          visitedNodes.push(node.type);
          // No children for text nodes
        },
      },
      marks: {},
    };

    processADF(traversalAdf, traversalFormatter);

    // Expect depth-first traversal order
    expect(visitedNodes).toEqual([
      'doc',
      'paragraph',
      'text', // P1T1
      'text', // P1T2
      'heading',
      'text', // H1T1
    ]);
  });

  test('should select correct node mapper or default mapper', () => {
    const mapperSelectionAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Child of Known' },
          ],
        },
        {
          type: 'unknownNode', // This node type won't have a specific mapper
          content: [
            { type: 'text', text: 'Child of Unknown' },
          ],
        },
      ],
    };

    const mapperSelectionFormatter: Formatter<string> = {
      defaultNodeMapper: (node, processChildren) => {
        return `DEFAULT[${node.type}](${processChildren().join('|')})`;
      },
      nodes: {
        // Specific mapper for doc
        doc: (_node, processChildren) => {
          return `DOC(${processChildren().join('|')})`;
        },
        // Specific mapper for paragraph
        paragraph: (_node, processChildren) => {
          return `PARAGRAPH(${processChildren().join('|')})`;
        },
        // Specific mapper for text
        text: (node) => {
          return `TEXT[${node.text || ''}]`;
        },
        // No specific mapper for 'unknownNode', so defaultNodeMapper will be used
      },
      marks: {},
    };

    const result = processADF(mapperSelectionAdf, mapperSelectionFormatter);

    // Expect output showing specific mappers used for known types
    // and default mapper used for the unknown type.
    expect(result).toBe(
      'DOC(PARAGRAPH(TEXT[Child of Known])|DEFAULT[unknownNode](TEXT[Child of Unknown]))'
    );
  });


  const marksFormatter: Formatter<string> = {
    // Default just joins children
    defaultNodeMapper: (_node, processChildren) => processChildren().join(''),
    nodes: {
      // Process doc and paragraph children
      doc: (_node, processChildren) => processChildren().join(''),
      paragraph: (_node, processChildren) => processChildren().join(''),
      // Text returns its text
      text: (node) => node.text || '',
    },
    marks: {
      // Define mark formatters only for 'text' nodes
      text: {
        strong: (_mark, next) => {
          return `**${next()}**`;
        },
        em: (_mark, next) => {
          return `*${next()}*`;
        },
      },
    },
  };

  test('should apply marks correctly in nested order', () => {
    const marksAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Some bold and italic text',
              marks: [
                { type: 'strong' }, // Outer mark
                { type: 'em' },     // Inner mark
              ],
            },
            {
              type: 'text',
              text: ' and some normal text.',
            },
          ],
        },
      ],
    };

    const result = processADF(marksAdf, marksFormatter);

    // Expect the text with marks applied correctly nested (strong outside em)
    expect(result).toBe('***Some bold and italic text*** and some normal text.');
  });

  test('should ignore unknown marks on text nodes', () => {
    const unknownMarkAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Text with unknown mark',
              marks: [
                { type: 'unknownMark' },
                { type: 'strong' }, // Known mark to ensure it still works
              ],
            },
          ],
        },
      ],
    };

    // Reuse the marksFormatter from the previous test
    const formatter = marksFormatter;

    const result = processADF(unknownMarkAdf, formatter);

    // Expect the unknown mark to be ignored, but the known mark applied
    expect(result).toBe('**Text with unknown mark**');
  });

  test('should correctly track listItemLevel in ConversionContext for nested lists', () => {
    const nestedListAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'orderedList', // Level 0
          content: [
            {
              type: 'listItem', // Level 0, Item 1
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'OL1' }] }],
            },
            {
              type: 'listItem', // Level 0, Item 2
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'OL2' }] },
                {
                  type: 'bulletList', // Level 1
                  content: [
                    {
                      type: 'listItem', // Level 1, Item 2a
                      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'BL2a' }] }],
                    },
                    {
                       type: 'listItem', // Level 1, Item 2b
                       content: [{ type: 'paragraph', content: [{ type: 'text', text: 'BL2b' }] }],
                    }
                  ],
                },
              ],
            },
             {
              type: 'listItem', // Level 0, Item 3
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'OL3' }] }],
            },
          ],
        },
         {
          type: 'bulletList', // Level 0 (separate list)
          content: [
            {
              type: 'listItem', // Level 0, Item A
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'BL_A' }] }],
            },
          ]
        }
      ],
    };

    const recordedLevels: number[] = [];

    const contextTrackingFormatter: Formatter<void> = {
      // Default just process children, don't record anything
      defaultNodeMapper: (_node, processChildren, context) => {
        processChildren(context); // Pass context through
      },
      nodes: {
        // Process children for structural nodes, passing context
        doc: (_node, processChildren, context) => processChildren(context),
        paragraph: (_node, processChildren, context) => processChildren(context),
        text: (_node) => { /* Leaf node */ }, // Ignore text nodes

        // Update context for lists
        orderedList: (_node, processChildren, context) => {
            const newLevel = (context.listItemLevel ?? -1) + 1;
            processChildren({ listItemLevel: newLevel, listType: 'ordered' });
        },
         bulletList: (_node, processChildren, context) => {
            const newLevel = (context.listItemLevel ?? -1) + 1;
            processChildren({ listItemLevel: newLevel, listType: 'bullet' });
        },

        // Record the level when a listItem is encountered
        listItem: (_node, processChildren, context) => {
          recordedLevels.push(context.listItemLevel ?? -99); // Record level, use -99 if undefined
          // Process children with the *same* level (lists inside update it)
          processChildren(context);
        },
      },
      marks: {},
    };

    processADF(nestedListAdf, contextTrackingFormatter);

    // Expect levels: OL1(0), OL2(0), BL2a(1), BL2b(1), OL3(0), BL_A(0)
    expect(recordedLevels).toEqual([0, 0, 1, 1, 0, 0]);
  });

  test('should pass correct siblingIndex to node mappers', () => {
    const siblingIndexAdf: AdfDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'orderedList', // Outer list
          content: [
            {
              type: 'listItem', // Outer index 0
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Outer 1' }] }],
            },
            {
              type: 'listItem', // Outer index 1
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Outer 2' }] },
                {
                  type: 'orderedList', // Nested list
                  content: [
                    {
                      type: 'listItem', // Nested index 0
                      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested 2a' }] }],
                    },
                    {
                       type: 'listItem', // Nested index 1
                       content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested 2b' }] }],
                    }
                  ]
                }
              ],
            },
             {
              type: 'listItem', // Outer index 2
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Outer 3' }] }],
            },
          ],
        },
         {
          type: 'bulletList', // Separate list
          content: [
            {
              type: 'listItem', // Separate index 0
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet A' }] }],
            },
             {
              type: 'listItem', // Separate index 1
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet B' }] }],
            },
          ]
        }
      ],
    };

    const recordedIndices: { nodeText: string | undefined, index: number }[] = [];

    const indexTrackingFormatter: Formatter<void> = {
      defaultNodeMapper: (_node, processChildren, context) => {
        processChildren(context);
      },
      nodes: {
        // Process children for structural nodes, passing context
        doc: (_node, processChildren, context) => processChildren(context),
        paragraph: (_node, processChildren, context) => processChildren(context),
        orderedList: (_node, processChildren, context) => processChildren(context),
        bulletList: (_node, processChildren, context) => processChildren(context),
        text: (_node) => { /* Leaf node */ },

        // Record the sibling index for listItem
        listItem: (node, processChildren, context, siblingIndex) => {
          // Try to get the text content for easier debugging
          const firstText = node.content?.find(c => c.type === 'paragraph')?.content?.find(t => t.type === 'text')?.text;
          recordedIndices.push({ nodeText: firstText, index: siblingIndex });
          processChildren(context); // Process children normally
        },
      },
      marks: {},
    };

    processADF(siblingIndexAdf, indexTrackingFormatter);

    // Extract just the indices for the assertion
    const indices = recordedIndices.map(r => r.index);

    // Expect indices: Outer(0, 1, 2), Nested(0, 1), Separate(0, 1)
    expect(indices).toEqual([0, 1, 0, 1, 2, 0, 1]);

    // Optional: log recorded data for easier debugging if test fails
    // console.log('Recorded Sibling Indices:', recordedIndices);
  });

}); 