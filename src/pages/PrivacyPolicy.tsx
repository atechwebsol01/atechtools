import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const PrivacyPolicy: React.FC = () => (
  <>
    <NavBar />
    <div className="container mx-auto py-8 px-4">
      <div className="glass-card rounded-xl p-6 mb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gradient-purple-blue mb-4">Privacy Policy</h1>
        <p className="text-white/80 mb-4">
          This Privacy Policy explains how ATECHTOOLS (atechtools.org) collects, uses, and protects your information when you use our platform.
        </p>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">1. Information We Collect</h2>
        <ul className="list-disc list-inside text-white/80 mb-4">
          <li>We do <b>not</b> collect personal information such as your name, address, or government ID.</li>
          <li>We may collect your public Solana wallet address to enable platform features.</li>
          <li>We may collect anonymous usage data to improve our services.</li>
        </ul>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">2. How We Use Information</h2>
        <ul className="list-disc list-inside text-white/80 mb-4">
          <li>To provide and improve our token creation and management services.</li>
          <li>To communicate with you if you contact us for support.</li>
        </ul>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">3. Data Sharing</h2>
        <ul className="list-disc list-inside text-white/80 mb-4">
          <li>We do <b>not</b> sell or share your personal data with third parties.</li>
          <li>We may share anonymous, aggregated usage data for analytics or platform improvement.</li>
        </ul>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">4. Cookies</h2>
        <ul className="list-disc list-inside text-white/80 mb-4">
          <li>We may use cookies or similar technologies to enhance your experience. You can disable cookies in your browser settings.</li>
        </ul>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">5. Contact</h2>
        <p className="text-white/80 mb-4">
          For questions or concerns, contact us at <a href="mailto:admin@atechtools.org" className="text-token-purple underline">admin@atechtools.org</a> or on Twitter <a href="https://twitter.com/atechtoolsorg" className="text-token-purple underline">@atechtoolsorg</a>.
        </p>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">6. Decentralization</h2>
        <p className="text-white/80 mb-4">
          ATECHTOOLS is a decentralized platform. You control your wallet and assets. We do not have access to your funds or private keys.
        </p>
        <h2 className="text-xl font-bold text-white mb-2 mt-6">7. Updates</h2>
        <p className="text-white/80 mb-4">
          We may update this policy from time to time. Changes will be posted on this page.
        </p>
      </div>
    </div>
    <Footer />
  </>
);

export default PrivacyPolicy;
