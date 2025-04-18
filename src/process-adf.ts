import {
    AdfNode, AdfMark, ConversionContext, Formatter,
    NextMarkFunction, ProcessChildrenFunction,
    AdfDoc
} from './types';

/**
 * Recursively formats an ADF node using the provided formatter and context.
 */
function formatNode<T>(
    node: AdfNode,
    formatter: Formatter<T>,
    context: ConversionContext,
    siblingIndex: number
): T {

    /**
     * Creates the function that node mappers can call to process children.
     * This function passes the current context, allowing overrides.
     */
    const processChildren: ProcessChildrenFunction<T> =
        (contextOverrides: Partial<ConversionContext> = {}): T[] => {
            if (!node.content) {
                return [];
            }
            const childContext = { ...context, ...contextOverrides };
            return node.content.map((child, idx) =>
                formatNode(child, formatter, childContext, idx)
            );
        };

    // Select the appropriate node mapper or the default
    const nodeMapper = formatter.nodes[node.type] || formatter.defaultNodeMapper;

    // Generate the raw content for this node by calling its mapper
    const baseContent = nodeMapper(node, processChildren, context, siblingIndex);

    // If the node is text and has marks, apply them
    if (node.type === 'text' && node.marks && node.marks.length > 0) {
        // Compose mark functions using reduceRight for correct nesting (outermost first)
        const markChain = node.marks.reduceRight<NextMarkFunction<T>>(
            (next /* inner result function */, mark /* current mark */) => {
                // Return a new function that applies the current mark
                return () => {
                    const parentNodeType = node.type; // Should always be 'text' here
                    const markMapper = formatter.marks[parentNodeType]?.[mark.type];
                    if (markMapper) {
                        // Apply the specific mark formatter
                        return markMapper(mark, next, node, context);
                    } else {
                        // If no specific formatter for this mark, just return inner content
                        console.warn(`Unsupported mark type "${mark.type}" on node type "${parentNodeType}"`);
                        return next();
                    }
                };
            },
            () => baseContent // Innermost function returns the base text content
        );

        // Execute the fully composed chain of mark formatters
        return markChain();
    } else {
        // If not text or no marks, return the base content directly
        return baseContent;
    }
}


/**
 * Main entry point to format an entire ADF document or node.
 */
export function processADF<T>(
    adf: AdfNode | AdfDoc,
    formatter: Formatter<T>
): T {
    if (!adf || typeof adf !== 'object' || !adf.type) {
        console.error("Invalid ADF input provided.");
        // Depending on T, return an appropriate empty value
        return '' as T; // Assuming T is string for now, adjust if needed
    }

    // Ensure we start with a 'doc' node for consistency if needed
    let rootNode = adf;
    if (adf.type !== 'doc') {
        console.warn("Root ADF node is not type 'doc'. Wrapping it for conversion.");
        // Create a synthetic doc node if the input isn't one
        rootNode = { type: 'doc', version: 1, content: [adf] };
    }

    const initialContext: ConversionContext = {
      listItemLevel: -1, // Start outside any list
    };
    return formatNode(rootNode, formatter, initialContext, 0);
}