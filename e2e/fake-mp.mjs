import http from "node:http";
const prefs = new Map(); const payments = new Map(); let nextPay = 9001;
const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x"); let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const auth = req.headers.authorization ?? "";
    if (url.pathname === "/__approve") { // controle do teste: aprova o pagamento de um pedido
      const ref = url.searchParams.get("ref"); const pref = [...prefs.values()].find((p) => p.external_reference === ref);
      if (!pref) return send(res, 404, { message: "sem preferência" });
      const amount = pref.items.reduce((s, i) => s + i.unit_price * i.quantity, 0); const id = nextPay++;
      payments.set(String(id), { id, status: "approved", external_reference: ref, transaction_amount: amount });
      return send(res, 200, { id });
    }
    if (url.pathname === "/__state") return send(res, 200, { prefs: [...prefs.values()], payments: [...payments.values()] });
    if (!auth.startsWith("Bearer TEST-")) return send(res, 401, { message: "invalid_token" });
    if (url.pathname === "/users/me") return send(res, 200, { id: 42, nickname: "LOJA_TESTE", site_id: "MLB" });
    if (url.pathname === "/checkout/preferences" && req.method === "POST") { const b = JSON.parse(raw); const id = "pref_" + (prefs.size + 1); prefs.set(id, { id, ...b }); return send(res, 201, { id, init_point: `http://localhost:4010/pay/${id}` }); }
    const m = url.pathname.match(/^\/v1\/payments\/(\d+)$/); if (m) { const p = payments.get(m[1]); return p ? send(res, 200, p) : send(res, 404, { message: "nf" }); }
    if (url.pathname === "/v1/payments/search") { const ref = url.searchParams.get("external_reference"); return send(res, 200, { results: [...payments.values()].filter((p) => p.external_reference === ref) }); }
    if (url.pathname.startsWith("/pay/")) { res.writeHead(200, { "content-type": "text/html" }); return res.end("<h1>Mercado Pago (simulado)</h1>"); }
    send(res, 404, { message: "nf" });
  });
}).listen(4010, () => console.log("fake MP :4010"));
