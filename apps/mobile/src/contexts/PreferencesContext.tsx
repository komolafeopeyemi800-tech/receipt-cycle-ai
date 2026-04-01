import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../../convex/_generated/api";
import {
  PREF_KEYS,
  SETTINGS_STORAGE_KEYS,
  type DateFormatId,
  type SavedLocation,
  formatMoneyAmount,
  formatMoneyCompact,
  formatDateYmd,
} from "../lib/preferences";
import { useAuth } from "./AuthContext";

type Ctx = {
  ready: boolean;
  currency: string;
  setCurrency: (c: string) => Promise<void>;
  dateFormat: DateFormatId;
  setDateFormat: (d: DateFormatId) => Promise<void>;
  locations: SavedLocation[];
  setLocations: (rows: SavedLocation[]) => Promise<void>;
  merchants: string[];
  setMerchants: (names: string[]) => Promise<void>;
  reimbursements: boolean;
  setReimbursements: (v: boolean) => Promise<void>;
  txnNumber: boolean;
  setTxnNumber: (v: boolean) => Promise<void>;
  scanPayment: boolean;
  setScanPayment: (v: boolean) => Promise<void>;
  requirePay: boolean;
  setRequirePay: (v: boolean) => Promise<void>;
  requireNotes: boolean;
  setRequireNotes: (v: boolean) => Promise<void>;
  formatMoney: (n: number) => string;
  formatMoneyCompact: (n: number) => string;
  formatDate: (ymd: string) => string;
};

const PreferencesContext = createContext<Ctx | null>(null);

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [currency, setCurrencyState] = useState("USD");
  const [dateFormat, setDateFormatState] = useState<DateFormatId>("iso");
  const [locations, setLocationsState] = useState<SavedLocation[]>([]);
  const [merchants, setMerchantsState] = useState<string[]>([]);
  const [reimbursements, setReimbursementsState] = useState(false);
  const [txnNumber, setTxnNumberState] = useState(false);
  const [scanPayment, setScanPaymentState] = useState(true);
  const [requirePay, setRequirePayState] = useState(false);
  const [requireNotes, setRequireNotesState] = useState(false);

  const upsertRemote = useMutation(api.userPreferences.upsert);
  const remoteRow = useQuery(api.userPreferences.get, user?.id ? { userId: user.id } : "skip");
  const runtime = useQuery(api.admin.publicConfig, {});

  const lastRemoteJson = useRef<string | null>(null);
  const nullRemoteSeeded = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshot = useRef({
    currency,
    dateFormat,
    locations,
    merchants,
    reimbursements,
    txnNumber,
    scanPayment,
    requirePay,
    requireNotes,
  });
  snapshot.current = {
    currency,
    dateFormat,
    locations,
    merchants,
    reimbursements,
    txnNumber,
    scanPayment,
    requirePay,
    requireNotes,
  };

  const pushToConvex = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    const s = snapshot.current;
    try {
      await upsertRemote({
        userId: uid,
        currency: s.currency,
        dateFormat: s.dateFormat,
        merchants: s.merchants,
        locations: s.locations,
        reimbursements: s.reimbursements,
        txnNumber: s.txnNumber,
        scanPayment: s.scanPayment,
        requirePay: s.requirePay,
        requireNotes: s.requireNotes,
      });
    } catch {
      /* ignore — offline or transient */
    }
  }, [user?.id, upsertRemote]);

  const scheduleConvexSync = useCallback(() => {
    if (!user?.id) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncTimer.current = null;
      void pushToConvex();
    }, 400);
  }, [user?.id, pushToConvex]);

  useEffect(() => {
    void (async () => {
      try {
        const keys = [
          PREF_KEYS.currency,
          PREF_KEYS.dateFormat,
          PREF_KEYS.locationsJson,
          PREF_KEYS.merchantsJson,
          SETTINGS_STORAGE_KEYS.reimbursements,
          SETTINGS_STORAGE_KEYS.txnNumber,
          SETTINGS_STORAGE_KEYS.scanPayment,
          SETTINGS_STORAGE_KEYS.requirePay,
          SETTINGS_STORAGE_KEYS.requireNotes,
        ];
        const r = await AsyncStorage.multiGet(keys);
        const map = Object.fromEntries(r);
        if (map[PREF_KEYS.currency] && String(map[PREF_KEYS.currency]).length === 3) {
          setCurrencyState(String(map[PREF_KEYS.currency]).toUpperCase());
        }
        const df = map[PREF_KEYS.dateFormat];
        if (df === "iso" || df === "us" || df === "eu") setDateFormatState(df);
        setLocationsState(parseJson(map[PREF_KEYS.locationsJson], []));
        const m = parseJson<string[]>(map[PREF_KEYS.merchantsJson], []);
        if (Array.isArray(m)) setMerchantsState(m.filter((x): x is string => typeof x === "string"));
        setReimbursementsState(map[SETTINGS_STORAGE_KEYS.reimbursements] === "1");
        setTxnNumberState(map[SETTINGS_STORAGE_KEYS.txnNumber] === "1");
        setScanPaymentState(map[SETTINGS_STORAGE_KEYS.scanPayment] !== "0");
        setRequirePayState(map[SETTINGS_STORAGE_KEYS.requirePay] === "1");
        setRequireNotesState(map[SETTINGS_STORAGE_KEYS.requireNotes] === "1");
      } catch {
        /* ignore */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    lastRemoteJson.current = null;
    nullRemoteSeeded.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!ready || !user?.id) return;
    if (remoteRow === undefined) return;
    if (remoteRow === null) {
      if (nullRemoteSeeded.current) return;
      nullRemoteSeeded.current = true;
      const s = snapshot.current;
      void (async () => {
        try {
          await upsertRemote({
            userId: user.id,
            currency: s.currency,
            dateFormat: s.dateFormat,
            merchants: s.merchants,
            locations: s.locations,
            reimbursements: s.reimbursements,
            txnNumber: s.txnNumber,
            scanPayment: s.scanPayment,
            requirePay: s.requirePay,
            requireNotes: s.requireNotes,
          });
        } catch {
          nullRemoteSeeded.current = false;
        }
      })();
      return;
    }

    const payload = {
      currency: remoteRow.currency,
      dateFormat: remoteRow.dateFormat,
      merchants: remoteRow.merchants,
      locations: remoteRow.locations,
      reimbursements: remoteRow.reimbursements ?? false,
      txnNumber: remoteRow.txnNumber ?? false,
      scanPayment: remoteRow.scanPayment ?? true,
      requirePay: remoteRow.requirePay ?? false,
      requireNotes: remoteRow.requireNotes ?? false,
    };
    const j = JSON.stringify(payload);
    if (lastRemoteJson.current === j) return;
    lastRemoteJson.current = j;

    setCurrencyState(payload.currency);
    setDateFormatState(payload.dateFormat);
    setMerchantsState(payload.merchants);
    setLocationsState(payload.locations);
    setReimbursementsState(payload.reimbursements);
    setTxnNumberState(payload.txnNumber);
    setScanPaymentState(payload.scanPayment);
    setRequirePayState(payload.requirePay);
    setRequireNotesState(payload.requireNotes);

    void (async () => {
      try {
        await AsyncStorage.multiSet([
          [PREF_KEYS.currency, payload.currency],
          [PREF_KEYS.dateFormat, payload.dateFormat],
          [PREF_KEYS.locationsJson, JSON.stringify(payload.locations)],
          [PREF_KEYS.merchantsJson, JSON.stringify(payload.merchants)],
          [SETTINGS_STORAGE_KEYS.reimbursements, payload.reimbursements ? "1" : "0"],
          [SETTINGS_STORAGE_KEYS.txnNumber, payload.txnNumber ? "1" : "0"],
          [SETTINGS_STORAGE_KEYS.scanPayment, payload.scanPayment ? "1" : "0"],
          [SETTINGS_STORAGE_KEYS.requirePay, payload.requirePay ? "1" : "0"],
          [SETTINGS_STORAGE_KEYS.requireNotes, payload.requireNotes ? "1" : "0"],
        ]);
      } catch {
        /* ignore */
      }
    })();
  }, [ready, user?.id, remoteRow, upsertRemote]);

  useEffect(() => {
    if (!runtime?.adminManagedPreferences) return;
    if (typeof runtime.prefReimbursements === "boolean") setReimbursementsState(runtime.prefReimbursements);
    if (typeof runtime.prefTxnNumber === "boolean") setTxnNumberState(runtime.prefTxnNumber);
    if (typeof runtime.prefScanPayment === "boolean") setScanPaymentState(runtime.prefScanPayment);
    if (typeof runtime.prefRequirePay === "boolean") setRequirePayState(runtime.prefRequirePay);
    if (typeof runtime.prefRequireNotes === "boolean") setRequireNotesState(runtime.prefRequireNotes);
  }, [
    runtime?.adminManagedPreferences,
    runtime?.prefReimbursements,
    runtime?.prefTxnNumber,
    runtime?.prefScanPayment,
    runtime?.prefRequirePay,
    runtime?.prefRequireNotes,
  ]);

  const setCurrency = useCallback(
    async (c: string) => {
      const v = c.slice(0, 3).toUpperCase();
      setCurrencyState(v);
      try {
        await AsyncStorage.setItem(PREF_KEYS.currency, v);
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync],
  );

  const setDateFormat = useCallback(
    async (d: DateFormatId) => {
      setDateFormatState(d);
      try {
        await AsyncStorage.setItem(PREF_KEYS.dateFormat, d);
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync],
  );

  const setLocations = useCallback(
    async (rows: SavedLocation[]) => {
      setLocationsState(rows);
      try {
        await AsyncStorage.setItem(PREF_KEYS.locationsJson, JSON.stringify(rows));
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync],
  );

  const setMerchants = useCallback(
    async (names: string[]) => {
      setMerchantsState(names);
      try {
        await AsyncStorage.setItem(PREF_KEYS.merchantsJson, JSON.stringify(names));
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync],
  );

  const setReimbursements = useCallback(
    async (v: boolean) => {
      if (runtime?.adminManagedPreferences) return;
      setReimbursementsState(v);
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEYS.reimbursements, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync, runtime?.adminManagedPreferences],
  );

  const setTxnNumber = useCallback(
    async (v: boolean) => {
      if (runtime?.adminManagedPreferences) return;
      setTxnNumberState(v);
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEYS.txnNumber, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync, runtime?.adminManagedPreferences],
  );

  const setScanPayment = useCallback(
    async (v: boolean) => {
      if (runtime?.adminManagedPreferences) return;
      setScanPaymentState(v);
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEYS.scanPayment, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync, runtime?.adminManagedPreferences],
  );

  const setRequirePay = useCallback(
    async (v: boolean) => {
      if (runtime?.adminManagedPreferences) return;
      setRequirePayState(v);
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEYS.requirePay, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync, runtime?.adminManagedPreferences],
  );

  const setRequireNotes = useCallback(
    async (v: boolean) => {
      if (runtime?.adminManagedPreferences) return;
      setRequireNotesState(v);
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEYS.requireNotes, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      scheduleConvexSync();
    },
    [scheduleConvexSync, runtime?.adminManagedPreferences],
  );

  const formatMoney = useCallback((n: number) => formatMoneyAmount(n, currency), [currency]);

  const formatMoneyCompactCb = useCallback((n: number) => formatMoneyCompact(n, currency), [currency]);

  const formatDate = useCallback((ymd: string) => formatDateYmd(ymd, dateFormat), [dateFormat]);

  const value = useMemo(
    () => ({
      ready,
      currency,
      setCurrency,
      dateFormat,
      setDateFormat,
      locations,
      setLocations,
      merchants,
      setMerchants,
      reimbursements,
      setReimbursements,
      txnNumber,
      setTxnNumber,
      scanPayment,
      setScanPayment,
      requirePay,
      setRequirePay,
      requireNotes,
      setRequireNotes,
      formatMoney,
      formatMoneyCompact: formatMoneyCompactCb,
      formatDate,
    }),
    [
      ready,
      currency,
      setCurrency,
      dateFormat,
      setDateFormat,
      locations,
      setLocations,
      merchants,
      setMerchants,
      reimbursements,
      setReimbursements,
      txnNumber,
      setTxnNumber,
      scanPayment,
      setScanPayment,
      requirePay,
      setRequirePay,
      requireNotes,
      setRequireNotes,
      formatMoney,
      formatMoneyCompactCb,
      formatDate,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
