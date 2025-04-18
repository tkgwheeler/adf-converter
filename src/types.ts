// Basic ADF Node Structure (reuse or adapt your existing interfaces)
export interface AdfNode {
    type: string;
    content?: AdfNode[];
    text?: string;
    attrs?: AdfAttrs;
    marks?: AdfMark[];
}

export interface AdfAttrs {
    level?: number;
    language?: string;
    href?: string;
    id?: string;
    text?: string; // For mention/emoji text representation
    shortName?: string; // For emoji short name
    url?: string; // For inlineCard
    // Add other potential attributes as needed
    [key: string]: any; // Allow other attributes
}

export interface AdfMark {
    type: string; // Be flexible, e.g., 'strong' | 'em' | 'link' | ...
    attrs?: AdfAttrs;
}

export interface AdfDoc extends AdfNode {
    type: 'doc';
    version: number;
    content: AdfNode[];
}

// --- Types for the Formatter ---

/**
 * Context passed down during conversion (e.g., for list levels).
 */
export interface ConversionContext {
    listItemLevel?: number;
    listType?: 'bullet' | 'ordered';
    itemIndex?: number; // Provided to listItem handler
}

/**
 * Function signature for processing child nodes.
 * Allows passing context overrides for the children.
 * Returns an array of formatted child results.
 */
export type ProcessChildrenFunction<T> = (contextOverrides?: Partial<ConversionContext>) => T[];


/**
 * Function signature for a node formatter.
 */
export type NodeMapper<T> = (
    node: AdfNode,
    processChildren: ProcessChildrenFunction<T>,
    context: ConversionContext,
    siblingIndex: number
) => T;

/**
 * Function signature for processing the content wrapped by a mark.
 * Returns the formatted content (which might include inner marks).
 */
export type NextMarkFunction<T> = () => T;


/**
 * Function signature for a mark formatter.
 */
export type MarkMapper<T> = (
    mark: AdfMark,
    next: NextMarkFunction<T>,
    parentTextNode: AdfNode, // The 'text' node this mark belongs to
    context: ConversionContext,
    // siblingIndex: number, // Index of parentTextNode among its siblings
    // markIndex: number     // Index of this mark within the node's marks array
) => T;


/**
 * The main Formatter structure.
 */
export interface Formatter<T> {
    /** Default handler for node types not explicitly listed in 'nodes'. */
    defaultNodeMapper: NodeMapper<T>;
    /** Specific handlers mapped by ADF node type. */
    nodes: {
        [nodeType: string]: NodeMapper<T> | undefined;
    };
    /** Specific mark handlers mapped by parent node type (usually 'text') and then mark type. */
    marks: {
        [parentNodeType: string]: {
            [markType: string]: MarkMapper<T> | undefined;
        } | undefined;
    };
}