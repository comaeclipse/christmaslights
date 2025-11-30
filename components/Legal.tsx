import React from 'react';
import { Link } from 'react-router-dom';

const Legal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="mb-6">
          <Link to="/" className="text-sm text-blue-600 hover:underline flex items-center">
            ← Back to Map
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Legal Disclaimer</h1>
        
        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Information Accuracy</h2>
            <p>
              The locations and details displayed on PensacolaLights are collected from public sources, community submissions, and general observation. While we strive for accuracy, we cannot guarantee that every display will be active or identical to the description provided. Hours of operation are subject to change by the homeowners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Private Property</h2>
            <p>
              The displays listed on this map are located on private property. Please respect the homeowners' privacy and property rights. Do not enter driveways or walk on lawns unless explicitly invited by signage. Please keep music volume respectful and do not block driveways or traffic.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Ownership & Removal Requests</h2>
            <p>
              If you are a homeowner of a location listed on this site and wish for it to be removed or updated, please contact us. Upon verification of ownership, we will promptly remove or modify your listing in accordance with your wishes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Liability</h2>
            <p>
              PensacolaLights assumes no liability for any accidents, traffic violations, or damages that may occur while visiting these locations. Please drive safely and follow all local traffic laws.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Legal;