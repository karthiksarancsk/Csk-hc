'use client';

import { useState } from 'react';
import { createMedicineAction } from '@/actions/inventoryActions';
import { MedicineDTO } from '@/services/inventory';

export default function MedicineMasterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<MedicineDTO>({
    name: '',
    genericName: '',
    manufacturer: '',
    dosageForm: 'Tablet',
    unitType: 'Strip',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = await createMedicineAction(formData);
    if (res.success) {
      setMessage({ type: 'success', text: 'Medicine added successfully!' });
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        dosageForm: 'Tablet',
        unitType: 'Strip',
      });
      if (onSuccess) onSuccess();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to add medicine' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Add New Medicine</h2>

      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trade Name *</label>
            <input
              type="text"
              required
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Generic Name</label>
            <input
              type="text"
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Manufacturer</label>
            <input
              type="text"
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dosage Form</label>
            <select
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.dosageForm}
              onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value as any })}
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
              <option value="Ointment">Ointment</option>
              <option value="Drops">Drops</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Primary Unit</label>
            <select
              className="w-full border rounded p-2 focus:ring focus:ring-blue-200"
              value={formData.unitType}
              onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
            >
              <option value="Strip">Strip</option>
              <option value="Bottle">Bottle</option>
              <option value="Box">Box</option>
              <option value="Vial">Vial</option>
              <option value="Tube">Tube</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Medicine
        </button>
      </form>
    </div>
  );
}
