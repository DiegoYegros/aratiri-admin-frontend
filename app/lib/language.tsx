"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LanguageCode = "en" | "es";

type TranslationValue = string | { [key: string]: TranslationValue };

type TranslationDictionary = Record<LanguageCode, TranslationValue>;

type TemplateVariables = Record<string, string | number | boolean>;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, variables?: TemplateVariables) => string;
  availableLanguages: Array<{ code: LanguageCode; label: string }>;
}

const DEFAULT_LANGUAGE: LanguageCode = "en";
const STORAGE_KEY = "aratiri_admin_language";

const LANGUAGE_METADATA: Record<LanguageCode, { label: string }> = {
  en: { label: "English" },
  es: { label: "Español" },
};

const translations: TranslationDictionary = {
  en: {
    languageName: "English",
    navigation: {
      dashboard: "Dashboard",
      wallet: "Wallet",
      channels: "Channels",
      peers: "Peers",
      settings: "Settings",
    },
    common: {
      appName: "Aratiri Admin",
      loading: "Loading...",
      collapse: "Collapse",
      expand: "Expand",
      logout: "Logout",
      refresh: "Refresh",
      copy: "Copy",
      copied: "Copied",
      active: "Active",
      next: "Next",
      previous: "Previous",
      searchPlaceholder: "Search...",
      pageOf: "Page {{current}} of {{total}}",
      notAvailable: "N/A",
      sats: "sats",
      enabled: "Enabled",
      disabled: "Disabled",
    },
    auth: {
      heading: "Aratiri Admin",
      subheading: "Sign in to continue",
      usernamePlaceholder: "Username",
      passwordPlaceholder: "Password",
      signIn: "Sign In",
      signingIn: "Signing In...",
      errors: {
        default: "Unable to sign in. Please try again.",
        noPermission:
          "You do not have permission to access the admin dashboard.",
        sessionExpired: "Session expired. Please sign in again.",
      },
    },
    admin: {
      loading: "Loading...",
    },
    dashboard: {
      errors: {
        fetch: "Failed to fetch dashboard data: {{message}}",
      },
      stats: {
        alias: "Alias",
        version: "Version",
        blockHeight: "Block Height",
        commitHash: "Commit Hash",
        peers: "Peers",
        activeChannels: "Active Channels",
        pendingChannels: "Pending Channels",
        network: "Network",
      },
    },
    wallet: {
      errors: {
        fetchBalance: "Failed to load wallet balance. Please try again.",
        generateAddress: "Failed to generate a new address. Please try again.",
      },
      alerts: {
        success: "New address generated successfully.",
      },
      stats: {
        confirmed: "Confirmed Balance",
        unconfirmed: "Unconfirmed Balance",
        total: "Total Balance",
      },
      section: {
        title: "On-chain Wallet",
        description:
          "Generate addresses and monitor your on-chain wallet balances.",
        latestAddress: "Latest generated address",
      },
      actions: {
        refresh: "Refresh",
        generate: "Generate Address",
        generating: "Generating",
      },
    },
    channels: {
      title: "Channels",
      subtitle:
        "Monitor liquidity, channel health, and privacy posture at a glance.",
      errors: {
        fetch: "Failed to fetch open channels: {{message}}",
      },
      actions: {
        refresh: "Refresh",
        open: "Open Channel",
      },
      stats: {
        outbound: "Outbound Liquidity",
        inbound: "Inbound Liquidity",
        active: "Active Channels",
        pending: "Inactive / Pending",
        snapshot: "Channel Snapshot",
        totalCapacity: "Total Capacity",
        averageActiveSize: "Avg. Active Size",
        activeUtilization: "Active Utilization",
        publicChannels: "Public Channels",
        privateChannels: "Private Channels",
        empty: "Open a channel to populate analytics.",
      },
      status: {
        none: "No channels yet",
      },
      chart: {
        others: "Others",
      },
      table: {
        title: "Channel List",
        search: "Search by remote pubkey...",
        status: "Status",
        remotePeer: "Remote Peer",
        localBalance: "Local Balance",
        remoteBalance: "Remote Balance",
        capacity: "Capacity",
        type: "Type",
        emptySearch: "No channels match \"{{query}}\".",
        empty: "You have no channels yet.",
      },
      pagination: {
        previous: "Previous",
        next: "Next",
        pageOf: "Page {{current}} of {{total}}",
      },
      types: {
        public: "Public",
        private: "Private",
        publicTooltip: "Public Channel",
        privateTooltip: "Private Channel",
      },
    },
    statuses: {
      active: "Active",
      inactive: "Inactive",
      pending_open: "Pending Open",
      pending_closing: "Pending Close",
      pending_force_closing: "Force Closing",
      waiting_close: "Waiting Close",
      privateChannel: "Private Channel",
      publicChannel: "Public Channel",
    },
    settings: {
      title: "Settings",
      subtitle: "Tailor the admin experience to your workflow.",
      language: {
        title: "Language",
        description: "Choose your preferred language for the dashboard.",
        helper: "Select the language you prefer to use across the dashboard.",
      },
    },
    mobileNav: {
      navigation: "Navigation",
      subtitle: "Manage every part of your node",
      signOut: "Sign out",
      active: "Active",
    },
    statCard: {
      expand: "Expand",
      collapse: "Collapse",
      copy: "Copy to clipboard",
    },
    copyableCell: {
      copy: "Copy",
    },
    modal: {
      openChannel: {
        title: "Open a New Channel",
        description:
          "Connect with a new peer to expand your reach on the network.",
        nodePublicKey: "Node Public Key",
        openingWith: "Opening channel with {{alias}}",
        localAmount: "Local Amount (sats)",
        pushToPeer: "Push to Peer (sats)",
        optional: "Optional",
        privateLabel: "Make this a private channel",
        submit: "Initiate Channel Open",
        submitting: "Opening Channel...",
        success: "Channel opening process initiated! TXID: {{txid}}",
      },
    },
    peers: {
      title: "Peers",
      subtitle:
        "Keep your node well connected with curated peer recommendations.",
      actions: {
        copyPubkey: "Copy Pubkey",
        copyUri: "Copy Node URI",
        refresh: "Refresh",
        openChannel: "Open Channel",
      },
      stats: {
        connected: "Connected Peers",
        recommended: "Recommended Nodes",
        autoManage: "Auto-Manage Peers",
        recommendedCapacity: "Recommended Capacity",
      },
      settings: {
        title: "Peer Management Settings",
        loading: "Loading settings...",
        toggleDescription:
          "Automatically maintain connections with top peers",
        helper:
          "When enabled, Aratiri will periodically connect to recommended peers based on network centrality if not already connected, up to a configured limit.",
      },
      nodeIdentity: {
        pubkeyUnavailable: "Pubkey not available",
        uriUnavailable: "URI not available",
      },
      manual: {
        title: "Manual Peer Connection",
        description:
          "Connect to a specific peer by providing their public key and reachable host (useful for Tor or custom peers).",
        peerPubkey: "Peer Pubkey",
        host: "Host (IP / Onion Address)",
        pubkeyPlaceholder: "e.g. 02ab...",
        hostPlaceholder: "e.g. 123.45.67.89:9735 or xyz.onion:9735",
        submit: "Connect",
        submitting: "Connecting...",
      },
      connectedPeers: {
        title: "Connected Peers ({{count}})",
        address: "Address",
        pubkey: "Pubkey",
        actions: "Actions",
        fallbackAlias: "Connected Peer",
      },
      tables: {
        recommendedTitle: "Recommended Peers",
        alias: "Alias",
        channels: "Channels",
        capacity: "Capacity",
        centrality: "Centrality",
        actions: "Actions",
        empty: "No recommended peers found or all are already connected.",
        emptySearch: "No recommended peers match \"{{query}}\".",
      },
      connectButton: {
        connect: "Connect",
        connecting: "Connecting...",
        noAddress: "Node has no advertised address",
      },
      success: {
        connected: "Connection initiated with {{name}}.",
      },
      errors: {
        fetch: "Failed to fetch peer/node data: {{message}}",
        connectNoAddress: "Node has no advertised address.",
        connect: "Failed to connect to {{name}}: {{message}}",
        manualRequired: "Pubkey and host are required to connect manually.",
        manual: "Failed to connect to peer: {{message}}",
      },
    },
  },
  es: {
    languageName: "Español",
    navigation: {
      dashboard: "Panel",
      wallet: "Billetera",
      channels: "Canales",
      peers: "Pares",
      settings: "Configuración",
    },
    common: {
      appName: "Aratiri Admin",
      loading: "Cargando...",
      collapse: "Contraer",
      expand: "Expandir",
      logout: "Cerrar sesión",
      refresh: "Actualizar",
      copy: "Copiar",
      copied: "Copiado",
      active: "Activo",
      next: "Siguiente",
      previous: "Anterior",
      searchPlaceholder: "Buscar...",
      pageOf: "Página {{current}} de {{total}}",
      notAvailable: "N/D",
      sats: "sats",
      enabled: "Habilitado",
      disabled: "Deshabilitado",
    },
    auth: {
      heading: "Aratiri Admin",
      subheading: "Inicia sesión para continuar",
      usernamePlaceholder: "Usuario",
      passwordPlaceholder: "Contraseña",
      signIn: "Iniciar sesión",
      signingIn: "Iniciando sesión...",
      errors: {
        default: "No fue posible iniciar sesión. Inténtalo nuevamente.",
        noPermission:
          "No tienes permiso para acceder al panel de administración.",
        sessionExpired: "La sesión expiró. Vuelve a iniciar sesión.",
      },
    },
    admin: {
      loading: "Cargando...",
    },
    dashboard: {
      errors: {
        fetch: "No se pudo obtener la información del panel: {{message}}",
      },
      stats: {
        alias: "Alias",
        version: "Versión",
        blockHeight: "Altura de bloque",
        commitHash: "Hash de commit",
        peers: "Pares",
        activeChannels: "Canales activos",
        pendingChannels: "Canales pendientes",
        network: "Red",
      },
    },
    wallet: {
      errors: {
        fetchBalance:
          "No se pudo cargar el saldo de la billetera. Inténtalo nuevamente.",
        generateAddress:
          "No se pudo generar una nueva dirección. Inténtalo nuevamente.",
      },
      alerts: {
        success: "Nueva dirección generada correctamente.",
      },
      stats: {
        confirmed: "Saldo confirmado",
        unconfirmed: "Saldo sin confirmar",
        total: "Saldo total",
      },
      section: {
        title: "Billetera on-chain",
        description:
          "Genera direcciones y supervisa los saldos de tu billetera on-chain.",
        latestAddress: "Última dirección generada",
      },
      actions: {
        refresh: "Actualizar",
        generate: "Generar dirección",
        generating: "Generando",
      },
    },
    channels: {
      title: "Canales",
      subtitle:
        "Supervisa la liquidez, el estado y la privacidad de tus canales de un vistazo.",
      errors: {
        fetch: "No se pudieron obtener los canales: {{message}}",
      },
      actions: {
        refresh: "Actualizar",
        open: "Abrir canal",
      },
      stats: {
        outbound: "Liquidez saliente",
        inbound: "Liquidez entrante",
        active: "Canales activos",
        pending: "Inactivos / Pendientes",
        snapshot: "Resumen de canales",
        totalCapacity: "Capacidad total",
        averageActiveSize: "Promedio de canales activos",
        activeUtilization: "Utilización activa",
        publicChannels: "Canales públicos",
        privateChannels: "Canales privados",
        empty: "Abre un canal para ver las analíticas.",
      },
      status: {
        none: "Aún no hay canales",
      },
      chart: {
        others: "Otros",
      },
      table: {
        title: "Listado de canales",
        search: "Buscar por pubkey remoto...",
        status: "Estado",
        remotePeer: "Par remoto",
        localBalance: "Saldo local",
        remoteBalance: "Saldo remoto",
        capacity: "Capacidad",
        type: "Tipo",
        emptySearch: "No hay canales que coincidan con \"{{query}}\".",
        empty: "Todavía no tienes canales.",
      },
      pagination: {
        previous: "Anterior",
        next: "Siguiente",
        pageOf: "Página {{current}} de {{total}}",
      },
      types: {
        public: "Público",
        private: "Privado",
        publicTooltip: "Canal público",
        privateTooltip: "Canal privado",
      },
    },
    statuses: {
      active: "Activo",
      inactive: "Inactivo",
      pending_open: "Pendiente de apertura",
      pending_closing: "Pendiente de cierre",
      pending_force_closing: "Cierre forzoso",
      waiting_close: "En espera de cierre",
      privateChannel: "Canal privado",
      publicChannel: "Canal público",
    },
    settings: {
      title: "Configuración",
      subtitle: "Personaliza la experiencia del panel a tu medida.",
      language: {
        title: "Idioma",
        description: "Elige tu idioma preferido para el panel.",
        helper: "Selecciona el idioma que prefieres utilizar en todo el panel.",
      },
    },
    mobileNav: {
      navigation: "Navegación",
      subtitle: "Administra cada parte de tu nodo",
      signOut: "Cerrar sesión",
      active: "Activo",
    },
    statCard: {
      expand: "Expandir",
      collapse: "Contraer",
      copy: "Copiar al portapapeles",
    },
    copyableCell: {
      copy: "Copiar",
    },
    modal: {
      openChannel: {
        title: "Abrir un nuevo canal",
        description:
          "Conéctate con un nuevo par para ampliar tu alcance en la red.",
        nodePublicKey: "Clave pública del nodo",
        openingWith: "Abriendo canal con {{alias}}",
        localAmount: "Monto local (sats)",
        pushToPeer: "Push al par (sats)",
        optional: "Opcional",
        privateLabel: "Convertir en canal privado",
        submit: "Iniciar apertura de canal",
        submitting: "Abriendo canal...",
        success: "¡Proceso de apertura iniciado! TXID: {{txid}}",
      },
    },
    peers: {
      title: "Pares",
      subtitle:
        "Mantén tu nodo bien conectado con recomendaciones seleccionadas.",
      actions: {
        copyPubkey: "Copiar pubkey",
        copyUri: "Copiar URI del nodo",
        refresh: "Actualizar",
        openChannel: "Abrir canal",
      },
      stats: {
        connected: "Pares conectados",
        recommended: "Nodos recomendados",
        autoManage: "Gestionar pares automáticamente",
        recommendedCapacity: "Capacidad recomendada",
      },
      settings: {
        title: "Configuración de pares",
        loading: "Cargando configuración...",
        toggleDescription:
          "Mantener conexiones con los mejores pares automáticamente",
        helper:
          "Cuando está habilitado, Aratiri se conectará periódicamente a los pares recomendados según la centralidad de la red si aún no estás conectado, hasta un límite configurado.",
      },
      nodeIdentity: {
        pubkeyUnavailable: "Pubkey no disponible",
        uriUnavailable: "URI no disponible",
      },
      manual: {
        title: "Conexión manual de pares",
        description:
          "Conéctate a un par específico indicando su clave pública y host alcanzable (útil para Tor o pares personalizados).",
        peerPubkey: "Pubkey del par",
        host: "Host (IP / Dirección Onion)",
        pubkeyPlaceholder: "ej. 02ab...",
        hostPlaceholder: "ej. 123.45.67.89:9735 o xyz.onion:9735",
        submit: "Conectar",
        submitting: "Conectando...",
      },
      connectedPeers: {
        title: "Pares conectados ({{count}})",
        address: "Dirección",
        pubkey: "Pubkey",
        actions: "Acciones",
        fallbackAlias: "Par conectado",
      },
      tables: {
        recommendedTitle: "Pares recomendados",
        alias: "Alias",
        channels: "Canales",
        capacity: "Capacidad",
        centrality: "Centralidad",
        actions: "Acciones",
        empty: "No se encontraron pares recomendados o ya estás conectado a todos.",
        emptySearch: "No hay pares recomendados que coincidan con \"{{query}}\".",
      },
      connectButton: {
        connect: "Conectar",
        connecting: "Conectando...",
        noAddress: "El nodo no tiene dirección anunciada",
      },
      success: {
        connected: "Conexión iniciada con {{name}}.",
      },
      errors: {
        fetch: "No se pudo obtener la información de pares/nodo: {{message}}",
        connectNoAddress: "El nodo no tiene dirección anunciada.",
        connect: "No se pudo conectar con {{name}}: {{message}}",
        manualRequired:
          "La pubkey y el host son obligatorios para conectar manualmente.",
        manual: "No se pudo conectar con el par: {{message}}",
      },
    },
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const getTranslationValue = (
  language: LanguageCode,
  key: string
): string | undefined => {
  const fallbackOrder: LanguageCode[] = [language, DEFAULT_LANGUAGE];
  for (const code of fallbackOrder) {
    const root = translations[code];
    const parts = key.split(".");
    let current: TranslationValue | undefined = root;
    for (const part of parts) {
      if (
        current &&
        typeof current === "object" &&
        Object.prototype.hasOwnProperty.call(current, part)
      ) {
        current = (current as Record<string, TranslationValue>)[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === "string") {
      return current;
    }
  }
  return undefined;
};

const applyTemplateVariables = (
  value: string,
  variables?: TemplateVariables
) => {
  if (!variables) {
    return value;
  }
  return value.replace(/{{\s*(\w+)\s*}}/g, (_, token: string) => {
    const replacement = variables[token];
    return replacement !== undefined ? String(replacement) : "";
  });
};

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as
      | LanguageCode
      | null;
    if (stored && stored in translations) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);

  const t = useCallback(
    (key: string, variables?: TemplateVariables) => {
      const value = getTranslationValue(language, key) ?? key;
      return applyTemplateVariables(value, variables);
    },
    [language]
  );

  const availableLanguages = useMemo(
    () =>
      (Object.keys(LANGUAGE_METADATA) as LanguageCode[]).map((code) => ({
        code,
        label: LANGUAGE_METADATA[code].label,
      })),
    []
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages,
    }),
    [language, setLanguage, t, availableLanguages]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

