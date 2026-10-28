import { canJoinGroup } from "@/lib/domain/conta-grupo";
import { AppShell } from "@/components/app/app-shell";
import { listDemoUsers, loginAs, logout } from "@/app/actions/auth";
import { globalSearchAction } from "@/app/actions/search";
import { isDemoMode, type Session } from "@/lib/auth";
import { isRecordingMode } from "@/lib/gravacao-server";
import { type FeatureKey } from "@/lib/features";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { storeUrl } from "@/lib/store-url";
import { BRAS_ADMIN_NAV, COMMERCE_ADMIN_NAV, COMMERCE_STORE_NAV, NAV, STAFF_NAV_PREFIXES, navDoMasterPorMarca, navForBrand, type Panel } from "@/lib/nav";
import { getBrand, marcaDoMaster } from "@/lib/brand-server";
import { SeletorMarcaMaster } from "@/components/master/seletor-marca";
import { brandByCode } from "@/lib/brand";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { recentNotices } from "@/lib/queries/notifications";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { brandOfStore } from "@/lib/store-brand";
import { SupportBar } from "@/components/support/support-bar";
import { ecosystemBar, type EcoBrand } from "@/lib/domain/ecossistema/lancador";
import { BarraEcossistema } from "@/components/ecossistema/barra";
import { masterPathAllowed } from "@/lib/master-equipe";
import type { NavItem } from "@/lib/nav";
import { mauricioDaLoja } from "@/lib/domain/ia";
import { BotaoMauricio } from "@/components/ia/mauricio";

/** Painel (clima visual) do usuário: fornecedor e lojista variam por perfil. */
export function panelFor(session: Session): Panel {
  if (session.user.role === "NEXTLEVEL_MASTER") return "master";
  if (session.user.role === "SUPPLIER_ADMIN") return "supplier";
  if (session.user.role === "SUPPLIER_DISPATCH") return "dispatch";
  if (session.user.role === "AFFILIATE") return "partner";
  return session.store?.offer === "STORE_OWN" ? "pro" : "lite";
}

/** Itens do menu do lojista e o recurso que os libera; sem o recurso aparecem com cadeado. */
const MERCHANT_GATES: Record<string, FeatureKey> = { "/merchant/analytics": "analytics", "/merchant/storefront": "storefront", "/theme-editor": "appearanceBasic", "/merchant/templates": "templatesStarter" };

export async function RoleLayout({ session, children, banner, scope }: { session: Session; children: React.ReactNode; banner?: React.ReactNode; /** "commerce-admin" / "bras-admin" = console administrativo da marca dentro do Master. */ scope?: "commerce-admin" | "bras-admin" }) {
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
  const byFn = (list: NavItem[]) => (fn ? list.filter((i) => masterPathAllowed(fn, i.href)) : list);
  const store = session.store;
  // A marca do lojista pertence à organização da loja, não ao hostname técnico.
  // Isso impede uma loja Commerce de herdar identidade e navegação SuperDrop.
  const brand = store ? await brandOfStore(db, store) : await getBrand();
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
  const items = navForBrand(store ? visible.map((i) => (MERCHANT_GATES[i.href] && !perfil!.pode[MERCHANT_GATES[i.href]!] ? { ...i, locked: true } : i)) : navDoMasterPorMarca(byFn(nav.items), marcaMaster), brand);
  const seletorMarca = isMaster && !sup ? <SeletorMarcaMaster atual={marcaMaster} /> : null;
  const storefrontHref = store && perfil?.pode.storefront ? storeUrl(store.slug, store.offer, store.customDomain, store.domainStatus) : undefined;
  const commerceStore = session.user.role === "STORE_OWNER" && !!store && brand.code === "NEXTLEVEL_COMMERCE";
  // Maurício (IA0, D194): na loja independente da E-commerce e para o dono no Master. Visível; o plano decide o que destrava.
  const mauricio = (commerceStore && independent) || (isMaster && !fn && !sup) ? await mauricioDaLoja(db, isMaster ? null : store!.id, { master: isMaster }) : null;
  const botaoIa = mauricio ? <BotaoMauricio m={mauricio} central={isMaster ? "/master/ia" : "/merchant/ia"} upgrade={isMaster ? "/master/ia" : "/merchant/finance#assinatura"} /> : null;
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
  if (commerceStore || scope === "commerce-admin") {
    const staff = session.user.storeRole === "STAFF";
    const commerceItems = commerceStore
      ? (staff ? COMMERCE_STORE_NAV.filter((i) => STAFF_NAV_PREFIXES.some((p) => i.href.startsWith(p))) : COMMERCE_STORE_NAV)
      : COMMERCE_ADMIN_NAV;
    const demoUsersC = isDemoMode() && !(await isRecordingMode()) ? await listDemoUsers() : undefined;
    return (
      <AppShell
        brand={{ code: brand.code, name: brand.name, logo: brand.logo, wordmark: brand.wordmark, accentColor: brand.accentColor }}
        panel={panelFor(session)}
        items={byFn(commerceItems)}
        navMode={commerceStore ? "accordion" : "sections"}
        quick={commerceStore ? [{ label: "Novo produto", href: "/merchant/catalogo/new", icon: "Plus" }, { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" }] : []}
        roleLabel={commerceStore ? (staff ? "Equipe da loja" : "Administrador da loja") : "Administração E-commerce"}
        tenantName={commerceStore ? store!.name : "NextLevel E-commerce"}
        tenantSub={commerceStore ? "Painel da loja" : "Administração da plataforma"}
        userName={session.user.name}
        storefrontHref={commerceStore ? storefrontHref : undefined}
        demoUsers={demoUsersC}
        onSwitch={loginAs}
        onLogout={logout}
        passwordHref="/account/password"
        groupHref={commerceStore && canJoinGroup(session.user) && !session.support ? "/account/marcas" : undefined}
        notices={commerceStore ? await recentNotices(session.actor) : []}
        search={globalSearchAction}
        sideTop={commerceStore ? undefined : <div className="px-3 pb-2"><Link href="/master" className="ds-item"><ArrowLeft className="size-[18px]" aria-hidden /><span className="ds-item-label">Voltar ao Master</span></Link></div>}
        banner={<>{supportBar}{ecoBar}{banner}{botaoIa}</>}
      >
        {children}
      </AppShell>
    );
  }

  const demoUsers = isDemoMode() && !(await isRecordingMode()) ? await listDemoUsers() : undefined;
  const notices = await recentNotices(session.actor);
  // Membro e importadora da Brás (D158): o nome da marca no topo da barra, não "NextLevel".
  const brasRole = session.user.role === "BRAS_MEMBER" || session.user.role === "BRAS_IMPORTER";
  const tenantName = session.store?.name ?? session.supplier?.name ?? (session.user.role === "AFFILIATE" ? session.user.name.replace(/ \(.*\)$/, "") : brasRole ? brandByCode("BRAS_DIGITAL").name : "NextLevel");
  const tenantSub = session.store ? (independent ? "Minha loja" : session.store.kind === "SUPPLIER_OWN" ? "Loja própria do fornecedor" : "Loja parceira") : session.supplier ? "Fornecedor / Central" : session.user.role === "AFFILIATE" ? "Escritório do parceiro" : session.user.role === "BRAS_MEMBER" ? "Meu Brás" : session.user.role === "BRAS_IMPORTER" ? "Importadora parceira" : "Plataforma";
  return (
    <AppShell brand={{ code: brand.code, name: brand.name, logo: brand.logo, wordmark: brand.wordmark, accentColor: brand.accentColor }} panel={panelFor(session)} variant={session.user.role === "SUPPLIER_DISPATCH" ? "minimal" : "full"} items={items} quick={nav.quick} roleLabel={nav.label} tenantName={tenantName} tenantSub={tenantSub} userName={session.user.name} storefrontHref={storefrontHref} demoUsers={demoUsers} onSwitch={loginAs} onLogout={logout} passwordHref="/account/password" groupHref={canJoinGroup(session.user) && !session.support ? "/account/marcas" : undefined} notices={notices} search={globalSearchAction} banner={<>{supportBar}{seletorMarca}{ecoBar}{banner}{botaoIa}</>}>
      {children}
    </AppShell>
  );
}
