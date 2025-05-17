"# ADR: PDF Generation Strategy for Appraisal Reports

## Date: 2024-05-20

## Status: Accepted

## Context

We need to enhance the PDF generation capability for property appraisal reports. The current implementation uses pdfMake, but we need to evaluate if this is still the best approach given our new requirements for:

1. Agency/agent branding integration
2. Enhanced visual design with modern layouts
3. Complex data visualizations for market trends 
4. Integration of CoreLogic and AI-generated content
5. High-quality image handling

Two main approaches were considered:
1. Continue with pdfMake library
2. Use a browser-based approach with Puppeteer/Playwright

## Decision

We will use **Puppeteer** for generating PDF reports for the following reasons:

1. **Design Flexibility**: Puppeteer allows us to use standard HTML/CSS for layout, which provides significantly more design flexibility compared to pdfMake's more limited options.

2. **Familiar Technology**: Our team is already proficient in HTML/CSS, making development and maintenance more straightforward.

3. **Visual Consistency**: Using HTML/CSS ensures the PDF output can closely match our web UI aesthetic.

4. **Complex Layouts**: HTML/CSS is better suited for the complex layouts required in our enhanced report design.

5. **Image Handling**: Puppeteer provides better support for high-quality images and proper scaling.

6. **Charts & Visualizations**: We can leverage standard web charting libraries (Chart.js) which integrate seamlessly with Puppeteer.

7. **CSS Variables**: We can use CSS variables to easily implement dynamic branding (agency colors, etc.).

## Consequences

### Positive

- Higher quality, more visually appealing reports
- Easier implementation of complex layouts and data visualizations
- Better support for dynamic branding elements
- More maintainable code using standard web technologies
- Easier to preview templates during development (just open in browser)

### Negative

- Increased dependency size (Puppeteer is larger than pdfMake)
- Potentially higher memory usage during PDF generation
- Edge Functions may require special configuration to support Puppeteer (Deno Deploy limits)
- May need to implement careful error handling for browser rendering issues

### Mitigation Strategies

1. **Edge Function Limits**: We'll use Puppeteer's lightweight core (`puppeteer-core`) and manage browser instances carefully.
   
2. **Performance Optimization**: We'll implement caching strategies to avoid regenerating PDFs unnecessarily.

3. **Error Handling**: We'll add comprehensive error handling and logging to identify and address any rendering issues quickly.

## Alternatives Considered

### pdfMake (Current Solution)

- **Pros**: Lighter weight, already implemented, simpler to use for basic reports
- **Cons**: More limited styling capabilities, harder to implement complex layouts, less flexible for dynamic branding

### PDF Generation Service

- **Pros**: Would offload resource-intensive PDF generation from Edge Functions
- **Cons**: Added complexity, additional infrastructure to maintain, increased costs

## Implementation Plan

1. Create an HTML/CSS template for the new report design
2. Implement Puppeteer in the Edge Function environment
3. Create a function to dynamically populate the HTML template with appraisal data and branding
4. Generate and store the PDF in Supabase Storage
5. Implement caching to avoid unnecessary regeneration" 
