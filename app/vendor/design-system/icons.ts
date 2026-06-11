/**
 * Single source of truth for ProviderIcon entries.
 *
 * Adding a provider here automatically:
 *   - extends the `ProviderIconType` union consumed by the dashboard/docs
 *   - regenerates `src/generated/icons.generated.css` via
 *     `scripts/build-provider-icons.ts` (run from the heft post-build hook)
 *   - shows up in the docs gallery at `docs/content/provider-icon.mdx`
 *
 * Omit `dark` when the dark-mode asset is identical to the light one.
 */

export interface IconDefinition {
  /** Display name (tooltips, aria labels, docs gallery). */
  name: string;
  /** Light-mode asset URL. */
  light: string;
  /** Dark-mode asset URL. Falls back to `light` when omitted. */
  dark?: string;
}

export const ALL_ICONS = {
  "access-people-hr": {
    name: "People HR",
    light: "https://cdn.workos.com/provider-icons/light/access-people-hr.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/access-people-hr.svg",
  },
  adp: {
    name: "ADP",
    light: "https://cdn.workos.com/provider-icons/light/adp.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/adp.svg",
  },
  apple: {
    name: "Apple",
    light: "https://cdn.workos.com/provider-icons/light/apple.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/apple.svg",
  },
  asana: {
    name: "Asana",
    light: "https://images.workoscdn.com/images/5776023c-3b24-46fa-9a93-a99d58a5a9cb.svg",
    dark: "https://images.workoscdn.com/images/7e11a0cd-1f25-4a6a-a3fd-bcbb95334f4e.svg",
  },
  attio: {
    name: "Attio",
    light: "https://images.workoscdn.com/images/9efdf379-aa5d-457d-aa23-6923beaad9ee.svg",
    dark: "https://images.workoscdn.com/images/12e793a8-fda0-4daa-9355-235338e8fa7c.svg",
  },
  auth0: {
    name: "Auth0",
    light: "https://cdn.workos.com/provider-icons/light/auth0.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/auth0.svg",
  },
  aws: {
    name: "AWS",
    light: "https://cdn.workos.com/provider-icons/light/aws.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/aws.svg",
  },
  azure: {
    name: "Azure",
    light: "https://cdn.workos.com/provider-icons/light/azure.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/azure.svg",
  },
  "bamboo-hr": {
    name: "BambooHR",
    light: "https://cdn.workos.com/provider-icons/light/bamboo-hr.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/bamboo-hr.svg",
  },
  "better-auth": {
    name: "Better Auth",
    light: "https://images.workoscdn.com/images/71afb31f-aaaf-455a-964d-7c50cca281cc.svg",
    dark: "https://images.workoscdn.com/images/3785da71-2a33-4fb9-91a0-fad9d84ec23e.svg",
  },
  bitbucket: {
    name: "Bitbucket",
    light: "https://cdn.workos.com/provider-icons/light/bitbucket.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/bitbucket.svg",
  },
  box: {
    name: "Box",
    light: "https://images.workoscdn.com/images/bb4e84af-0a7c-4135-a535-38d7ffeac030.svg",
    dark: "https://images.workoscdn.com/images/55902fa6-f6e0-4334-b419-70a8ff269505.svg",
  },
  "breathe-hr": {
    name: "Breathe HR",
    light: "https://cdn.workos.com/provider-icons/light/breathe-hr.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/breathe-hr.svg",
  },
  bubble: {
    name: "Bubble",
    light: "https://images.workoscdn.com/images/0e8d631a-2cb9-43f3-beb3-1aacef828c5c.svg",
    dark: "https://images.workoscdn.com/images/c1856499-73de-42fa-8d23-5bac63988ea3.svg",
  },
  "cal-dot-com": {
    name: "Cal.com",
    light: "https://images.workoscdn.com/images/26210195-3163-4768-9c4b-6b7b13787007.svg",
    dark: "https://images.workoscdn.com/images/4f26d267-3ac4-42d5-a32a-09096d845139.svg",
  },
  calendly: {
    name: "Calendly",
    light: "https://images.workoscdn.com/images/00de7de5-da46-454f-b808-82f78fe0e271.svg",
    dark: "https://images.workoscdn.com/images/1c4cc9ef-1bd4-4811-b8d4-ed238b90a9ab.svg",
  },
  cas: {
    name: "CAS",
    light: "https://cdn.workos.com/provider-icons/light/cas.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/cas.svg",
  },
  "cezanne-hr": {
    name: "Cezanne HR",
    light: "https://cdn.workos.com/provider-icons/light/cezanne-hr.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/cezanne-hr.svg",
  },
  classlink: {
    name: "ClassLink",
    light: "https://cdn.workos.com/provider-icons/light/classlink.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/classlink.svg",
  },
  clerk: {
    name: "Clerk",
    light: "https://images.workoscdn.com/images/bbf97591-238f-4b7e-9f10-3510a257bf7a.svg",
  },
  clever: {
    name: "Clever",
    light: "https://cdn.workos.com/provider-icons/light/clever.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/clever.svg",
  },
  cloudflare: {
    name: "Cloudflare",
    light: "https://cdn.workos.com/provider-icons/light/cloudflare.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/cloudflare.svg",
  },
  confluence: {
    name: "Confluence",
    light: "https://images.workoscdn.com/images/878593ae-61c1-4ad2-b8bb-df37c937b376.svg",
    dark: "https://images.workoscdn.com/images/9055ab0d-f411-40d8-8bf0-a4ae207bf1ba.svg",
  },
  cyberark: {
    name: "CyberArk",
    light: "https://cdn.workos.com/provider-icons/light/cyberark.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/cyberark.svg",
  },
  datadog: {
    name: "Datadog",
    light: "https://cdn.workos.com/provider-icons/light/datadog.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/datadog.svg",
  },
  datasite: {
    name: "Datasite",
    light: "https://images.workoscdn.com/images/2818918d-d34b-444d-b2d1-94968199833e.svg",
    dark: "https://images.workoscdn.com/images/b914311e-b46c-4185-b187-520520b62fa4.svg",
  },
  descope: {
    name: "Descope",
    light: "https://images.workoscdn.com/images/78506c75-3cde-43ed-9342-94201b889290.png",
  },
  discord: {
    name: "Discord",
    light: "https://cdn.workos.com/provider-icons/light/discord.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/discord.svg",
  },
  dropbox: {
    name: "Dropbox",
    light: "https://images.workoscdn.com/images/b6651c8a-2ee2-4657-954c-baaf89cbb1dc.svg",
    dark: "https://images.workoscdn.com/images/276e9c4f-46df-46a4-9ed7-cab10e954bd5.svg",
  },
  duo: {
    name: "Duo",
    light: "https://cdn.workos.com/provider-icons/light/duo.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/duo.svg",
  },
  facebook: {
    name: "Facebook",
    light: "https://images.workoscdn.com/images/0e6d8dea-d502-442f-8976-02c3e5192e2a.svg",
    dark: "https://images.workoscdn.com/images/e25739c9-c4e1-4e7a-8665-7617eee5eca5.svg",
  },
  firebase: {
    name: "Firebase",
    light: "https://cdn.workos.com/provider-icons/light/firebase.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/firebase.svg",
  },
  "fly-io": {
    name: "Fly.io",
    light: "https://images.workoscdn.com/images/c62b386d-c343-4158-8106-f4a324ac3383.svg",
    dark: "https://images.workoscdn.com/images/c7036d06-57bb-499e-ba09-c192b6a82d33.svg",
  },
  fourth: {
    name: "Fourth",
    light: "https://cdn.workos.com/provider-icons/light/fourth.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/fourth.svg",
  },
  "frame-io": {
    name: "Frame.io",
    light: "https://images.workoscdn.com/images/6c533c08-3723-451e-9ee1-bfda6b9c99e5.svg",
    dark: "https://images.workoscdn.com/images/675956c4-c609-4d3b-8823-eb121de4e233.svg",
  },
  front: {
    name: "Front",
    light: "https://images.workoscdn.com/images/9fccae28-46cd-4a48-b789-b1c30d393adb.svg",
    dark: "https://images.workoscdn.com/images/e543441c-76b4-4ba1-b99f-4b13036e3a1f.svg",
  },
  "generic-oauth": {
    name: "Generic OAuth",
    light: "https://images.workoscdn.com/images/0571bf84-5b97-4ef2-93d5-013a5f8657fc.svg",
    dark: "https://images.workoscdn.com/images/3b48c274-7344-4efd-93c0-6fc308040c8e.svg",
  },
  "generic-oidc": {
    name: "Generic OIDC",
    light: "https://cdn.workos.com/provider-icons/light/generic-oidc.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/generic-oidc.svg",
  },
  github: {
    name: "GitHub",
    light: "https://images.workoscdn.com/images/3945fc79-f9db-40d3-8688-eaaee193e583.svg",
    dark: "https://images.workoscdn.com/images/a78955a4-16f5-422a-872f-a06fc7a4212f.svg",
  },
  gitlab: {
    name: "GitLab",
    light: "https://images.workoscdn.com/images/2dd0bf56-1ee4-4a8f-91b8-8e129b97d6f2.svg",
    dark: "https://images.workoscdn.com/images/72518fcc-d78e-4803-ae6a-8a394fc32322.svg",
  },
  godaddy: {
    name: "GoDaddy",
    light: "https://cdn.workos.com/provider-icons/light/godaddy.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/godaddy.svg",
  },
  gong: {
    name: "Gong",
    light: "https://images.workoscdn.com/images/8f37e2e1-f3df-419a-9eb8-d23126ebfc31.svg",
    dark: "https://images.workoscdn.com/images/ffabcf80-ad5e-4dfc-afda-af8173e60c87.svg",
  },
  google: {
    name: "Google",
    light: "https://cdn.workos.com/provider-icons/light/google.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/google.svg",
  },
  "google-analytics": {
    name: "Google Analytics",
    light: "https://images.workoscdn.com/images/ad544954-34b2-42a4-b222-31267212bc8a.svg",
  },
  "google-calendar": {
    name: "Google Calendar",
    light: "https://images.workoscdn.com/images/0f4213db-bd84-4097-b66c-c26bfbca4f05.svg",
  },
  "google-cloud": {
    name: "Google Cloud",
    light: "https://cdn.workos.com/provider-icons/light/google-cloud.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/google-cloud.svg",
  },
  "google-drive": {
    name: "Google Drive",
    light: "https://images.workoscdn.com/images/55956988-24d8-4733-acb0-dc19949ebff7.svg",
    dark: "https://images.workoscdn.com/images/d65df86d-d61d-414b-aafc-5dc7fd661fac.svg",
  },
  "google-mail": {
    name: "Gmail",
    light: "https://images.workoscdn.com/images/5735eb12-b0e4-4127-87be-f541a9b282fc.svg",
  },
  greenhouse: {
    name: "Greenhouse",
    light: "https://images.workoscdn.com/images/978a6cd2-9d8b-4f43-962f-1fbd149b2009.svg",
  },
  helpscout: {
    name: "Help Scout",
    light: "https://images.workoscdn.com/images/2c444c55-392d-47ab-b5a6-1bb918692f3d.svg",
    dark: "https://images.workoscdn.com/images/e9f7b88f-045d-4aa3-8436-16364a17fb44.svg",
  },
  hibob: {
    name: "HiBob",
    light: "https://cdn.workos.com/provider-icons/light/hibob.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/hibob.svg",
  },
  hubspot: {
    name: "HubSpot",
    light: "https://images.workoscdn.com/images/ec2d62d0-64a7-4910-a437-782eaeeba7e5.svg",
    dark: "https://images.workoscdn.com/images/e002a40c-6971-42a5-ae6e-9b2c19018394.svg",
  },
  intercom: {
    name: "Intercom",
    light: "https://images.workoscdn.com/images/0afe7826-72a8-4673-9c95-7122ab12d011.svg",
    dark: "https://images.workoscdn.com/images/16d6f1eb-ac8f-41d4-99ea-af4b4613b38d.svg",
  },
  intralinks: {
    name: "Intralinks",
    light: "https://images.workoscdn.com/images/9a27d542-f7e2-4e55-9770-0706c00adcc1.svg",
    dark: "https://images.workoscdn.com/images/e0928d92-9910-459a-b0cc-df77d3b3deef.svg",
  },
  intuit: {
    name: "Intuit",
    light: "https://cdn.workos.com/provider-icons/light/intuit.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/intuit.svg",
  },
  jira: {
    name: "Jira",
    light: "https://images.workoscdn.com/images/feeb411a-2aa4-42b9-aa21-02395625d809.svg",
    dark: "https://images.workoscdn.com/images/d7deca97-c39b-47af-93ab-c3a8b2666e09.svg",
  },
  jumpcloud: {
    name: "JumpCloud",
    light: "https://cdn.workos.com/provider-icons/light/jumpcloud.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/jumpcloud.svg",
  },
  kakao: {
    name: "Kakao",
    light: "https://images.workoscdn.com/images/6e3f610c-3a1f-406b-adc1-9ddb8ab2b1a0.svg",
    dark: "https://images.workoscdn.com/images/f51941fa-20b2-4dfc-a709-7317ca6a75cd.svg",
  },
  keycloak: {
    name: "Keycloak",
    light: "https://cdn.workos.com/provider-icons/light/keycloak.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/keycloak.svg",
  },
  lastpass: {
    name: "LastPass",
    light: "https://cdn.workos.com/provider-icons/light/lastpass.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/lastpass.svg",
  },
  linear: {
    name: "Linear",
    light: "https://images.workoscdn.com/images/ea736232-215d-4925-8bf3-c3d7a4b24078.svg",
    dark: "https://images.workoscdn.com/images/4ffb242f-6ca9-4409-88b8-0249654ae6e4.svg",
  },
  linkedin: {
    name: "LinkedIn",
    light: "https://cdn.workos.com/provider-icons/light/linkedin.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/linkedin.svg",
  },
  "login-gov": {
    name: "Login.gov",
    light: "https://cdn.workos.com/provider-icons/light/login-gov.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/login-gov.svg",
  },
  microsoft: {
    name: "Microsoft",
    light: "https://cdn.workos.com/provider-icons/light/microsoft.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/microsoft.svg",
  },
  "microsoft-onedrive": {
    name: "Microsoft OneDrive",
    light: "https://images.workoscdn.com/images/54f8d9f2-4bf3-4bdb-b683-97f64549884c.svg",
  },
  "microsoft-onenote": {
    name: "Microsoft OneNote",
    light: "https://images.workoscdn.com/images/a50d310d-d96f-4e1b-82fa-6a70828503eb.svg",
    dark: "https://images.workoscdn.com/images/f2cdfd1d-2844-4712-95c3-458a5a9993fe.svg",
  },
  "microsoft-outlook": {
    name: "Microsoft Outlook",
    light: "https://images.workoscdn.com/images/f496a237-deef-436f-b8f3-4f5fb4c2d046.svg",
  },
  "microsoft-outlook-calendar": {
    name: "Microsoft Outlook Calendar",
    light: "https://images.workoscdn.com/images/4d046b8a-e5e3-47db-9dd5-bfdbaa2d716c.svg",
  },
  "microsoft-sharepoint": {
    name: "Microsoft SharePoint",
    light: "https://images.workoscdn.com/images/cf0ed455-5044-457c-ab08-054189a10469.svg",
    dark: "https://images.workoscdn.com/images/efba5efe-8ef3-47ff-b4a5-0104711c0c1d.svg",
  },
  "microsoft-teams": {
    name: "Microsoft Teams",
    light: "https://images.workoscdn.com/images/2318275c-b0e8-41d7-80ae-7962f878bb46.svg",
    dark: "https://images.workoscdn.com/images/1a1d73e1-ca64-46be-90e6-baacffdf9cc3.svg",
  },
  "microsoft-todo": {
    name: "Microsoft To Do",
    light: "https://images.workoscdn.com/images/3879087a-5f93-419c-ac4c-41b35d59f3c8.svg",
    dark: "https://images.workoscdn.com/images/54e74545-fea1-4da2-9499-5bc034670f43.svg",
  },
  miniorange: {
    name: "miniOrange",
    light: "https://cdn.workos.com/provider-icons/light/miniorange.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/miniorange.svg",
  },
  naver: {
    name: "Naver",
    light: "https://images.workoscdn.com/images/b414058d-fdae-4967-bc52-45d5c4c9ff41.svg",
    dark: "https://images.workoscdn.com/images/b83625f2-b8a1-4758-b6e3-da6d2ca34b61.svg",
  },
  "net-iq": {
    name: "NetIQ",
    light: "https://cdn.workos.com/provider-icons/light/net-iq.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/net-iq.svg",
  },
  netlify: {
    name: "Netlify",
    light: "https://images.workoscdn.com/images/16a6f785-02e2-46b0-90d7-4a7afc753bc9.svg",
    dark: "https://images.workoscdn.com/images/cd1cdb4f-c1b2-4ae0-80f6-f3bd99f2bc1c.svg",
  },
  "next-auth": {
    name: "NextAuth.js",
    light: "https://cdn.workos.com/provider-icons/light/next-auth.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/next-auth.svg",
  },
  notion: {
    name: "Notion",
    light: "https://cdn.workos.com/provider-icons/light/notion.svg",
    dark: "https://images.workoscdn.com/images/31a154ab-920d-4260-98b9-e8d911fdba46.svg",
  },
  okta: {
    name: "Okta",
    light: "https://cdn.workos.com/provider-icons/light/okta.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/okta.svg",
  },
  onelogin: {
    name: "OneLogin",
    light: "https://cdn.workos.com/provider-icons/light/onelogin.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/onelogin.svg",
  },
  oracle: {
    name: "Oracle",
    light: "https://cdn.workos.com/provider-icons/light/oracle.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/oracle.svg",
  },
  patreon: {
    name: "Patreon",
    light: "https://images.workoscdn.com/images/9962ad10-6933-4a8a-bdea-7333c0f9dfab.svg",
    dark: "https://images.workoscdn.com/images/a373bb71-6fc1-4569-aea6-13f68210b491.svg",
  },
  personio: {
    name: "Personio",
    light: "https://cdn.workos.com/provider-icons/light/personio.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/personio.svg",
  },
  "ping-identity": {
    name: "Ping Identity",
    light: "https://cdn.workos.com/provider-icons/light/ping-identity.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/ping-identity.svg",
  },
  pipedrive: {
    name: "Pipedrive",
    light: "https://images.workoscdn.com/images/ba524b94-0598-46eb-920f-89fe201eefd3.svg",
    dark: "https://images.workoscdn.com/images/502ef943-e79f-4f2a-8320-a8c674c3af3a.svg",
  },
  prefect: {
    name: "Prefect",
    light: "https://images.workoscdn.com/images/f9c1f8cc-7664-4a8f-95be-b1fe29b7c3ac.svg",
    dark: "https://images.workoscdn.com/images/72655a23-6dbc-43e1-9d18-8841331cb60e.svg",
  },
  "pydantic-logfire": {
    name: "Pydantic Logfire",
    light: "https://images.workoscdn.com/images/ca206994-bcec-4ca5-a16b-fa67e38d95ff.svg",
    dark: "https://images.workoscdn.com/images/c54b04e6-3e8a-4fab-995b-7111c0e9e60a.svg",
  },
  quickbooks: {
    name: "QuickBooks",
    light: "https://images.workoscdn.com/images/61346445-f883-47e5-81ca-4fb6250f7261.svg",
  },
  "react-native-expo": {
    name: "React Native (Expo)",
    light: "https://cdn.workos.com/provider-icons/light/react-native-expo.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/react-native-expo.svg",
  },
  rippling: {
    name: "Rippling",
    light: "https://cdn.workos.com/provider-icons/light/rippling.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/rippling.svg",
  },
  sailpoint: {
    name: "SailPoint",
    light: "https://cdn.workos.com/provider-icons/light/sailpoint.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/sailpoint.svg",
  },
  salesforce: {
    name: "Salesforce",
    light: "https://cdn.workos.com/provider-icons/light/salesforce.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/salesforce.svg",
  },
  segment: {
    name: "Segment",
    light:
      "https://images.workoscdn.com/images/76d2470d-af92-4a56-96f2-5167c7ab4317.svg?auto=format&fit=clip&q=80",
    dark: "https://images.workoscdn.com/images/ed5680a5-5b78-417b-96d4-e03ee8a39160.svg?auto=format&fit=clip&q=80",
  },
  sentry: {
    name: "Sentry",
    light: "https://images.workoscdn.com/images/d402f17e-17ce-4c32-a017-7469010f6dc8.svg",
    dark: "https://images.workoscdn.com/images/1ce1a74e-aad8-49d7-acda-9f219760ec48.svg",
  },
  shibboleth: {
    name: "Shibboleth",
    light: "https://cdn.workos.com/provider-icons/light/shibboleth.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/shibboleth.svg",
  },
  "simple-saml-php": {
    name: "SimpleSAMLphp",
    light: "https://cdn.workos.com/provider-icons/light/simple-saml-php.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/simple-saml-php.svg",
  },
  slack: {
    name: "Slack",
    light: "https://cdn.workos.com/provider-icons/light/slack.svg",
  },
  snowflake: {
    name: "Snowflake",
    light: "https://images.workoscdn.com/images/de5bb010-a1d4-4ed1-8395-099db5149efc.svg",
  },
  splunk: {
    name: "Splunk",
    light: "https://cdn.workos.com/provider-icons/light/splunk.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/splunk.svg",
  },
  stripe: {
    name: "Stripe",
    light: "https://images.workoscdn.com/images/44a8c194-4e70-4a6a-9bf5-72a055a4c967.svg",
    dark: "https://images.workoscdn.com/images/eb696a2b-ed4e-497a-a1ce-3c6c08dfde09.svg",
  },
  "stripe-connect": {
    name: "Stripe Connect",
    light: "https://images.workoscdn.com/images/44a8c194-4e70-4a6a-9bf5-72a055a4c967.svg",
    dark: "https://images.workoscdn.com/images/eb696a2b-ed4e-497a-a1ce-3c6c08dfde09.svg",
  },
  stytch: {
    name: "Stytch",
    light: "https://images.workoscdn.com/images/6f9e8078-80d2-4488-9984-eb58f6e929f3.svg",
    dark: "https://images.workoscdn.com/images/640f5660-5d1b-4f98-aa55-0f7cfde5c5fe.svg",
  },
  supabase: {
    name: "Supabase",
    light: "https://cdn.workos.com/provider-icons/light/supabase.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/supabase.svg",
  },
  "test-idp": {
    name: "Test IdP",
    light:
      "https://images.workoscdn.com/images/a54c81a9-62c1-49fc-b353-e1ec73aee23e.svg?auto=format&fit=clip&q=80",
    dark: "https://images.workoscdn.com/images/60e80e84-90fa-4e48-9dea-c9ca37828dd6.svg?auto=format&fit=clip&q=80",
  },
  tiktok: {
    name: "TikTok",
    light: "https://images.workoscdn.com/images/57f5dca3-e1ae-439f-ba35-b430494bc9ba.svg",
    dark: "https://images.workoscdn.com/images/029bde15-05db-42a4-b01b-47ecda3824ec.svg",
  },
  vercel: {
    name: "Vercel",
    light: "https://cdn.workos.com/provider-icons/light/vercel.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/vercel.svg",
  },
  vmware: {
    name: "VMware",
    light: "https://cdn.workos.com/provider-icons/light/vmware.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/vmware.svg",
  },
  workday: {
    name: "Workday",
    light: "https://cdn.workos.com/provider-icons/light/workday.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/workday.svg",
  },
  workos: {
    name: "WorkOS",
    light: "https://images.workoscdn.com/images/2577af2e-f6a0-418c-acb5-35f4e7a8a421.svg",
  },
  x: {
    name: "X",
    light: "https://images.workoscdn.com/images/9ddb58f0-0a5c-45a2-9c69-fef45fbf89f7.svg",
    dark: "https://images.workoscdn.com/images/0753d0e7-74b4-4fee-84d4-8c3e1ee32508.svg",
  },
  xero: {
    name: "Xero",
    light: "https://cdn.workos.com/provider-icons/light/xero.svg",
    dark: "https://cdn.workos.com/provider-icons/dark/xero.svg",
  },
  zapier: {
    name: "Zapier",
    light: "https://images.workoscdn.com/images/50b3305c-f753-4ed1-add0-539d2149f7ed.svg",
    dark: "https://images.workoscdn.com/images/535bcf47-fd12-4b2e-b687-7e710a4bbfcb.svg",
  },
  zendesk: {
    name: "Zendesk",
    light: "https://images.workoscdn.com/images/e835ee44-b6d6-40bc-ac3c-79c68afaa167.svg",
    dark: "https://images.workoscdn.com/images/2f191bbe-e5d4-460e-86c1-e9ac9e88d025.svg",
  },
  "zoho-mail": {
    name: "Zoho Mail",
    light: "https://images.workoscdn.com/images/3c9c257f-9afd-4a1d-b6e6-843421226db5.svg",
    dark: "https://images.workoscdn.com/images/d23973d3-cdaa-432a-a406-f8ff40544649.svg",
  },
  zoom: {
    name: "Zoom",
    light: "https://images.workoscdn.com/images/ecb0c474-2168-4c8a-8fae-a680648455b2.svg",
    dark: "https://images.workoscdn.com/images/99c4cfa2-f86f-4e2c-83a1-cb768847e166.svg",
  },
} as const satisfies Record<string, IconDefinition>;

export type ProviderIconSlug = keyof typeof ALL_ICONS;

export const isProviderIconSlug = (value: unknown): value is ProviderIconSlug =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(ALL_ICONS, value);

export const ALL_ICON_SLUGS: readonly ProviderIconSlug[] =
  Object.keys(ALL_ICONS).filter(isProviderIconSlug);
