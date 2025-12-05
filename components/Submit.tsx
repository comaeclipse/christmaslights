import React, { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/apiClient';

const Submit: React.FC = () => {
  // Form fields
  const [address, setAddress] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Captcha state
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // UI states
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load captcha on mount
  useEffect(() => {
    loadCaptcha();
  }, []);

  async function loadCaptcha() {
    setIsLoadingCaptcha(true);
    setError(null);
    try {
      const data = await api.getCaptcha();
      setCaptchaQuestion(data.question);
      setCaptchaToken(data.token);
    } catch (err) {
      setError('Failed to load captcha. Please refresh the page.');
    } finally {
      setIsLoadingCaptcha(false);
    }
  }

  function hasSubmittedRecently(): boolean {
    return document.cookie.split(';').some(
      (item) => item.trim().startsWith('submitted_location=')
    );
  }

  function markAsSubmitted() {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    document.cookie = `submitted_location=true; expires=${date.toUTCString()}; path=/`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Check 24-hour cooldown
    if (hasSubmittedRecently()) {
      setError('You recently submitted a location. Please wait 24 hours before submitting another.');
      return;
    }

    // Validate fields
    if (!address.trim()) {
      setError('Address is required');
      return;
    }

    if (!captchaAnswer.trim()) {
      setError('Please answer the math question');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.submitLocation({
        address,
        additionalInfo,
        captchaAnswer: parseInt(captchaAnswer),
        captchaToken,
      });

      // Success!
      setSubmitSuccess(true);
      markAsSubmitted();

      // Reset form after 3 seconds
      setTimeout(() => {
        setAddress('');
        setAdditionalInfo('');
        setCaptchaAnswer('');
        setSubmitSuccess(false);
        loadCaptcha();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
      loadCaptcha(); // Refresh captcha on error
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Submit a Location
          </h1>
          <p className="text-slate-600 text-sm">
            Suggest a Christmas lights display to be added to the map
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {submitSuccess ? (
            // Success Message
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎄</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Thank you!
              </h2>
              <p className="text-slate-600">
                Your submission will be reviewed by our team before being added to the map.
              </p>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Address Field */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State ZIP"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Additional Info Field */}
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-slate-700 mb-1">
                  Additional Information <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any details about the display, hours, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Captcha */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-medium text-slate-700 mb-1">
                  Security Check <span className="text-red-500">*</span>
                </label>
                {isLoadingCaptcha ? (
                  <div className="text-slate-500 text-sm py-2">Loading...</div>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-slate-800 mb-2 bg-slate-50 p-3 rounded border border-slate-200">
                      {captchaQuestion}
                    </div>
                    <input
                      type="number"
                      id="captcha"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Your answer"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoadingCaptcha}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Location'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-slate-600 hover:text-slate-900 text-sm underline"
          >
            ← Back to Map
          </a>
        </div>
      </div>
    </div>
  );
};

export default Submit;
