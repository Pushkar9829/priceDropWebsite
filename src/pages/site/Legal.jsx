import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../lib/hooks';

// Plain-language policy pages. Review with a lawyer before relying on them; update
// LAST_UPDATED and the contact address whenever the text or the business details change.
const SITE = 'droppingnow';
const CONTACT_EMAIL = 'droppingnowapp@gmail.com';
const LAST_UPDATED = '16 October 2026';

function LegalPage({ title, children }) {
  useDocumentTitle(title);
  return (
    <article className="container-page max-w-3xl py-10">
      <h1 className="dn-enter text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700 [&_a]:text-brand-600 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function AffiliateDisclosure() {
  return (
    <LegalPage title="Affiliate disclosure">
      <p>
        {SITE} is free to use. We earn a commission when you buy something after clicking a store link on our site, such as
        &ldquo;Get this deal&rdquo;. You pay the same price — the commission comes from the store, not from you.
      </p>
      <h2>How it works</h2>
      <ul>
        <li>
          Links to stores like Amazon, Flipkart, Myntra, Croma, Nykaa and Tata Cliq pass through our affiliate partner Cuelinks before
          reaching the store, so the store knows the visit came from us.
        </li>
        <li>Travel links (flights, hotels, activities) may pass through our partner Travelpayouts in the same way.</li>
        <li>As an Amazon Associate (through Cuelinks) we earn from qualifying purchases.</li>
      </ul>
      <h2>What commissions never change</h2>
      <ul>
        <li>Which store we show as cheapest — that is always the lowest price we found.</li>
        <li>Price history, price-drop alerts or the order of search results.</li>
      </ul>
      <p>
        Prices are checked automatically and can change at any time. Always confirm the final price on the store before you pay.
        Questions? Write to <Mail />.
      </p>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This policy explains what personal data {SITE} collects, why, and the choices you have. It is written to meet India&apos;s
        Digital Personal Data Protection Act, 2023.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your name, email address and password (stored only as a one-way hash).
        </li>
        <li>
          <strong>Your activity on {SITE}</strong> — products you watch, price alerts you set and the notifications we send you.
        </li>
        <li>
          <strong>Technical data</strong> — IP address and browser details in server logs, used for security and to fix errors.
        </li>
      </ul>
      <p>We do not collect payment details: purchases happen on the store&apos;s own website.</p>
      <h2>Why we use it</h2>
      <ul>
        <li>To run your account, watchlist and price alerts, and to email you when a price you are tracking drops.</li>
        <li>To keep the service secure and working.</li>
      </ul>
      <p>We do not sell your personal data.</p>
      <h2>Cookies and partners</h2>
      <p>
        We keep you signed in using your browser&apos;s local storage. Our affiliate partners (Cuelinks and Travelpayouts) set cookies
        when you click a store or travel link so the store can credit the visit to us. Fonts are loaded from Google Fonts. Our site
        is hosted on Vercel and Render, and data is stored in MongoDB Atlas; these providers process data only to run the service.
      </p>
      <h2>Your rights</h2>
      <ul>
        <li>See, correct or update your account details on the Account page.</li>
        <li>Ask us for a copy of your data, or to delete your account and data, by writing to <Mail />. We respond within 30 days.</li>
        <li>Turn off alerts at any time by pausing or deleting them on the Alerts page.</li>
      </ul>
      <h2>How long we keep data</h2>
      <p>
        We keep your account data while your account is open. When you ask us to delete it, we remove your account, watchlist,
        alerts and notifications.
      </p>
      <h2>Contact and grievances</h2>
      <p>
        For any privacy question or complaint, contact our grievance officer at <Mail />. See also our{' '}
        <Link to="/terms">terms of use</Link> and <Link to="/affiliate-disclosure">affiliate disclosure</Link>.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>By using {SITE} you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>The service</h2>
      <ul>
        <li>{SITE} compares prices from online stores, shows price history and alerts you to price drops. It is free to use.</li>
        <li>We do not sell products. Every purchase is made on the store&apos;s own website, under that store&apos;s terms.</li>
      </ul>
      <h2>Prices and accuracy</h2>
      <ul>
        <li>
          Prices, stock and offers are collected automatically and can be out of date or wrong. The price on the store at checkout
          is the one that counts.
        </li>
        <li>We are not responsible for a store&apos;s products, delivery, returns or refunds.</li>
      </ul>
      <h2>Your account</h2>
      <ul>
        <li>Keep your password private. You are responsible for activity on your account.</li>
        <li>Do not misuse the site: no automated scraping, overloading our servers or attempts to break its security.</li>
        <li>We may suspend accounts that break these terms.</li>
      </ul>
      <h2>Affiliate links</h2>
      <p>
        Some links earn us a commission at no extra cost to you. See our <Link to="/affiliate-disclosure">affiliate disclosure</Link>.
      </p>
      <h2>Liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;. To the extent the law allows, {SITE} is not liable for losses arising from
        using the site or relying on its prices. These terms are governed by the laws of India.
      </p>
      <h2>Changes and contact</h2>
      <p>
        We may update these terms; the date above shows the latest version. Questions? Write to <Mail />.
      </p>
    </LegalPage>
  );
}

export function About() {
  return (
    <LegalPage title="About us">
      <p>
        {SITE} helps shoppers in India stop overpaying. We track prices across Amazon, Flipkart, Croma and other stores, keep the
        full price history of every product, and alert you the moment a price you care about drops.
      </p>
      <h2>How we make money</h2>
      <p>
        The site is free. When you buy through our store links we may earn a small commission from the store — never from you.
        Read the <Link to="/affiliate-disclosure">affiliate disclosure</Link>.
      </p>
      <h2>Contact</h2>
      <p>
        Questions, feedback, partnership or data requests: <Mail />.
      </p>
    </LegalPage>
  );
}
