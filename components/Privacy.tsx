import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="mb-6">
          <Link to="/" className="text-sm text-blue-600 hover:underline flex items-center">
            ← Back to Map
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Data Collection</h2>
            <p>
              PensacolaLights is designed with your privacy in mind. We do not require you to create an account to use the map or discovery features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Cookies & Local Storage</h2>
            <p>
              We use minimal cookies solely for functional purposes, such as ensuring that you can only leave one review per location. We do not use cookies for tracking, advertising, or selling your browsing history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Personal Information</h2>
            <p>
              We <strong>do not</strong> collect, store, or sell any personal information. Any reviews submitted are done so anonymously or with the display name you choose to provide at the time of submission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Location Data</h2>
            <p>
              If you choose to use geolocation features to find lights near you, your location data is processed locally on your device or temporarily used to query the map. We do not store your historical location data.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 text-sm text-slate-500">
            Last updated: December 2024
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;