export async function fetchPublicPageText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "ApplyPilotAI/1.0 public-page-research",
      },
    });

    if (!response.ok) {
      return { ok: false, text: "", warning: `Public page returned ${response.status}. Paste the job description if needed.` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { ok: false, text: "", warning: "Public page is not readable text. Paste the job description instead." };
    }

    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { ok: true, text: text.slice(0, 50_000), warning: "" };
  } catch {
    return { ok: false, text: "", warning: "Could not access the public page. Paste the job description instead." };
  } finally {
    clearTimeout(timeout);
  }
}
