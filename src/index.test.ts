import { processADF } from './process-adf';
import { AdfNode, Formatter, AdfDoc } from './types';

describe('initial test', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});

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
        // Other nodes (doc, paragraph) just process children by default
      },
      // No marks needed for this simple test
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
}); 