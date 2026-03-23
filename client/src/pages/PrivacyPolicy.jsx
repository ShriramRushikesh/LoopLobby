import React from 'react';

export default function PrivacyPolicy() {
  const date = new Date().toLocaleDateString();
  const email = "shriramrushikesh@gmail.com";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto prose prose-invert prose-pink">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-zinc-400 mb-8 font-medium italic">Effective Date: {date}</p>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-pink-400">1. Introduction</h2>
          <p>
            LoopLobby ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our synchronized music platform.
          </p>

          <h2 className="text-2xl font-semibold text-pink-400">2. Information We Collect</h2>
          <p>
            We collect minimal information required to provide our service:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> We may collect diagnostic and usage logs for performance monitoring and bug fixing.</li>
            <li><strong>Cookies:</strong> We use cookies to store your session preferences and for synchronization logic.</li>
            <li><strong>Room Data:</strong> Any songs added to your queue are stored in-memory and cleared after the session.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-pink-400">3. Google AdSense & Third-Party Cookies</h2>
          <p>
            We use Google AdSense to serve advertisements. Google uses cookies to serve ads based on your prior visits to LoopLobby or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.
          </p>
          <p>
            You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-pink-400 hover:underline">Google Ad Settings</a>.
          </p>

          <h2 className="text-2xl font-semibold text-pink-400">4. GDPR (EU Users)</h2>
          <p>
            Under the General Data Protection Regulation (GDPR), users in the European Union have the following rights:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to access your data.</li>
            <li>Right to rectify or delete your diagnostic data.</li>
            <li>Right to object to or restrict processing.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-pink-400">5. CCPA (California Users)</h2>
          <p>
            Under the California Consumer Privacy Act (CCPA), California residents have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request disclosure of personal information collected.</li>
            <li>Request deletion of personal information.</li>
            <li>Opt-out of the "sale" of personal information (Note: We do not sell your personal data).</li>
          </ul>

          <h2 className="text-2xl font-semibold text-pink-400">6. Indian IT Act 2000 Disclosure</h2>
          <p>
            In compliance with the Information Technology Act, 2000 (India) and Rules made thereunder, LoopLobby ensures reasonable security practices for the data collected. We do not store sensitive personal data or information (SPDI) unless explicitly required for synchronization, and such data is never shared with third parties without your consent.
          </p>

          <h2 className="text-2xl font-semibold text-pink-400">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <br/>
            <span className="font-bold text-pink-400">{email}</span>
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-white/10 text-center text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} LoopLobby. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
