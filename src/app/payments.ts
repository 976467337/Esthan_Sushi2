const PAYMENT_API = "https://esthan-depoimentos.rieres.workers.dev";

// TODO: colar aqui a Public Key de produção (ou de teste) do Mercado Pago assim que o dono
// confirmar a conta. Ver worker/PAYMENTS_SETUP.md para o passo a passo completo.
// Enquanto ficar vazia, o botão "Pagar agora" não aparece no site (só "Pagar na entrega").
export const MP_PUBLIC_KEY = "";

export function isPaymentConfigured(): boolean {
  return Boolean(MP_PUBLIC_KEY);
}

export type PaymentMethod = "pix" | "cartao";

export type PaymentResult = {
  id: string;
  status: string; // "approved" | "pending" | "in_process" | "rejected" | ...
  statusDetail?: string;
  qrCode?: string; // Pix copia-e-cola
  qrCodeBase64?: string; // Pix QR code (imagem em base64)
};

// formData vem pronto do Payment Brick (token do cartão, payment_method_id, payer, etc.) —
// só completamos com o valor total e uma referência do nosso pedido.
export async function processPayment(
  formData: Record<string, unknown>,
  amount: number,
  orderId: string
): Promise<PaymentResult | null> {
  try {
    const resp = await fetch(`${PAYMENT_API}/payment/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        transaction_amount: amount,
        description: "Pedido Esthan Sushi",
        external_reference: orderId,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) return null;

    return {
      id: String(data.id),
      status: data.status,
      statusDetail: data.status_detail,
      qrCode: data.qrCode,
      qrCodeBase64: data.qrCodeBase64,
    };
  } catch {
    return null;
  }
}

export async function checkPaymentStatus(id: string): Promise<{ status: string; statusDetail?: string } | null> {
  try {
    const resp = await fetch(`${PAYMENT_API}/payment/status?id=${encodeURIComponent(id)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return { status: data.status, statusDetail: data.status_detail };
  } catch {
    return null;
  }
}
