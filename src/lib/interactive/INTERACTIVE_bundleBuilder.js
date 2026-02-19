// FILE: src/lib/interactive/INTERACTIVE_bundleBuilder.js
// DESCRIPTION: Sanitise raw HTML bundles returned by the model
// RESPONSIBILITY: One task — strip dangerous scripts and inject CSP meta. That's all.
//
// SECURITY NOTES:
//   - Remote <script src> tags from unapproved hosts are removed entirely.
//   - Inline <script> blocks are preserved (sandboxed in IframeSandbox at render time).
//   - A strict CSP <meta> is injected into <head> to further restrict execution.
//   - This module must NEVER be used to render HTML in the main document — always
//     pass safeHtml to INTERACTIVE_IframeSandbox which renders inside a sandboxed iframe.

// Whitelist of trusted CDN hostnames allowed by <script src>
const APPROVED_SCRIPT_HOSTS = [
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com',
];

// Strict CSP meta tag injected into every bundle
const CSP_META =
    '<meta http-equiv="Content-Security-Policy" ' +
    'content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\';">';

/**
 * Sanitise a raw HTML string from the model.
 *
 * @param {string} rawHtml — possibly unsafe HTML from LLM
 * @returns {{ safeHtml: string, warnings: string[] }}
 */
export function sanitizeBundle(rawHtml) {
    console.log('INTERACTIVE: sanitizeBundle called', { rawHtmlLength: rawHtml?.length });

    if (!rawHtml || typeof rawHtml !== 'string') {
        console.error('INTERACTIVE ERROR: sanitizeBundle received non-string input', { rawHtml });
        return { safeHtml: '', warnings: ['Input was not a string'] };
    }

    const warnings = [];
    let html = rawHtml;

    // Remove <script src="..."> tags whose host is NOT in the whitelist
    // This regex matches both single and double quotes around the src attribute
    html = html.replace(
        /<script\s[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/script>/gi,
        (match, src) => {
            try {
                const url = new URL(src);
                if (APPROVED_SCRIPT_HOSTS.includes(url.hostname)) {
                    return match; // Allowed — keep as-is
                }
                const warning = `Removed remote script from unapproved host: ${url.hostname}`;
                console.warn('INTERACTIVE:', warning);
                warnings.push(warning);
                return `<!-- INTERACTIVE: removed script from ${url.hostname} -->`;
            } catch {
                // Relative or malformed URL — remove to be safe
                const warning = `Removed script with unparseable src: ${src}`;
                console.warn('INTERACTIVE:', warning);
                warnings.push(warning);
                return `<!-- INTERACTIVE: removed script with unparseable src -->`;
            }
        }
    );

    // Inject CSP <meta> into <head> if present; otherwise prepend to document
    if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/(<head[^>]*>)/i, `$1\n  ${CSP_META}`);
    } else {
        html = CSP_META + '\n' + html;
        warnings.push('No <head> tag found — prepended CSP meta to document start');
    }

    console.log('INTERACTIVE: sanitizeBundle complete', {
        warningCount: warnings.length,
        safeHtmlLength: html.length,
    });

    return { safeHtml: html, warnings };
}
