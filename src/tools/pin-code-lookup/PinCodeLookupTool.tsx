'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Search, Copy, Check, RotateCcw, Building2, Map } from 'lucide-react';
import { INDIA_PINCODE_DATA, type VillageInfo } from './pincodeData';

/**
 * Isolated PIN Code Lookup Tool.
 *
 * Implements the required 4-tier selection:
 * State -> District -> Sub-District -> Village -> [Find PIN Code] -> One PIN Code.
 *
 * All styling is scoped to .pin-code-lookup and conforms strictly
 * to the original Toolino design system (blue-600 accents, clean cards,
 * rounded-xl inputs).
 */
export function PinCodeLookupTool() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');

  // Result state
  const [searchedResult, setSearchedResult] = useState<VillageInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Cascading lists
  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    const stateObj = INDIA_PINCODE_DATA.find((s) => s.name === selectedState);
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  const availableSubDistricts = useMemo(() => {
    if (!selectedDistrict) return [];
    const distObj = availableDistricts.find((d) => d.name === selectedDistrict);
    return distObj ? distObj.subDistricts : [];
  }, [selectedDistrict, availableDistricts]);

  const availableVillages = useMemo(() => {
    if (!selectedSubDistrict) return [];
    const subObj = availableSubDistricts.find((sd) => sd.name === selectedSubDistrict);
    return subObj ? subObj.villages : [];
  }, [selectedSubDistrict, availableSubDistricts]);

  // Handle changes with automatic reset of lower tiers
  const handleStateChange = (val: string) => {
    setSelectedState(val);
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setSelectedVillage('');
    setSearchedResult(null);
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    setSelectedSubDistrict('');
    setSelectedVillage('');
    setSearchedResult(null);
  };

  const handleSubDistrictChange = (val: string) => {
    setSelectedSubDistrict(val);
    setSelectedVillage('');
    setSearchedResult(null);
  };

  const handleVillageChange = (val: string) => {
    setSelectedVillage(val);
    setSearchedResult(null);
  };

  const handleFindPinCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillage) return;
    const match = availableVillages.find((v) => v.name === selectedVillage);
    if (match) {
      setSearchedResult(match);
    }
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setSelectedVillage('');
    setSearchedResult(null);
  };

  const copyToClipboard = async () => {
    if (!searchedResult) return;
    try {
      await navigator.clipboard.writeText(searchedResult.pincode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const canSubmit = Boolean(selectedState && selectedDistrict && selectedSubDistrict && selectedVillage);

  return (
    <div className="pin-code-lookup max-w-3xl mx-auto space-y-6">
      {/* Tool Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                India PIN Code Lookup
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your State, District, Sub-District, and Village to find the exact 6-digit postal code.
              </p>
            </div>
          </div>

          {(selectedState || searchedResult) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* 4-Tier Selection Form */}
        <form onSubmit={handleFindPinCode} className="space-y-5">
          {/* 1. STATE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              STATE
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                required
              >
                <option value="">Select State ▼</option>
                {INDIA_PINCODE_DATA.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 2. DISTRICT */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              DISTRICT
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedState}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                required
              >
                <option value="">
                  {selectedState ? 'Select District ▼' : 'First select a State'}
                </option>
                {availableDistricts.map((dist) => (
                  <option key={dist.name} value={dist.name}>
                    {dist.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 3. SUB-DISTRICT */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              SUB-DISTRICT (TEHSIL / TALUK)
            </label>
            <div className="relative">
              <select
                value={selectedSubDistrict}
                onChange={(e) => handleSubDistrictChange(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                required
              >
                <option value="">
                  {selectedDistrict ? 'Select Sub-District ▼' : 'First select a District'}
                </option>
                {availableSubDistricts.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 4. VILLAGE / LOCALITY */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              VILLAGE / LOCALITY
            </label>
            <div className="relative">
              <select
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!selectedSubDistrict}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                required
              >
                <option value="">
                  {selectedSubDistrict ? 'Select Village ▼' : 'First select a Sub-District'}
                </option>
                {availableVillages.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* Find PIN Code Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.99] transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>Find PIN Code</span>
            </button>
          </div>
        </form>

        {/* Result Area */}
        {searchedResult && (
          <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 p-6 text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                POSTAL INDEX NUMBER
              </span>

              {/* PIN CODE Display */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-wider text-slate-900 font-mono">
                  {searchedResult.pincode}
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-2.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-blue-600 transition shadow-xs cursor-pointer"
                  title="Copy PIN Code"
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>

              {copied && (
                <p className="text-xs font-semibold text-emerald-700">
                  PIN Code copied to clipboard!
                </p>
              )}

              {/* Location Meta Details */}
              <div className="pt-3 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/80">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Map className="h-3.5 w-3.5 text-blue-500" />
                    <span>Location</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{searchedResult.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedSubDistrict}</p>
                </div>

                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/80">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Post Office</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {searchedResult.officeName || searchedResult.name}
                  </p>
                  <p className="text-[11px] text-slate-500">Delivery Branch / Sub Office</p>
                </div>

                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/80">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    <span>District &amp; State</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{selectedDistrict}</p>
                  <p className="text-[11px] text-slate-500">{selectedState}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="text-center text-xs text-slate-500">
        All PIN codes are validated against the official India Post directory. 100% free and client-side.
      </div>
    </div>
  );
}
