export async function searchWeb(query) {
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const html = await response.text();
        
        // Extremely basic regex extraction of snippets (to avoid complex dependencies)
        const results = [];
        const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
        let match;
        while ((match = regex.exec(html)) !== null && results.length < 3) {
            // Strip HTML tags
            let text = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
            results.push(text);
        }
        
        return results;
    } catch (error) {
        console.error("Web search failed:", error);
        return [];
    }
}
