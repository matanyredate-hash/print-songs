module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let target;
  try {
    target = new URL(String(req.query.url || ""));
  } catch {
    res.status(400).json({ error: "קישור לא תקין" });
    return;
  }

  const host = target.hostname.toLowerCase().replace(/^www\./, "");
  const allowedHosts = new Set(["negina.co.il", "naganu.com"]);
  if (!["http:", "https:"].includes(target.protocol) || !allowedHosts.has(host)) {
    res.status(400).json({ error: "אפשר לטעון קישורים מ־Negina או נגנו בלבד" });
    return;
  }

  try {
    const response = await fetch(target.href, {
      redirect: "error",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SongPrintHelper/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      res.status(502).json({ error: "אתר המקור החזיר שגיאה: " + response.status });
      return;
    }

    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) {
      res.status(415).json({ error: "הקישור אינו מחזיר דף HTML" });
      return;
    }

    const html = await response.text();
    if (html.length > 3_000_000) {
      res.status(413).json({ error: "דף המקור גדול מדי" });
      return;
    }
    res.status(200).json({ html });
  } catch (error) {
    res.status(502).json({
      error: "לא הצלחתי לקרוא את אתר המקור. ייתכן שהוא חוסם טעינה אוטומטית; אפשר לפתוח את הקישור ולהדביק את הטקסט.",
    });
  }
};
