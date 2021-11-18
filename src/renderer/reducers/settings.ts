import { handleActions, ReducerMap, ReducerMapMeta } from "redux-actions";
import { createSelector } from "reselect";
import type { OutputSelector } from "reselect";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  listSupportedFiats,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/lib/currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import type { CryptoCurrency, Currency } from "@ledgerhq/live-common/lib/types";
import type { DeviceModelInfo } from "@ledgerhq/live-common/lib/types/manager";
import type { PortfolioRange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getLanguages } from "~/config/languages";
import type { State } from ".";
import { osLangAndRegionSelector } from "~/renderer/reducers/application";

declare var __APP_VERSION__: string;

export type CurrencySettings = {
  confirmationsNb: number,
};

export type CurrenciesSettings = {
  [id: string]: CurrencySettings,
};

type ConfirmationDefaults = {
  confirmationsNb?: {
    min: number,
    def: number,
    max: number,
  },
};

export const currencySettingsDefaults = (c: Currency): ConfirmationDefaults => {
  let confirmationsNb;
  if (c.type === "CryptoCurrency") {
    const { blockAvgTime } = c;
    if (blockAvgTime) {
      const def = Math.ceil((30 * 60) / blockAvgTime); // 30 min approx validation
      confirmationsNb = { min: 1, def, max: 3 * def };
    }
  }
  return {
    confirmationsNb,
  };
};

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
export const possibleIntermediaries = [bitcoin, ethereum];

export const timeRangeDaysByKey = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  all: -1,
};

export type LangAndRegion = { language: string, region?: string, useSystem: boolean };

export type SettingsState = {
  loaded: boolean, // is the settings loaded from db (it not we don't save them)
  hasCompletedOnboarding: boolean,
  counterValue: string,
  preferredDeviceModel: DeviceModelId,
  hasInstalledApps: boolean,
  lastSeenDevice: DeviceModelInfo | null,
  latestFirmware: any,
  language?: string,
  theme: string | null,
  region: string | null,
  orderAccounts: string,
  countervalueFirst: boolean,
  autoLockTimeout: number,
  selectedTimeRange: PortfolioRange,
  marketIndicator: "eastern" | "western",
  currenciesSettings: {
    [currencyId: string]: CurrencySettings,
  },
  pairExchanges: {
    [pair: string]: string | null,
  },
  developerMode: boolean,
  shareAnalytics: boolean,
  sentryLogs: boolean,
  lastUsedVersion: string,
  dismissedBanners: string[],
  accountsViewMode: "card" | "list",
  showAccountsHelperBanner: boolean,
  hideEmptyTokenAccounts: boolean,
  discreetMode: boolean,
  carouselVisibility: number,
  starredAccountIds?: string[],
  blacklistedTokenIds: string[],
  deepLinkUrl: string | null,
  firstTimeLend: boolean,
  showClearCacheBanner: boolean,
  fullNodeEnabled: boolean,

  // developer settings
  allowDebugApps: boolean,
  allowExperimentalApps: boolean,
  enablePlatformDevTools: boolean,
  catalogProvider: string,
  USBTroubleshootingIndex?: number,
  swap: {
    hasAcceptedIPSharing: false,
    selectableCurrencies: string[],
    acceptedProviders: string[],
    KYC: {
      [provider: string]: {
        id: string,
        status: string,
      },
    },
  },
};

const defaultsForCurrency: (crypto: Currency) => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb ? defaults.confirmationsNb.def : 0,
  };
};

const INITIAL_STATE: SettingsState = {
  hasCompletedOnboarding: false,
  counterValue: "USD",
  language: "en",
  theme: null,
  region: null,
  orderAccounts: "balance|desc",
  countervalueFirst: false,
  autoLockTimeout: 10,
  selectedTimeRange: "month",
  marketIndicator: "western",
  currenciesSettings: {},
  pairExchanges: {},
  developerMode: !!process.env.__DEV__,
  loaded: false,
  shareAnalytics: true,
  sentryLogs: true,
  lastUsedVersion: __APP_VERSION__,
  dismissedBanners: [],
  accountsViewMode: "list",
  showAccountsHelperBanner: true,
  hideEmptyTokenAccounts: getEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
  discreetMode: false,
  preferredDeviceModel: DeviceModelId.nanoS,
  hasInstalledApps: true,
  carouselVisibility: 0,
  lastSeenDevice: null,
  latestFirmware: null,
  blacklistedTokenIds: [],
  deepLinkUrl: null,
  firstTimeLend: false,
  showClearCacheBanner: false,
  fullNodeEnabled: false,

  // developer settings
  allowDebugApps: false,
  allowExperimentalApps: false,
  enablePlatformDevTools: false,
  catalogProvider: "production",
  USBTroubleshootingIndex: undefined,
  swap: {
    hasAcceptedIPSharing: false,
    acceptedProviders: [],
    selectableCurrencies: [],
    KYC: {},
  },
};

const pairHash = (from: Currency, to: Currency) => `${from.ticker}_${to.ticker}`;

export const supportedCountervalues: { value: string, label: string, currency: Currency }[] = [
  ...listSupportedFiats(),
  ...possibleIntermediaries,
]
  .map(currency => ({
    value: currency.ticker,
    label: `${currency.name} - ${currency.ticker}`,
    currency,
  }))
  .sort((a, b) => (a.currency.name < b.currency.name ? -1 : 1));

// any needed here as not all actions correctly implement the Action type
const handlers: any = {
  SETTINGS_SET_PAIRS: (
    state: SettingsState,
    {
      pairs,
    }: {
      pairs: Array<{
        from: Currency,
        to: Currency,
        exchange: string,
      }>,
    },
  ) => {
    const copy = { ...state };
    copy.pairExchanges = { ...copy.pairExchanges };
    for (const { to, from, exchange } of pairs) {
      copy.pairExchanges[pairHash(from, to)] = exchange;
    }
    return copy;
  },
  SAVE_SETTINGS: (state: SettingsState, { payload }: { payload: Partial<SettingsState> }) => {
    if (!payload) return state;
    const changed = (Object.keys(payload) as Array<keyof typeof payload>).some(key => payload[key] !== state[key]);
    if (!changed) return state;
    return {
      ...state,
      ...payload,
    };
  },
  FETCH_SETTINGS: (
    state: SettingsState,
    { payload: settings }: { payload: Partial<SettingsState> },
  ) => {
    if (
      settings.counterValue &&
      !supportedCountervalues.find(({ currency }) => currency.ticker === settings.counterValue)
    ) {
      settings.counterValue = INITIAL_STATE.counterValue;
    }
    return {
      ...state,
      ...settings,
      loaded: true,
    };
  },
  SETTINGS_DISMISS_BANNER: (state: SettingsState, { payload: bannerId }: { payload: string }) => ({
    ...state,
    dismissedBanners: [...state.dismissedBanners, bannerId],
  }),
  SHOW_TOKEN: (state: SettingsState, { payload: tokenId }: { payload: string }) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: ids.filter(id => id !== tokenId),
    };
  },
  BLACKLIST_TOKEN: (state: SettingsState, { payload: tokenId }: { payload: string }) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: [...ids, tokenId],
    };
  },
  LAST_SEEN_DEVICE_INFO: (
    state: SettingsState,
    { payload }: { payload: { lastSeenDevice: DeviceModelInfo, latestFirmware: any } },
  ) => ({
    ...state,
    lastSeenDevice: payload.lastSeenDevice,
    latestFirmware: payload.latestFirmware,
  }),
  SET_DEEPLINK_URL: (state: SettingsState, { payload: deepLinkUrl }: { payload: string }) => ({
    ...state,
    deepLinkUrl,
  }),
  SET_FIRST_TIME_LEND: (state: SettingsState) => ({
    ...state,
    firstTimeLend: false,
  }),
  SET_SWAP_SELECTABLE_CURRENCIES: (state: SettingsState, { payload }: { payload: string[]}) => ({
    ...state,
    swap: {
      ...state.swap,
      selectableCurrencies: payload,
    },
  }),
  SET_SWAP_KYC: (state: SettingsState, { payload }: {payload:{ provider: string, id?: string, status?: string }}) => {
    const { provider, id, status } = payload;
    const KYC = { ...state.swap.KYC };

    if (id && status) {
      KYC[provider] = { id, status };
    } else {
      delete KYC[provider];
    }

    return {
      ...state,
      swap: {
        ...state.swap,
        KYC,
      },
    };
  },
  SET_SWAP_ACCEPTED_IP_SHARING: (state: SettingsState, { payload }: { payload: boolean }) => ({
    ...state,
    swap: {
      ...state.swap,
      hasAcceptedIPSharing: payload,
    },
  }),
  ACCEPT_SWAP_PROVIDER: (state: SettingsState, { payload }: { payload: string }) => ({
    ...state,
    swap: {
      ...state.swap,
      acceptedProviders: [...new Set([...(state.swap?.acceptedProviders || []), payload])],
    },
  }),
  // used to debug performance of redux updates
  DEBUG_TICK: (state: SettingsState) => ({ ...state }),
};

// TODO refactor selectors to *Selector naming convention

export const storeSelector = (state: State): SettingsState => state.settings;

export const settingsExportSelector = storeSelector;

export const discreetModeSelector = (state: State): boolean => state.settings.discreetMode === true;

export const getCounterValueCode = (state: State) => state.settings.counterValue;

export const deepLinkUrlSelector = (state: State) => state.settings.deepLinkUrl;

export const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");

export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector,
);

export const countervalueFirstSelector = createSelector(
  storeSelector,
  s => s.countervalueFirst,
);

export const developerModeSelector = (state: State): boolean => state.settings.developerMode;

export const lastUsedVersionSelector = (state: State): string => state.settings.lastUsedVersion;

export const userThemeSelector = (state: State): string | null => state.settings.theme;

export const userLangAndRegionSelector = (
  state: State,
): { language: string, region: string | null, useSystem: boolean } | undefined => {
  const languages = getLanguages();
  const { language, region } = state.settings;
  if (language && languages.includes(language)) {
    return { language, region, useSystem: false };
  }
};

export const langAndRegionSelector = createSelector(
  userLangAndRegionSelector,
  osLangAndRegionSelector,
  (userLang, osLang) => {
    return userLang || osLang;
  },
);

export const languageSelector = createSelector(
  langAndRegionSelector,
  o => o.language,
);

export const localeSelector = createSelector(langAndRegionSelector, ({ language, region }) =>
  region ? `${language}-${region}` : language,
);

export const getOrderAccounts = (state: State) => state.settings.orderAccounts;

export const areSettingsLoaded = (state: State) => state.settings.loaded;

export const currencySettingsLocaleSelector = (
  settings: SettingsState,
  currency: Currency,
): CurrencySettings => {
  const currencySettings = settings.currenciesSettings[currency.ticker];
  const val = { ...defaultsForCurrency(currency), ...currencySettings };
  return val;
};

export const currencyPropExtractor = (_: any, { currency }: any) => currency;

// TODO: drop (bad perf implication)
export const currencySettingsSelector = createSelector(
  storeSelector,
  currencyPropExtractor,
  currencySettingsLocaleSelector,
);

export const exchangeSettingsForPairSelector = (
  state: State,
  { from, to }: { from: Currency, to: Currency },
): string | null => state.settings.pairExchanges[pairHash(from, to)];

export const confirmationsNbForCurrencySelector = (
  state: State,
  { currency }: { currency: CryptoCurrency },
): number => {
  const obj = state.settings.currenciesSettings[currency.ticker];
  if (obj) return obj.confirmationsNb;
  const defs = currencySettingsDefaults(currency);
  return defs.confirmationsNb ? defs.confirmationsNb.def : 0;
};

export const preferredDeviceModelSelector = (state: State) => state.settings.preferredDeviceModel;
export const accountsViewModeSelector = (state: State) => state.settings.accountsViewMode;
export const marketIndicatorSelector = (state: State) => state.settings.marketIndicator;
export const sentryLogsSelector = (state: State) => state.settings.sentryLogs;
export const autoLockTimeoutSelector = (state: State) => state.settings.autoLockTimeout;
export const shareAnalyticsSelector = (state: State) => state.settings.shareAnalytics;
export const selectedTimeRangeSelector = (state: State) => state.settings.selectedTimeRange;
export const hasInstalledAppsSelector = (state: State) => state.settings.hasInstalledApps;
export const carouselVisibilitySelector = (state: State) => state.settings.carouselVisibility;
export const USBTroubleshootingIndexSelector = (state: State) =>
  state.settings.USBTroubleshootingIndex;

export const allowDebugAppsSelector = (state: State) => state.settings.allowDebugApps;
export const allowExperimentalAppsSelector = (state: State) => state.settings.allowExperimentalApps;
export const enablePlatformDevToolsSelector = (state: State) =>
  state.settings.enablePlatformDevTools;
export const catalogProviderSelector = (state: State) => state.settings.catalogProvider;

export const blacklistedTokenIdsSelector = (state: State) => state.settings.blacklistedTokenIds;
export const hasCompletedOnboardingSelector = (state: State) =>
  state.settings.hasCompletedOnboarding;

export const dismissedBannersSelector = (state: State) => state.settings.dismissedBanners || [];

export const dismissedBannerSelector = (state: State, { bannerKey }: { bannerKey: string }) =>
  (state.settings.dismissedBanners || []).includes(bannerKey);

export const dismissedBannerSelectorLoaded = (bannerKey: string) => (state: State) =>
  (state.settings.dismissedBanners || []).includes(bannerKey);

export const hideEmptyTokenAccountsSelector = (state: State) =>
  state.settings.hideEmptyTokenAccounts;

export const lastSeenDeviceSelector = (state: State) => state.settings.lastSeenDevice;

export const latestFirmwareSelector = (state: State) => state.settings.latestFirmware;

export const swapHasAcceptedIPSharingSelector = (state: State) =>
  state.settings.swap.hasAcceptedIPSharing;

export const swapSelectableCurrenciesSelector = (state: State) =>
  state.settings.swap.selectableCurrencies;

export const swapAcceptedProvidersSelector = (state: State) =>
  state.settings.swap.acceptedProviders;

export const swapKYCSelector = (state: State) => state.settings.swap.KYC;

export const showClearCacheBannerSelector = (state: State) => state.settings.showClearCacheBanner;

export const exportSettingsSelector = createSelector(
  counterValueCurrencySelector,
  state => state.settings.currenciesSettings,
  state => state.settings.pairExchanges,
  developerModeSelector,
  blacklistedTokenIdsSelector,
  (
    counterValueCurrency,
    currenciesSettings,
    pairExchanges,
    developerModeEnabled,
    blacklistedTokenIds,
  ) => ({
    counterValue: counterValueCurrency.ticker,
    currenciesSettings,
    pairExchanges,
    developerModeEnabled,
    blacklistedTokenIds,
  }),
);

export default handleActions(handlers, INITIAL_STATE);