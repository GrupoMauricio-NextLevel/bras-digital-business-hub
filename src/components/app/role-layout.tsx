import { agenciasLigado } from "@/lib/agencias/acesso";
import { canJoinGroup } from "@/lib/domain/conta-grupo";
import { AppShell } from "@/components/app/app-shell";
import { listDemoUsers, loginAs, logout } from "@/app/actions/auth";
import { globalSearchAction } from "@/app/actions/search";
import { isDemoMode, type Session } from "@/lib/auth";
import { isRecordingMode } from "@/lib/gravacao-server";
import { type FeatureKey } from "@/lib/features";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { storeUrl } from "@/lib/store-url";
import { BRAS_ADMIN_NAV, COMMERCE_ADMIN_NAV, COMMERCE_STORE_NAV, MASTER_ECOMMERCE_NAV, NAV, STAFF_NAV_PREFIXES, comNaoLidas, navDoMasterPorMarca, navDoNegocio, navForBrand, type Panel } from "@/lib/nav";
import { modulosDoNegocio } from "@/lib/business/modulos";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { getBrand, marcaDoMaster } from "@/lib/brand-server";
import { SeletorNegocios } from "@/components/master/seletor-negocios";
import { marcasAtivasNoMaster } from "@/lib/master-marca";
import { brandByCode } from "@/lib/brand";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { recentNotices } from "@/lib/queries/notifications";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";
import { brandOfStore } from "@/lib/store-brand";
import { SupportBar } from "@/components/support/support-bar";
import { ecosystemBar, type EcoBrand } from "@/lib/domain/ecossistema/lancador";
import { BarraEcossistema } from "@/components/ecossistema/barra";
import { masterPathAllowed } from "@/lib/master-equipe";
import type { NavItem } from "@/lib/nav";
import { mauricioDaLoja } from "@/lib/domain/ia";
import { BotaoMauricio } from "@/components/ia/mauricio";
import { AjudaLojista } from "@/components/ajuda/ajuda-lojista";
import { AvisoSonoro } from "@/components/master/aviso-sonoro";
import { supportContacts } from "@/lib/support";
import { naoLidasDaEntrada } from "@/lib/integrations/hostinger-mail";
import { AreaTheme } from "@/design-system/components/area-theme";
import { PainelTech } from "@/components/app/painel-tech";
import { FaixaBlack } from "@/components/black/faixa-black";
import { blackAgora } from "@/lib/domain/campanha-black";
import { negociosAbertos } from "@/lib/negocios";

/** Painel (clima visual) do usuário: fornecedor e lojista variam por perfil. */
export function panelFor(session: Session): Panel {
  if (session.user.role === "NEXTLEVEL_MASTER") return "master";
  if (session.user.role === "SUPPLIER_ADMIN") return "supplier";
  if (session.user.role === "SUPPLIER_DISPATCH") return "dispatch";
  if (session.user.role === "AFFILIATE" || session.user.role === "AGENCY") return "partner";
  return session.store?.offer === "STORE_OWN" ? "pro" : "lite";
}

/** Itens do menu do lojista e o recurso que os libera; sem o recurso aparecem com cadeado. */
const MERCHANT_GATES: Record<string, FeatureKey> = { "/merchant/analytics": "analytics", "/merchant/storefront": "storefront", "/theme-editor": "appearanceBasic", "/merchant/templates": "templatesStarter" };

export async function RoleLayout({ session, children, banner, scope, tenant, ocultar, renomear, rotuloPainel }: { session: Session; children: React.ReactNode; banner?: React.ReactNode; /** "commerce-admin" / "bras-admin" = console administrativo da marca dentro do Master. */ scope?: "commerce-admin" | "bras-admin"; /** Nome e linha de baixo do canto do painel quando a sessão não tem loja nem fornecedor (Painel da Agência, D313). */ tenant?: { name: string; sub: string }; /** Itens do menu que esta pessoa não usa (função da agência, D317). */ ocultar?: string[]; /** Novos nomes de itens do menu e do painel (personalização da agência, D340). */ renomear?: Record<string, string>; rotuloPainel?: string }) {
  // Libera reservas de pedidos não pagos vencidos (rede de segurança além do cron).
  const db = await getDb();
  await expireStaleReservations(db);
  const nav = NAV[session.user.role];
  const sup = session.support;
  const supportBar = sup ? <SupportBar clientName={session.user.name} roleLabel={session.store?.name ?? session.supplier?.name ?? nav.label} operatorName={sup.operatorName} reason={sup.reason} act={sup.act} until={new Date(sup.exp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} /> : null;
  // Barra do ecossistema (D129): só nos painéis de cliente (lojista, Meu Brás, transportadora, importadora), ligada por marca.
  const ecoBrand: EcoBrand | null = session.user.role === "BRAS_MEMBER" || session.user.role === "BRAS_IMPORTER" ? "BRAS_DIGITAL" : session.user.role === "CARRIER" ? "NEXTLEVEL_CARGAS" : session.user.role === "STORE_OWNER" && session.store ? (session.store.networkId ? "SUPERDROP" : "NEXTLEVEL_COMMERCE") : null;
  const eco = await ecosystemBar(db, ecoBrand, new Date(), session.support ? undefined : session.user.id);
  const ecoBar = eco ? <BarraEcossistema bar={eco} /> : null;
  // Equipe do Master (D138): o menu mostra só as telas da função.
  const fn = session.user.role === "NEXTLEVEL_MASTER" ? session.user.masterFunction : null;
  const black = (await blackAgora(db)).ativa;
  const byFn = (list: NavItem[]) => (fn ? list.filter((i) => masterPathAllowed(fn, i.href)) : list);
  const store = session.store;
  // A marca do lojista pertence à organização da loja, não ao hostname técnico.
  // Isso impede uma loja Commerce de herdar identidade e navegação SuperDrop.
  // Painel da Agência (D313): a agência é cliente da NextLevel Commerce, não da marca do endereço técnico.
  const brand = store ? await brandOfStore(db, store) : session.user.role === "AGENCY" ? brandByCode("NEXTLEVEL_COMMERCE") : await getBrand();
  // Perfil da loja (D172): uma resposta só para marca, modalidade e o que a loja pode usar.
  const perfil = store ? await perfilAtual(store.id) : null;
  const independent = !!store && store.kind === "SUPPLIER_OWN" && !!perfil?.independente;
  const ownItems = store?.kind === "SUPPLIER_OWN" ? nav.items.filter((i) => i.href !== "/merchant/wallet") : nav.items;
  // Conta simples: "Meus produtos" cadastra o que vende; "Preços e publicação" escolhe o que aparece na loja.
  const navItems = independent ? ownItems.flatMap((i) => i.href === "/merchant/products" ? [{ ...i, label: "Preços e publicação" }, { label: "Meus produtos", href: "/merchant/catalogo", icon: "Package" as const, group: i.group }] : [i]) : ownItems;
  // Equipe da loja: só o que é operação do dia a dia (o servidor também bloqueia o resto).
  const STAFF_OK = ["/merchant/orders", "/merchant/products", "/merchant/catalogo", "/merchant/customers", "/merchant/labels", "/merchant/after-sales", "/merchant/avaliacoes", "/merchant/avise-me", "/merchant/content"];
  const visible = session.user.role === "STORE_OWNER" && session.user.storeRole === "STAFF" ? navItems.filter((i) => STAFF_OK.some((p) => i.href.startsWith(p))) : navItems;
  // Master único (R2): a marca escolhida no seletor do topo enxuga o menu.
  const isMaster = session.user.role === "NEXTLEVEL_MASTER";
  const marcaMaster = isMaster ? await marcaDoMaster() : null;
  // Master trancado só na Commerce (D203): o menu do escritório em 7 áreas, uma casca só (o console /commerce usa o mesmo menu).
  const escritorioEc = isMaster && marcaMaster === "NEXTLEVEL_COMMERCE" && marcasAtivasNoMaster().length === 1;
  const itemsBase = escritorioEc ? byFn(MASTER_ECOMMERCE_NAV) : navForBrand(store ? visible.map((i) => (MERCHANT_GATES[i.href] && !perfil!.pode[MERCHANT_GATES[i.href]!] ? { ...i, locked: true } : i)) : navDoMasterPorMarca(byFn(nav.items), marcaMaster, marcasAtivasNoMaster().length === 1), brand);
  // D297: não lidos da caixa de e-mail no menu, só para o dono (a caixa é só dele).
  // Painel da Agência (D313): o item "Agências" do Master só existe com a chave AGENCIAS_V1.
  const itemsComChave = (agenciasLigado() ? itemsBase : itemsBase.filter((i) => i.href !== "/master/agencias")).filter((i) => !ocultar?.includes(i.href)).map((i) => (renomear?.[i.href] ? { ...i, label: renomear[i.href]! } : i));
  const items = isMaster && !fn && !session.support ? comNaoLidas(itemsComChave, await naoLidasDaEntrada()) : itemsComChave;
  const storefrontHref = store && perfil?.pode.storefront ? storeUrl(store.slug, store.offer, store.customDomain, store.domainStatus) : undefined;
  const commerceStore = session.user.role === "STORE_OWNER" && !!store && brand.code === "NEXTLEVEL_COMMERCE";
  // Maurício (IA0, D194): na loja independente da Commerce e para o dono no Master. Visível; o plano decide o que destrava.
  const mauricio = (commerceStore && independent) || (isMaster && !fn && !sup) ? await mauricioDaLoja(db, isMaster ? null : store!.id, { master: isMaster }) : null;
  // Parceiro da Commerce (D253): o Maurício guia o dia a dia pelo manual do parceiro, sem IA externa.
  const parceiroEc = session.user.role === "AFFILIATE" && brand.code === "NEXTLEVEL_COMMERCE";
  const botaoIa = mauricio ? <BotaoMauricio m={mauricio} esfera={isMaster ? "master" : "lojista"} central={isMaster ? "/master/ia/ajustes" : "/merchant/ia"} />
    : parceiroEc ? <BotaoMauricio m={{ mostrar: true, plano: "", ferramentas: [], minimoTexto: "", minimoAvancado: "", emTeste: false }} esfera="parceiro" central="/parceiros/termos" /> : null;
  if (scope === "bras-admin") {
    // Estúdio da Brás (D92): só o Master entra; nome, menu e cor da Brás, com volta ao Master.
    const bras = brandByCode("BRAS_DIGITAL");
    return (
      <AppShell
        brand={{ code: bras.code, name: bras.name, logo: bras.logo, wordmark: bras.wordmark, accentColor: bras.accentColor }}
        panel="master"
        items={byFn(BRAS_ADMIN_NAV)}
        navMode="sections"
        quick={[]}
        roleLabel="Estúdio Brás Digital Club"
        tenantName="Brás Digital Club"
        tenantSub="Estúdio · NextLevel Master"
        userName={session.user.name}
        demoUsers={isDemoMode() && !(await isRecordingMode()) ? await listDemoUsers() : undefined}
        onSwitch={loginAs}
        onLogout={logout}
        passwordHref="/account/password"
        notices={await recentNotices(session.actor)}
        search={globalSearchAction}
        sideTop={<div className="px-3 pb-2"><Link href="/master" className="ds-item"><ArrowLeft className="size-[18px]" aria-hidden /><span className="ds-item-label">Voltar ao Master</span></Link></div>}
        banner={<>{supportBar}{ecoBar}{banner}</>}
      >
        {children}
      </AppShell>
    );
  }
  if (commerceStore || (scope === "commerce-admin" && !escritorioEc)) {
    const staff = session.user.storeRole === "STAFF";
    // NextLevel Business (NB1, D306): com a chave BUSINESS_V1, o menu vira os quatro grupos do gerenciador do negócio.
    const negocio = commerceStore ? await modulosDoNegocio(db, store!.id) : null;
    const menuLoja = negocio?.business ? navDoNegocio(negocio, NOME_GERENCIADOR.nome) : COMMERCE_STORE_NAV;
    const commerceItems = commerceStore
      ? (staff ? menuLoja.filter((i) => STAFF_NAV_PREFIXES.some((p) => i.href.startsWith(p))) : menuLoja)
      : COMMERCE_ADMIN_NAV;
    const subPainel = negocio?.business ? "Painel do negócio" : "Painel da loja";
    const demoUsersC = isDemoMode() && !(await isRecordingMode()) ? await listDemoUsers() : undefined;
    // Painel do lojista com a casca do Master (D207): cor da NextLevel, faixa com a novidade e o agente, menu do escritório.
    const capaLoja = commerceStore ? { oferta: { texto: "Atendimento ao vivo: responda os clientes da sua loja por aqui", href: "/merchant/atendimento" }, agente: !!botaoIa } : undefined;
    return (
      <>
      {commerceStore ? <AreaTheme theme="nextlevel" brand="NEXTLEVEL" /> : null}
      {commerceStore ? <PainelTech black={black} /> : null}
      <AppShell
        brand={{ code: brand.code, name: brand.name, logo: brand.logo, wordmark: brand.wordmark, accentColor: brand.accentColor }}
        panel={panelFor(session)}
        items={byFn(commerceItems)}
        navMode="sections"
        quick={commerceStore ? [{ label: "Novo produto", href: "/merchant/catalogo/new", icon: "Plus" }, { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" }] : []}
        roleLabel={commerceStore ? (staff ? "Equipe da loja" : "Administrador da loja") : "Administração Commerce"}
        tenantName={commerceStore ? store!.name : "NextLevel Commerce"}
        tenantSub={commerceStore ? subPainel : "Administração da plataforma"}
        userName={session.user.name}
        storefrontHref={commerceStore ? storefrontHref : undefined}
        storefrontLabel={negocio?.business && !negocio.ativos.has("loja") ? "Ver site" : undefined}
        demoUsers={demoUsersC}
        onSwitch={loginAs}
        onLogout={logout}
        passwordHref="/account/password"
        groupHref={undefined /* D217: lojista da Commerce sem "Suas marcas" (painel só com a marca do cliente) */}
        notices={commerceStore ? await recentNotices(session.actor) : []}
        search={globalSearchAction}
        sideTop={commerceStore ? undefined : <div className="px-3 pb-2"><Link href="/master" className="ds-item"><ArrowLeft className="size-[18px]" aria-hidden /><span className="ds-item-label">Voltar ao Master</span></Link></div>}
        // D217: painel do lojista só com a marca do cliente; sem o fio e o botão "Marcas do grupo" da NextLevel.
        banner={<>{supportBar}{commerceStore ? null : ecoBar}{commerceStore ? <FaixaBlack lugar="lojista" /> : null}{banner}{botaoIa}</>}
        capa={capaLoja}
        marcaCliente={commerceStore ? { nome: store!.name, logoUrl: store!.logoUrl, sub: staff ? "Equipe da loja" : subPainel } : undefined}
        extraTop={commerceStore ? <>{!session.support ? <AvisoSonoro loja /> : null}<AjudaLojista whatsappUrl={supportContacts("Oi! Preciso de ajuda com a minha loja.").whatsappUrl} /></> : undefined}
      >
        {children}
      </AppShell>
      </>
    );
  }

  const demoUsers = isDemoMode() && !(await isRecordingMode()) ? await listDemoUsers() : undefined;
  const notices = await recentNotices(session.actor);
  // Membro e importadora da Brás (D158): o nome da marca no topo da barra, não "NextLevel".
  const brasRole = session.user.role === "BRAS_MEMBER" || session.user.role === "BRAS_IMPORTER";
  // Master (D218): o canto diz o que é (Master do grupo) e quais negócios estão abertos, pronto para receber as marcas.
  const abertosMaster = isMaster ? negociosAbertos().map((n) => n.nome).join(" · ") : "";
  const agenciaPainel = session.user.role === "AGENCY";
  const tenantName = tenant?.name ?? (isMaster ? "Master do grupo" : session.store?.name ?? session.supplier?.name ?? (session.user.role === "AFFILIATE" ? session.user.name.replace(/ \(.*\)$/, "") : brasRole ? brandByCode("BRAS_DIGITAL").name : "NextLevel"));
  const tenantSub = tenant?.sub ?? (isMaster ? `Grupo NextLevel · ${abertosMaster || "negócios"}` : session.store ? (independent ? "Minha loja" : session.store.kind === "SUPPLIER_OWN" ? "Loja própria do fornecedor" : "Loja parceira") : session.supplier ? "Fornecedor / Central" : session.user.role === "AFFILIATE" ? "Escritório do parceiro" : session.user.role === "BRAS_MEMBER" ? "Meu Brás" : session.user.role === "BRAS_IMPORTER" ? "Importadora parceira" : "Plataforma");
  // Capa do Master (D198): faixa roxa com "Indique e ganhe", a novidade do momento e o agente.
  const pode = (href: string) => !fn || masterPathAllowed(fn, href);
  // Seletor de negócios (D209): pílula na faixa do topo, no lugar do "NextLevel / …" do menu e da faixa "Vendo:".
  const negocios = isMaster && !sup ? <SeletorNegocios atual={marcaMaster} ativas={marcasAtivasNoMaster()} /> : undefined;
  // Parceiro da Commerce (D220): mesma casca nova do lojista e do Master (faixa roxa), sem o seletor antigo.
  const capaParceiro = parceiroEc ? { oferta: { texto: "Agências parceiras: 50% + 25% enquanto o cliente ficar", href: "/partner#ag-t" }, agente: true } : undefined;
  // Painel da Agência (D313): a mesma casca da NextLevel Commerce; "Aprender" e "Pergunte ao Maurício" moram em botões do topo (D327).
  // Sem visual novo: faixa roxa e marca do cliente no menu.
  const capaAgencia = agenciaPainel ? { oferta: { texto: "Painel da Agência: carteira, contratos e equipe num lugar só", href: "/agencia/clientes" }, agente: false } : undefined;
  const capa = isMaster ? { negocios, indiqueHref: pode("/master/partners") ? "/master/partners" : undefined, oferta: pode("/master/ia") ? { texto: "Atendimento ao vivo: visitantes do site e lojistas numa caixa só", href: "/master/ia" } : undefined, agente: !!botaoIa } : undefined;
  return (
    <>
    {parceiroEc || agenciaPainel ? <AreaTheme theme="nextlevel" brand="NEXTLEVEL" /> : null}
    {parceiroEc || isMaster || agenciaPainel ? <PainelTech black={black} /> : null}
    <AppShell brand={{ code: brand.code, name: brand.name, logo: brand.logo, wordmark: brand.wordmark, accentColor: brand.accentColor }} panel={panelFor(session)} variant={session.user.role === "SUPPLIER_DISPATCH" ? "minimal" : "full"} items={items} quick={nav.quick} roleLabel={rotuloPainel ?? nav.label} tenantName={tenantName} tenantSub={tenantSub} userName={session.user.name} storefrontHref={storefrontHref} demoUsers={demoUsers} onSwitch={loginAs} onLogout={logout} passwordHref="/account/password" groupHref={canJoinGroup(session.user) && !session.support && !agenciaPainel ? "/account/marcas" : undefined} notices={notices} search={globalSearchAction} capa={capa ?? capaParceiro ?? capaAgencia} marcaCliente={agenciaPainel && tenant ? { nome: tenant.name, logoUrl: null, sub: tenant.sub } : undefined} extraTop={isMaster && !sup ? <AvisoSonoro /> : agenciaPainel ? <><Link href="/agencia/agente" className="ds-chip" aria-label="Pergunte ao Maurício: respostas com os números da empresa"><Sparkles className="size-4" aria-hidden /><span className="ds-hide-compact">Maurício</span></Link><Link href="/agencia/aprender" className="ds-chip" aria-label={`Aprender: aulas e novidades do ${rotuloPainel ?? "Painel da Agência"}`}><GraduationCap className="size-4" aria-hidden /><span className="ds-hide-compact">Aprender</span></Link></> : undefined} banner={<>{supportBar}{ecoBar}{isMaster && !sup ? <FaixaBlack lugar="master" /> : parceiroEc ? <FaixaBlack lugar="parceiro" /> : null}{banner}{botaoIa}</>}>
      {children}
    </AppShell>
    </>
  );
}
