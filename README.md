# yours.

> An editorial platform where creators submit their artwork (art, design, performance, music, craft, etc.) for curation.

Built with **React 19**, **TypeScript**, **Vite**, and **Pure CSS Custom Properties**, ready for deployment on **Cloudflare Pages** with optional **Supabase** backend.

---

## 🎯 Features & Compliance

- **Authentication & Role Separation (Mock Database)**:
  - **Guest (Unauthenticated)**:
    - Navbar only shows: `Submit` & `Track` tabs + `[ Log in ]` button (Curate tab is completely hidden).
    - Landing page hero is clean and minimal (the 3 cards have been removed).
    - Clicking *Submit* or *Track* prompts the user to Sign In or Create Account.
  - **Creator Login (e.g. Rani Wulandari)**:
    - Navbar only shows: `Submit` & `My Submissions` tabs + user profile pill with status dot and `Logout` (Curate tab is completely hidden).
    - Submitting artwork automatically associates with the logged-in creator.
    - `My Submissions` automatically tracks all artworks created by this account in real-time without needing to enter ticket IDs manually.
  - **Curator Admin Login**:
    - Navbar ONLY shows `Curate` tab + curator admin pill and `Logout`. Public Submit and Track tabs are hidden.
    - Direct access to the Curation Console, metrics, submission inspection drawer, revision notes modal, and status controls.
  - **Pre-configured Hardcoded Accounts** (available via 1-Click Demo buttons in the Auth Modal):
    - **Creator**: `rani@example.com` / `user123` (or `creator@example.com` / `user123`)
    - **Admin**: `admin@yours.editorial` / `admin123`
- **Visual System**:
  - Deterministic frosted glass tile grid (`TileGrid.tsx`) with staircase blue gradient on Hero and Success screens.
  - Minimalist editorial design tokens (`tokens.css`): `--cb` (#0b20e6), `--cb-light` (#6f9bff), `--bk`, `--bg` with faint 120px vertical grid lines, `--ln`, `--mt`, and `--rd`.
  - Google Fonts: *Bricolage Grotesque* (headlines) & *DM Sans* (body).
  - WCAG AA compliant contrast, no external UI library, no external images.
- **Data Layer & Architecture**:
  - `ISubmissionRepository` with `LocalStorageSubmissionRepository` (fallback with seed records) and `SupabaseSubmissionRepository` (pluggable when `.env` is provided).
  - Cloudflare Pages SPA redirect rule (`public/_redirects`).

---

## 🚀 Run Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Build for Production (Cloudflare Pages)
```bash
npm run build
```
The compiled static assets will be in `dist/`.

---

## ☁️ Deployment to Cloudflare Pages

1. Push this repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Set the build configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. *(Optional)* Add Environment Variables in Cloudflare Pages settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Save and Deploy**. Cloudflare automatically honors `public/_redirects` for client-side routing.

---

## 🗄️ Supabase Migration (Optional)

When ready to switch from local storage to Supabase:
1. Open your project at [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** and run the query found in `supabase/schema.sql`.
3. Copy your Project URL and anon public key into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart `npm run dev`. The app will seamlessly switch to Supabase without touching any UI code!
