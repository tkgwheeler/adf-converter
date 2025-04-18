import { markdownFormatter } from "./md-formatter";
import { processADF } from "./process-adf";
import { AdfDoc } from "./types";



// Example ADF Input (use your previous exampleAdf)
const exampleAdf: AdfDoc = {
  version: 1,
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Main Heading with *special* chars" }]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a paragraph with " },
        { type: "text", marks: [{ type: "strong" }], text: "bold text" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "em" }], text: "italic text" },
        { type: "text", text: ", a " },
        { type: "text", marks: [{ type: "link", attrs: { href: "https://www.atlassian.com" } }], text: "link with [brackets]" },
        { type: "text", text: ", and a " },
        { type: "text", marks: [{ type: "code" }], text: "`code` snippet" },
        { type: "text", text: "." }
      ]
    },
     {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Item 1" }] }
          ]
        },
        {
          type: "listItem", // Item 2
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Item 2" }] },
            {
                type: "orderedList", // Nested list
                attrs: { order: 1 }, // Optional: starting number
                content: [
                    {
                        type: "listItem", // Nested item 2.1
                        content: [ { type: "paragraph", content: [ { type: "text", text: "Nested Item 2.1"} ]}]
                    },
                     {
                        type: "listItem", // Nested item 2.2
                        content: [ { type: "paragraph", content: [ { type: "text", text: "Nested Item 2.2"} ]}]
                    }
                ]
            },
            { type: "paragraph", content: [{ type: "text", text: "After nested list." }] }
          ]
        }
      ]
    },
    // ... add other nodes from your previous example if needed
  ]
};


// Convert it using the new structure
const markdownOutput = processADF(exampleAdf, markdownFormatter);

console.log(markdownOutput);