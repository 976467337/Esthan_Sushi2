import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Copy } from "lucide-react";
import { MP_PUBLIC_KEY, processPayment, checkPaymentStatus, type PaymentMethod } from "@/app/payments";
import { formatPrice } from "@/app/cart-data";

const SDK_URL = "https://sdk.mercadopago.com/js/v2";
const BRICK_CONTAINER_ID = "paymentBrick_container";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos esperando o Pix ser pago

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, opts?: { locale?: string }) => {
      bricks: () => {
        create: (
          type: "payment",
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;
function loadMercadoPagoSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o SDK do Mercado Pago"));
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

type PixState = { id: string; qrCode?: string; qrCodeBase64?: string };

export function PaymentStep({
  amount,
  orderId,
  onApproved,
  onCancel,
}: {
  amount: number;
  orderId: string;
  onApproved: (info: { method: PaymentMethod; id: string }) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [copied, setCopied] = useState(false);
  const brickControllerRef = useRef<{ unmount: () => void } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadMercadoPagoSdk()
      .then(() => {
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });

        return mp.bricks().create("payment", BRICK_CONTAINER_ID, {
          initialization: { amount },
          customization: {
            paymentMethods: { creditCard: "all", pix: "all" },
          },
          callbacks: {
            onReady: () => {},
            onError: () => setError("Não conseguimos carregar o pagamento online agora. Tente novamente ou escolha pagar na entrega."),
            onSubmit: ({ selectedPaymentMethod, formData }: { selectedPaymentMethod: string; formData: Record<string, unknown> }) =>
              new Promise<void>((resolve, reject) => {
                processPayment(formData, amount, orderId).then((result) => {
                  if (!result) {
                    setError("Não conseguimos processar o pagamento agora. Tente novamente ou escolha pagar na entrega.");
                    reject();
                    return;
                  }

                  const method: PaymentMethod = selectedPaymentMethod === "pix" ? "pix" : "cartao";

                  if (result.status === "approved") {
                    resolve();
                    onApproved({ method, id: result.id });
                    return;
                  }

                  if ((result.status === "pending" || result.status === "in_process") && method === "pix") {
                    resolve();
                    setPix({ id: result.id, qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 });
                    startPolling(result.id, method);
                    return;
                  }

                  setError("Pagamento não aprovado. Tente com outro cartão ou escolha pagar na entrega.");
                  reject();
                });
              }),
          },
        });
      })
      .then((controller) => {
        if (controller) brickControllerRef.current = controller;
      })
      .catch(() => setError("Não conseguimos carregar o pagamento online agora. Tente novamente ou escolha pagar na entrega."));

    return () => {
      cancelled = true;
      brickControllerRef.current?.unmount();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling(paymentId: string, method: PaymentMethod) {
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Tempo esgotado aguardando o Pix. Se você já pagou, o pedido ainda será confirmado pelo WhatsApp — senão, tente novamente.");
        return;
      }

      const status = await checkPaymentStatus(paymentId);
      if (status?.status === "approved") {
        if (pollRef.current) clearInterval(pollRef.current);
        onApproved({ method, id: paymentId });
      } else if (status?.status === "rejected" || status?.status === "cancelled") {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("O pagamento via Pix não foi concluído. Tente novamente ou escolha pagar na entrega.");
      }
    }, POLL_INTERVAL_MS);
  }

  const copyPixCode = async () => {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — o cliente pode selecionar o texto manualmente */
    }
  };

  if (pix) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">Escaneie o QR code no app do seu banco ou copie o código Pix abaixo:</p>

        {pix.qrCodeBase64 && (
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR code Pix"
            className="w-48 h-48 mx-auto border border-border"
          />
        )}

        {pix.qrCode && (
          <button onClick={copyPixCode}
            className="flex items-center justify-center gap-2 py-3 border border-border text-foreground text-xs tracking-widest uppercase font-semibold hover:border-primary hover:text-primary transition-colors">
            <Copy size={14} /> {copied ? "Código copiado!" : "Copiar código Pix"}
          </button>
        )}

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Loader2 size={14} className="animate-spin" /> Aguardando confirmação do pagamento...
        </div>

        {error && (
          <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/30 px-4 py-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button onClick={onCancel}
          className="text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors self-start">
          Cancelar e pagar na entrega
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border border-border px-4 py-4">
        <span className="text-muted-foreground text-xs tracking-widest uppercase">Total a pagar</span>
        <span className="text-primary font-black text-lg">{formatPrice(amount)}</span>
      </div>

      <div id={BRICK_CONTAINER_ID} />

      {error && (
        <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/30 px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button onClick={onCancel}
        className="text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors self-start">
        Prefiro pagar na entrega
      </button>
    </div>
  );
}
