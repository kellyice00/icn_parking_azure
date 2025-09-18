// api/icn-parking/index.js (Azure Functions v4, Node 18+)
// 브라우저 → /api/icn-parking → 여기서 data.go.kr 호출(서비스키는 환경변수)
export default async function (context, req) {
  try {
    const pageNo = req.query.pageNo || '1';
    const numOfRows = req.query.numOfRows || '100';
    const type = req.query.type || 'json';
    const serviceKey = process.env.DATA_GOKR_KEY;
    if (!serviceKey) {
      context.res = { status: 500, body: { error: '환경변수 DATA_GOKR_KEY 미설정' } };
      return;
    }

    const base = 'https://apis.data.go.kr/B551177/StatusOfParking/getTrackingParking';
    const url = `${base}?pageNo=${encodeURIComponent(pageNo)}&numOfRows=${encodeURIComponent(numOfRows)}&type=${encodeURIComponent(type)}&serviceKey=${encodeURIComponent(serviceKey)}`;

    const r = await fetch(url); // Node 18+ 에서 글로벌 fetch 사용 가능
    if (!r.ok) throw new Error('Upstream ' + r.status);
    const raw = await r.json();

    const items = raw?.response?.body?.items?.item || [];
    const rows = items.map(it => ({
      floor: it.floor,
      parking: Number(it.parking),
      parkingarea: Number(it.parkingarea),
      datetm: it.datetm
    }));

    context.res = {
      headers: { 'Cache-Control': 'public, max-age=30' },
      body: { count: rows.length, rows }
    };
  } catch (e) {
    context.res = { status: 500, body: { error: e.message || 'Unknown error' } };
  }
}
