/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _ocrEnv from "../_ocrEnv.js";
import type * as accounts from "../accounts.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as authNode from "../authNode.js";
import type * as budgets from "../budgets.js";
import type * as categories from "../categories.js";
import type * as moneyLeak from "../moneyLeak.js";
import type * as ocrHealth from "../ocrHealth.js";
import type * as pdfExtract from "../pdfExtract.js";
import type * as scanReceipt from "../scanReceipt.js";
import type * as transactions from "../transactions.js";
import type * as userPreferences from "../userPreferences.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _ocrEnv: typeof _ocrEnv;
  accounts: typeof accounts;
  admin: typeof admin;
  auth: typeof auth;
  authNode: typeof authNode;
  budgets: typeof budgets;
  categories: typeof categories;
  moneyLeak: typeof moneyLeak;
  ocrHealth: typeof ocrHealth;
  pdfExtract: typeof pdfExtract;
  scanReceipt: typeof scanReceipt;
  transactions: typeof transactions;
  userPreferences: typeof userPreferences;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
