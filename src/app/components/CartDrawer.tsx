import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Trash2, ShoppingBag, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Heart, Clock } from "lucide-react";
import { cartTotal, formatPrice, lineTotal, DELIVERY_FEE, type CartLine, type DeliveryMode } from "@/app/cart-data";
import { geocodeAddress, estimateDelivery, lookupCep, RESTAURANT_ADDRESS, type CepResult } from "@/app/delivery";
import { isWithinBusinessHours, nextOpeningLabel } from "@/app/business-hours";

type Status = "idle" | "checking" | "error" | "confirmed";
type CepStatus = "idle" | "checking" | "error" | "found";

export function CartDrawer({
  cart,
  onUpdateQty,
  onRemove,
  onCheckout,
}: {
  cart: CartLine[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (customerName: string, deliveryMode: DeliveryMode, address: string, etaMinutes?: number, scheduledFor?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "closed" | "name" | "mode" | "address">("cart");
  const [scheduled, setScheduled] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode | null>(null);
  const [addressMode, setAddressMode] = useState<"cep" | "manual">("cep");

  const [cep, setCep] = useState("");
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const [cepData, setCepData] = useState<CepResult | null>(null);

  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedAddress, setConfirmedAddress] = useState("");
  const [etaMinutes, setEtaMinutes] = useState<number | undefined>(undefined);

  const itemCount = cart.reduce((sum, l) => sum + l.qty, 0);

  const resetAddressStep = () => {
    setDeliveryMode(null);
    setAddressMode("cep");
    setCep("");
    setCepStatus("idle");
    setCepData(null);
    setRua("");
    setBairro("");
    setNumero("");
    setComplemento("");
    setStatus("idle");
    setErrorMsg("");
    setConfirmedAddress("");
    setEtaMinutes(undefined);
  };

  const goToNameStep = () => {
    resetAddressStep();
    if (!isWithinBusinessHours()) {
      setStep("closed");
      return;
    }
    setScheduled(false);
    setStep("name");
  };

  const scheduleOrderAnyway = () => {
    setScheduled(true);
    setStep("name");
  };

  const confirmName = () => {
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setStep("mode");
  };

  const chooseMode = (mode: DeliveryMode) => {
    setDeliveryMode(mode);
    if (mode === "pickup") {
      setConfirmedAddress(RESTAURANT_ADDRESS);
      setEtaMinutes(undefined);
      setStatus("confirmed");
    } else {
      setStatus("idle");
    }
    setStep("address");
  };

  const handleCepLookup = async () => {
    setCepStatus("checking");
    const result = await lookupCep(cep);
    if (!result.found) {
      setCepStatus("error");
      return;
    }
    setCepData(result);
    setCepStatus("found");
  };

  const confirmAddressFromCep = async () => {
    if (!numero.trim()) {
      setStatus("error");
      setErrorMsg("Preencha o número do imóvel.");
      return;
    }
    setStatus("checking");

    const complementoText = complemento.trim() ? ` (${complemento.trim()})` : "";
    const fullAddress = `${cepData!.rua}, ${numero.trim()}${complementoText} - ${cepData!.bairro}, ${cepData!.cidade} - ${cepData!.uf}`;
    const searchAddress = `${cepData!.rua}, ${numero.trim()}, ${cepData!.bairro}, ${cepData!.cidade}, ${cepData!.uf}`;

    const geo = await geocodeAddress(searchAddress);
    const eta = !scheduled && geo.found && geo.lat != null && geo.lon != null ? await estimateDelivery(geo.lat, geo.lon) : null;

    setEtaMinutes(eta?.totalMinutes);
    setConfirmedAddress(fullAddress);
    setStatus("confirmed");
  };

  const verifyAddressManual = async () => {
    if (!rua.trim() || !numero.trim() || !bairro.trim()) {
      setStatus("error");
      setErrorMsg("Preencha rua, número e bairro pra gente validar o endereço.");
      return;
    }

    setStatus("checking");
    const complementoText = complemento.trim() ? ` (${complemento.trim()})` : "";
    const fullAddress = `${rua.trim()}, ${numero.trim()}${complementoText} - ${bairro.trim()}, São Paulo, SP`;
    const searchAddress = `${rua.trim()}, ${numero.trim()}, ${bairro.trim()}, São Paulo, SP`;

    const geo = await geocodeAddress(searchAddress);
    if (!geo.found || geo.lat == null || geo.lon == null) {
      setStatus("error");
      setErrorMsg("Não conseguimos localizar esse endereço. Confira o nome da rua, o número e o bairro e tente de novo.");
      return;
    }

    const eta = scheduled ? null : await estimateDelivery(geo.lat, geo.lon);
    setEtaMinutes(eta?.totalMinutes);
    setConfirmedAddress(fullAddress);
    setStatus("confirmed");
  };

  const switchToManual = () => {
    setAddressMode("manual");
    setCepStatus("idle");
    setCepData(null);
    setStatus("idle");
    setErrorMsg("");
  };

  const switchToCep = () => {
    setAddressMode("cep");
    setStatus("idle");
    setErrorMsg("");
  };

  const handleClose = () => {
    setOpen(false);
    setStep("cart");
    setScheduled(false);
  };

  const handleCheckout = () => {
    onCheckout(customerName.trim(), deliveryMode!, confirmedAddress, etaMinutes, scheduled ? nextOpeningLabel() : undefined);
    setCustomerName("");
    setScheduled(false);
    handleClose();
  };

  return (
    <>
      {itemCount > 0 && (
        <button onClick={() => setOpen(true)}
          className="cart-attention fixed bottom-6 right-6 z-[65] w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:brightness-110 transition-all">
          <ShoppingBag size={24} />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#1a0f05] text-white text-xs font-bold flex items-center justify-center border-2 border-background">
            {itemCount}
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md h-full bg-card border-l border-border p-6 md:p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {step !== "cart" && (
                    <button onClick={() => setStep(step === "address" ? "mode" : step === "mode" ? "name" : "cart")} className="text-muted-foreground hover:text-primary transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h3 className="text-foreground text-xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {step === "cart" ? "Seu pedido"
                      : step === "closed" ? "Estamos fechados"
                      : step === "name" ? "Quem está pedindo?"
                      : step === "mode" ? "Entrega ou retirada?"
                      : deliveryMode === "pickup" ? "Retirada no local" : "Endereço de entrega"}
                  </h3>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-primary transition-colors">
                  <X size={22} />
                </button>
              </div>

              {step === "cart" && (
                <>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Seu carrinho está vazio.</p>
                  ) : (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                      {cart.map((line) => (
                        <div key={line.id} className="border-b border-border pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-foreground text-sm font-semibold">{line.name}</p>
                              {line.extras && line.extras.length > 0 && (
                                <p className="text-muted-foreground text-xs mt-0.5">{line.extras.join(", ")}</p>
                              )}
                            </div>
                            <button onClick={() => onRemove(line.id)} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 border border-border px-2 py-1">
                              <button onClick={() => onUpdateQty(line.id, Math.max(1, line.qty - 1))} className="text-foreground hover:text-primary transition-colors">
                                <Minus size={14} />
                              </button>
                              <span className="text-foreground text-sm w-4 text-center">{line.qty}</span>
                              <button onClick={() => onUpdateQty(line.id, line.qty + 1)} className="text-foreground hover:text-primary transition-colors">
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-primary font-bold text-sm">{formatPrice(lineTotal(line))}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="pt-6 mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-foreground font-semibold uppercase tracking-widest text-sm">Total</span>
                        <span className="text-primary font-black text-xl">{formatPrice(cartTotal(cart))}</span>
                      </div>
                      <button onClick={goToNameStep}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                        <ShoppingBag size={16} /> Continuar para entrega
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === "closed" && (
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <div className="flex flex-col gap-4 items-center text-center py-4">
                    <Heart size={36} className="text-primary" />
                    <p className="text-foreground text-base leading-relaxed">
                      No momento estamos fechados.
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Funcionamos de segunda a sábado, das 19h30 às 23h30. Você pode voltar mais tarde,
                      ou deixar seu pedido registrado agora e preparamos assim que abrirmos ({nextOpeningLabel()}).
                    </p>

                    <button onClick={scheduleOrderAnyway}
                      className="w-full mt-2 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <Clock size={14} /> Deixar pedido agendado
                    </button>
                    <button onClick={() => setStep("cart")}
                      className="w-full py-3 border border-border text-foreground text-xs tracking-widest uppercase font-semibold hover:border-primary hover:text-primary transition-colors">
                      Voltar mais tarde
                    </button>
                  </div>
                </div>
              )}

              {step === "name" && (
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <div className="flex flex-col gap-4">
                    <p className="text-muted-foreground text-sm">Antes de continuar, como você se chama?</p>
                    <div>
                      <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Seu nome</label>
                      <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setNameError(false); }}
                        placeholder="Nome completo" onKeyDown={(e) => e.key === "Enter" && confirmName()}
                        className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                    </div>

                    {nameError && (
                      <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/30 px-4 py-3">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>Preencha seu nome pra gente continuar.</span>
                      </div>
                    )}

                    <button onClick={confirmName}
                      className="py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {step === "mode" && (
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <div className="flex flex-col gap-4">
                    <p className="text-muted-foreground text-sm">Como você prefere receber seu pedido?</p>

                    <button onClick={() => chooseMode("delivery")}
                      className="flex items-center justify-between gap-3 border border-border px-4 py-4 hover:border-primary/40 transition-colors text-left">
                      <div>
                        <p className="text-foreground text-sm font-semibold">Entrega</p>
                        <p className="text-muted-foreground text-xs mt-1">Receba no seu endereço</p>
                      </div>
                      <span className="text-primary font-bold text-sm whitespace-nowrap">+ {formatPrice(DELIVERY_FEE)}</span>
                    </button>

                    <button onClick={() => chooseMode("pickup")}
                      className="flex items-center justify-between gap-3 border border-border px-4 py-4 hover:border-primary/40 transition-colors text-left">
                      <div>
                        <p className="text-foreground text-sm font-semibold">Retirar no local</p>
                        <p className="text-muted-foreground text-xs mt-1">{RESTAURANT_ADDRESS}</p>
                      </div>
                      <span className="text-muted-foreground text-xs font-semibold uppercase whitespace-nowrap">Sem taxa</span>
                    </button>
                  </div>
                </div>
              )}

              {step === "address" && status !== "confirmed" && (
                <div className="flex-1 flex flex-col overflow-y-auto">
                  {addressMode === "cep" ? (
                    <div className="flex flex-col gap-4">
                      {cepStatus !== "found" ? (
                        <>
                          <div>
                            <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">CEP</label>
                            <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" inputMode="numeric" maxLength={9}
                              className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                          </div>

                          {cepStatus === "error" && (
                            <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/30 px-4 py-3">
                              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                              <span>CEP não encontrado. Confira o número ou preencha o endereço manualmente.</span>
                            </div>
                          )}

                          <button onClick={handleCepLookup} disabled={cepStatus === "checking"}
                            className="py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {cepStatus === "checking" ? (
                              <><Loader2 size={16} className="animate-spin" /> Buscando CEP...</>
                            ) : (
                              "Buscar CEP"
                            )}
                          </button>

                          <button onClick={switchToManual}
                            className="text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors self-start">
                            Não sei o CEP, preencher manualmente
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-3 border border-primary/30 bg-primary/5 px-4 py-4">
                            <CheckCircle2 size={20} className="text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-foreground text-sm font-semibold">{cepData!.rua}</p>
                              <p className="text-muted-foreground text-xs mt-1">{cepData!.bairro} · {cepData!.cidade} - {cepData!.uf}</p>
                            </div>
                          </div>

                          <div>
                            <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Número</label>
                            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123"
                              className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                          </div>
                          <div>
                            <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Complemento (apto, bloco, casa)</label>
                            <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Ex: Apto 42, Torre B, Casa 2..."
                              className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                          </div>

                          {status === "error" && (
                            <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/30 px-4 py-3">
                              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                              <span>{errorMsg}</span>
                            </div>
                          )}

                          <button onClick={confirmAddressFromCep} disabled={status === "checking"}
                            className="py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {status === "checking" ? (
                              <><Loader2 size={16} className="animate-spin" /> Calculando entrega...</>
                            ) : (
                              "Confirmar endereço"
                            )}
                          </button>

                          <button onClick={() => setCepStatus("idle")}
                            className="text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors self-start">
                            Corrigir CEP
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Rua</label>
                        <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Ex: Rua das Flores"
                          className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Número</label>
                          <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123"
                            className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Bairro</label>
                          <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Vila Nova Cachoeirinha"
                            className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Complemento (apto, bloco, casa)</label>
                        <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Ex: Apto 42, Torre B, Casa 2..."
                          className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                      </div>

                      {status === "error" && (
                        <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/30 px-4 py-3">
                          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <button onClick={verifyAddressManual} disabled={status === "checking"}
                        className="py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {status === "checking" ? (
                          <><Loader2 size={16} className="animate-spin" /> Validando endereço...</>
                        ) : (
                          "Verificar endereço"
                        )}
                      </button>

                      <button onClick={switchToCep}
                        className="text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors self-start">
                        Já sei o CEP
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === "address" && status === "confirmed" && (
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 border border-primary/30 bg-primary/5 px-4 py-4">
                      <CheckCircle2 size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          {deliveryMode === "pickup" ? "Retirada no local" : "Endereço confirmado"}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{confirmedAddress}</p>
                      </div>
                    </div>

                    {scheduled ? (
                      <div className="flex items-start gap-3 border border-primary/30 bg-primary/5 px-4 py-4">
                        <Clock size={20} className="text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground text-sm font-semibold">Pedido agendado</p>
                          <p className="text-muted-foreground text-xs mt-1">Vamos preparar assim que abrirmos, {nextOpeningLabel()}.</p>
                        </div>
                      </div>
                    ) : deliveryMode === "delivery" && etaMinutes ? (
                      <div className="border border-border px-4 py-4">
                        <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">Tempo estimado de entrega</p>
                        <p className="text-primary text-2xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>~{etaMinutes} min</p>
                        <p className="text-muted-foreground text-xs mt-1">Já incluindo o preparo do pedido</p>
                      </div>
                    ) : deliveryMode === "delivery" ? (
                      <p className="text-muted-foreground text-xs">Endereço confirmado — o tempo estimado será combinado direto no WhatsApp.</p>
                    ) : null}

                    <div className="border border-border px-4 py-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatPrice(cartTotal(cart))}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de entrega</span>
                        <span className="text-foreground">{deliveryMode === "delivery" ? formatPrice(DELIVERY_FEE) : "Sem taxa"}</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-border">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{formatPrice(cartTotal(cart) + (deliveryMode === "delivery" ? DELIVERY_FEE : 0))}</span>
                      </div>
                    </div>

                    <button onClick={() => (deliveryMode === "pickup" ? setStep("mode") : setStatus("idle"))}
                      className="text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors self-start">
                      {deliveryMode === "pickup" ? "Trocar forma de recebimento" : "Corrigir endereço"}
                    </button>

                    <button onClick={handleCheckout}
                      className="mt-2 py-4 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <ShoppingBag size={16} /> Confirmar pedido pelo WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
