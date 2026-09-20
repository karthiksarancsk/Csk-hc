'use client';

import { useState, useEffect, useRef } from 'react';
import { backupDatabaseAction, restoreDatabaseAction } from '@/actions/backupActions';
import { Download, Upload } from 'lucide-react';

export default function SettingsPage() {
  const [printerSize, setPrinterSize] = useState<'80mm' | '58mm'>('80mm');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pos_printer_size');
    if (saved === '80mm' || saved === '58mm') {
      setPrinterSize(saved);
    }
  }, []);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    localStorage.setItem('pos_printer_size', printerSize);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupError(null);
    try {
      const res = await backupDatabaseAction();
      if (res.success && res.data) {
        // Trigger download
        const blob = new Blob([Buffer.from(res.data, 'base64')], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = res.filename!;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setBackupError(res.error || 'Backup failed');
      }
    } catch (err: any) {
      setBackupError(err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRestoring(true);
    setRestoreMessage(null);

    try {
      const res = await restoreDatabaseAction(new FormData(event.currentTarget));
      if (res.success) {
        setRestoreMessage({ type: 'success', text: res.message! });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setRestoreMessage({ type: 'error', text: res.error || 'Restore failed' });
      }
    } catch (err: any) {
      setRestoreMessage({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure POS hardware, store preferences, and manage backups.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Hardware Configurations</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Select the default paper size for your thermal receipt printer.</p>
            </div>
            <div className="mt-5 sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="printerSize" className="sr-only">Printer Size</label>
                <select
                  id="printerSize"
                  value={printerSize}
                  onChange={(e) => setPrinterSize(e.target.value as '80mm' | '58mm')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  <option value="80mm">80mm (Standard POS)</option>
                  <option value="58mm">58mm (Compact POS)</option>
                </select>
              </div>
              <button
                onClick={handleSave}
                className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:mt-0 sm:w-auto"
              >
                Save Preference
              </button>
              {isSaved && <span className="ml-3 text-sm text-green-600">Saved!</span>}
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Data Backup & Restore</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Download a complete snapshot of your pharmacy database. Keep this safe.</p>
            </div>
            <div className="mt-5">
              <button
                onClick={handleBackup}
                disabled={isBackingUp}
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-400" />
                {isBackingUp ? 'Creating Snapshot...' : 'Download Database Backup'}
              </button>
              {backupError && <div className="mt-2 text-sm text-red-600">{backupError}</div>}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Restore Database</h4>
              <p className="text-sm text-gray-500 max-w-2xl mb-4">
                Upload a `.db` backup file to restore the database. The system will validate the file before applying. <strong>You must restart the application after a successful restore.</strong>
              </p>

              {restoreMessage && (
                <div className={`mb-4 p-3 rounded text-sm ${restoreMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {restoreMessage.text}
                </div>
              )}

              <form onSubmit={handleRestore}>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    name="databaseFile"
                    accept=".db,.sqlite,.sqlite3"
                    required
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={isRestoring}
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Upload className="-ml-0.5 mr-1.5 h-4 w-4" />
                    {isRestoring ? 'Restoring...' : 'Restore File'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}