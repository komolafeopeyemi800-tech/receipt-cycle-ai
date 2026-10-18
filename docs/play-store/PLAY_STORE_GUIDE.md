# Receipt Cycle: Google Play publishing guide

Everything you need to fill in on Google Play Console, in the order the console asks for it.
Text blocks marked COPY can be pasted as they are. No text here uses em dashes.

Files that go with this guide:
- `long_description.txt` in this folder: the full description (2,908 characters, limit 4,000)
- `SCREENSHOT_BRIEF.md` in this folder: the 8 screenshots plan for the image designer
- The signed bundle: `C:\Users\zenit\receipt-cycle-keys\release\receipt-cycle-v1.0.2-code1.aab`

---

## 0. Your upload key (back this up today)

The bundle is signed with a new upload key I created for you. Without this key you cannot publish updates unless Google resets it (possible, but slow).

| Item | Value |
|---|---|
| Keystore file | `C:\Users\zenit\receipt-cycle-keys\receipt-cycle-upload.jks` |
| Passwords and alias | `C:\Users\zenit\receipt-cycle-keys\keystore.properties` |
| Alias | receipt-cycle-upload |
| Upload key SHA-1 | 77:D0:B0:A1:1F:1D:73:CD:D1:37:B5:16:F5:7C:F9:B5:C9:CE:D4:EA |
| Upload key SHA-256 | 08:C2:25:F1:27:2B:8F:F5:F9:C7:B4:88:B2:64:AC:DB:E3:88:DB:FC:B1:F7:7F:92:6D:63:AB:30:BF:54:44:05 |

Do this now: copy the whole `receipt-cycle-keys` folder to a password manager or two separate safe places (cloud drive that is private, plus a USB stick). Never put it in GitHub. It is outside the project folder on purpose.

---

## 1. Create the developer account (skip if you already have one)

1. Go to https://play.google.com/console and sign in with the Google account you want to own the app long term.
2. Pay the one-time registration fee (25 USD).
3. Choose the account type:
   - Personal: needs a closed test with at least 12 testers for 14 days in a row before you can go to production (see section 9).
   - Organization (needs a D-U-N-S number): exempt from that test requirement.
4. Verify your identity and your phone. Verification can take a few days, so start it first.

---

## 2. Create the app

Play Console, All apps, Create app.

| Field | Choose |
|---|---|
| App name | Receipt Cycle Invoice Manager |
| Default language | English (United States) en-US |
| App or game | App |
| Free or paid | Free |
| Declarations | Tick both: Developer Program Policies, US export laws |

Package name (fixed, cannot change later): `com.receiptcycle.mobile`

---

## 3. Store listing (Grow users, Store presence, Main store listing)

### App name (30 characters max, this is 29)
COPY:
```
Receipt Cycle Invoice Manager
```

### Short description (80 characters max, this is 79)
COPY:
```
Scan receipts, track expenses, send invoices and estimates, and stay on budget.
```

### Full description (4,000 characters max, this is 2,908)
Open `long_description.txt` in this folder and paste the whole file.

Why this wording is compliant:
- Keywords from your research appear naturally and once or twice each: expense tracker, receipt scanner, invoice maker, estimate, budget tracker, income and expenses, accounting records, spreadsheet export, payment reminders. There is no keyword list and no repeated phrases.
- No "best", "#1", "free forever", star ratings, download counts, emojis, ALL CAPS shouting (only section headings use capitals), or references to other apps.
- It states a disclaimer that the app does not give tax or legal advice.
- No pricing is promised. The only offer mentioned is the 7 day free trial, which matches the app.

### Graphics
| Asset | Spec |
|---|---|
| App icon | 512 x 512 PNG, 32-bit, max 1 MB. Use `apps/mobile/assets/icon.png`, resized to exactly 512 x 512. |
| Feature graphic | 1024 x 500 PNG or JPEG, required. No text near the edges, no phone frames needed. Suggested headline: "Scan. Invoice. Get paid." |
| Phone screenshots | 2 minimum, 8 maximum, 16:9 or 9:16, each side between 320 and 3840 px. Use the 8 images from `SCREENSHOT_BRIEF.md`. |
| 7 inch and 10 inch tablet screenshots | Optional. Skip for now. |

### App category and tags (Store settings)
| Field | Choose |
|---|---|
| App category | Finance (it is where expense trackers sit in your search results). Business is the alternative if you want to compete with invoice makers. |
| Tags (pick up to 5) | Expense tracker, Invoice, Budget, Accounting, Receipt scanner (use the nearest tags offered) |

### Contact details
| Field | Value |
|---|---|
| Email | support@receiptcycle.com (must be a mailbox you read; Google emails policy notices here) |
| Website | https://receiptcycle.com |
| Phone | Optional, leave empty |

---

## 4. Policy pages and links

| Item | URL |
|---|---|
| Privacy policy | https://receiptcycle.com/privacy |
| Account deletion web page (needed in the Data safety form) | https://receiptcycle.com/delete-account |
| Terms of service | https://receiptcycle.com/terms |

Check that all three open without signing in before you submit.

---

## 5. App content (Policy and programs, App content)

Work through each card in this order.

### 5.1 Privacy policy
Paste https://receiptcycle.com/privacy

### 5.2 Ads
Does your app contain ads? **No.**

### 5.3 App access
Choose: **All or some functionality is restricted** (the app needs a sign-in). Add instructions:

COPY (replace the two bracketed values with a test account that you create):
```
Sign in with email and password, or use Continue with Google.
Test account email: playreview@receiptcycle.com
Test account password: (copy it from reviewer-password.txt in your receipt-cycle-keys folder; it is not stored in the repo)
After signing in you land on the Home screen. Everything is reachable from the bottom tabs. To see the camera features, allow the camera permission when asked.
```
Create that test account in the app yourself, finish onboarding, and add 3 or 4 sample transactions and one invoice so the reviewer sees real content. Tell me if you want me to create and seed it for you.

### 5.4 Content rating
Start the IARC questionnaire. Category: **Utility, Productivity, Communication or other**. Answer **No** to every question about violence, sexual content, language, controlled substances, gambling and user-to-user sharing of unmoderated content. The app does not let users chat or publish content to other users. Expected result: Everyone / PEGI 3.

### 5.5 Target audience
Target age group: **18 and over** only. Do not tick any child age group. The app is not designed for children.

### 5.6 Data safety
This is the form that most often delays approval. Answer it exactly as below; it matches the app and the privacy policy.

**Does your app collect or share any of the required user data types?** Yes
**Is all of the user data collected by your app encrypted in transit?** Yes (all traffic uses HTTPS)
**Do you provide a way for users to request that their data is deleted?** Yes
- In-app: More, Profile and Account, Delete account
- Web link: https://receiptcycle.com/delete-account

Data types (tick only these; for each: Collected = yes, Shared = see note, Optional or required as listed):

| Category | Data type | Collected | Shared | Required or optional | Purpose |
|---|---|---|---|---|---|
| Personal info | Name | Yes | No | Required | App functionality, Account management |
| Personal info | Email address | Yes | No | Required | App functionality, Account management |
| Personal info | Phone number | Yes | No | Optional (business profile, customers) | App functionality |
| Personal info | Address | Yes | No | Optional (business profile, customers) | App functionality |
| Financial info | Other financial info (transactions, balances, invoices, estimates, payments, budgets) | Yes | No | Required | App functionality |
| Photos and videos | Photos | Yes | No | Optional (receipt photos, logo, avatar) | App functionality |
| Audio | Voice or sound recordings | Yes | No | Optional (voice entry) | App functionality |
| Files and docs | Files and docs | Yes | No | Optional (uploaded statements and documents) | App functionality |
| Contacts | Contacts | **No** (see note) | No | n/a | n/a |
| App info and performance | Crash logs and Diagnostics | Only tick if you added a crash reporter. The app does not, so leave unticked. | | | |
| Device or other IDs | Device or other IDs (push notification token) | Yes | No | Optional | App functionality (notifications) |

Notes for the shared column:
- Google's rules say that sending data to a service provider that processes it only on your behalf (cloud hosting, an AI model that reads a receipt for you) is **not** "sharing". Cloudflare (hosting and storage), OpenAI (reading receipt photos, voice and text), Microsoft Azure (reading scanned PDFs and photos), Google Firebase (push messages) and Google Sign-In all act as service providers. So Shared stays **No**. If you later add analytics or advertising, revisit this.
- Contacts: the app reads the phone's address book only on the phone after the user taps Continue and allows the permission, and copies only the one contact the user picks into a form. Nothing is uploaded in bulk. Because the picked contact is saved as a customer, it is already covered by Name, Email, Phone and Address above. Leaving the Contacts type unticked is correct for on-device use. (The permission itself is explained by the in-app disclosure screen and the privacy policy.)
- Location: not collected. Leave unticked.
- Data processed ephemerally (not stored): receipt photos sent to the reader are stored as your evidence, so they count as collected.

Security practices (next page):
- Data is encrypted in transit: Yes
- You can request data deletion: Yes
- Committed to the Play Families Policy: No (not a children's app)
- Independent security review: No

### 5.7 Government apps
No.

### 5.8 Financial features declaration
Choose: **My app does not provide any financial services** (it records and invoices; it does not lend, pay, hold or move money, and it is not a bank or trading app).

### 5.9 Health apps
No health features.

### 5.10 News app, Advertising ID
- News app: No
- Advertising ID: **No**, the app does not use it. If the form asks which permissions in the manifest, nothing about advertising ID is present.

### 5.11 Permissions you will be asked about
The app declares these. Each has a clear purpose and an in-app explanation.

| Permission | Purpose | User sees |
|---|---|---|
| CAMERA | Scan receipts | Runtime prompt when opening Scan |
| RECORD_AUDIO | Voice entry | Runtime prompt when tapping the microphone |
| POST_NOTIFICATIONS | Payment and reminder notifications | Runtime prompt, off by default per type |
| READ_CONTACTS | Pick a customer from the address book | Explanation screen first ("Use your phone contacts?"), then the prompt |

There is no SMS, call log, location, storage-wide or background-location permission, and no "All files access".

---

## 6. Store settings summary

| Setting | Choose |
|---|---|
| Countries and regions | Start with United States only. Add more later. |
| Price | Free |
| Contains ads | No |
| In-app purchases | None in the app (see note below) |

Note on payments: the app does not sell anything and has no purchase link. Pro plans are bought on the website with Polar. If in the future you add a button inside the Android app that sells Pro access, Google requires Google Play Billing for digital content inside the app (rules for external links vary by country and change often, so check the policy before you add any). As it is today, the app is a "reader" for access bought on the website, so there is nothing to declare.

---

## 7. Create the release (Test and release, Testing, Closed testing)

For a new personal account you must start in a **closed test**, not production.

1. Test and release, Testing, Closed testing, Create track (name: "Testers"), Create new release.
2. **App signing**: choose "Use Play App Signing" (the default). Google keeps the real signing key and re-signs your app. Your keystore is only the upload key.
3. Upload `receipt-cycle-v1.0.2-code1.aab`.
4. Release name: `1.0.2 (1)`
5. Release notes (COPY):
```
<en-US>
First test release of Receipt Cycle Invoice Manager.
Scan receipts, upload statements, create invoices and estimates, track payments and budgets, and export a professional spreadsheet.
</en-US>
```
6. Testers tab: create an email list ("Testers") and add the Google account email of every tester (at least 12 for personal accounts). Copy the **opt-in link** and send it to them. They must open it on their phone, tap Become a tester, then install from Play.
7. Review and roll out.

Every new upload needs a higher versionCode. The bundle is versionCode 1 and versionName 1.0.2. Tell me when you need the next build and I will bump it to 2, 3 and so on.

---

## 8. After the first upload: fix Google Sign-In (important)

When Play re-signs your app, the signing certificate changes, and Continue with Google will fail with error 10 or "developer error" until you register it.

1. Play Console, Test and release, App integrity, Play app signing. Copy the **App signing key certificate SHA-1** (and SHA-256).
2. Open https://console.cloud.google.com, select the Receipt Cycle project, APIs and Services, Credentials, open the **Android** OAuth client for `com.receiptcycle.mobile`. Add the new SHA-1. If only one SHA-1 is allowed per client, create a second Android client with the same package name and the Play SHA-1 (and keep the debug one for your own testing).
3. In the Firebase console, Project settings, your Android app, Add fingerprint: add the Play app signing SHA-1 and the upload key SHA-1 from section 0. Download the new `google-services.json` if Firebase offers one and tell me; I will replace it and rebuild.
4. Wait a few minutes, install from the Play test link, and test Google sign-in again.

---

## 9. The 12 tester rule, and going to production

Personal accounts created after November 2023 need a closed test with at least 12 testers who stay opted in for 14 days in a row. Then Play Console shows **Apply for production**. You answer a short questionnaire about the test, and Google reviews (usually a few days). Confirm the current numbers in the console because Google changes them. Organization accounts skip this.

Practical advice: invite 15 to 20 people, ask them to open the app on at least a few of the 14 days, and collect their feedback. Their engagement is part of what Google reads.

Production checklist:
1. Closed test passed, apply for production.
2. Promote the release from the closed track to Production, countries: United States.
3. Staged rollout of 20 percent first, then 100 percent.

---

## 10. Before you press Send for review

- [ ] AAB uploaded and release rolled out to the closed track
- [ ] Store listing complete: name, short description, full description, icon, feature graphic, 2 or more screenshots
- [ ] Privacy policy URL works
- [ ] App access instructions with a working test account
- [ ] Content rating, target audience (18+), Ads (No), Data safety, Financial features, Government, Health done
- [ ] Support email is monitored
- [ ] Upload key backed up in two places
- [ ] Play signing SHA-1 added in Google Cloud and Firebase, Google sign-in tested from the Play install
- [ ] Account deletion works inside the app and the web page

## 11. Things I could not verify for you

- I have not driven the release build through a Play install, since that requires your Play account. Test the opt-in link on your own phone first.
- The tester numbers and some form wording change from time to time on Google's side. If a field in the console differs from this guide, follow the console and ask me.
- The Data safety answers are based on what the app and server do today. If you add analytics, ads, a crash reporter or in-app purchases, the form must be updated before that release.
