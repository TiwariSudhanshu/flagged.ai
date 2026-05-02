import { getWalletSummary, recharge, RECHARGE_PACKS } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { totalCredits, keys, transactions } = await getWalletSummary();
    return Response.json({
      totalCredits,
      packs: RECHARGE_PACKS,
      keys: keys.map((k) => ({
        id: k._id.toString(),
        name: k.name,
        preview: k.key.slice(0, 8) + "••••" + k.key.slice(-4),
        credits: k.credits || 0,
        requests: k.requests || 0,
        createdAt: k.createdAt,
      })),
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        keyName: t.keyName,
        type: t.type,
        credits: t.credits,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { keyId, credits } = await request.json();
    if (!keyId || !credits || Number(credits) < 1) {
      return Response.json({ error: "keyId and credits required" }, { status: 400 });
    }
    const valid = RECHARGE_PACKS.some((p) => p.credits === Number(credits));
    if (!valid) {
      return Response.json({ error: "Invalid pack amount" }, { status: 400 });
    }
    const result = await recharge(keyId, Number(credits));
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
