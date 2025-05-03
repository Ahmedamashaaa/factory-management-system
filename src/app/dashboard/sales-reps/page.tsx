'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface SalesRep {
  rep_id: number;
  rep_name: string;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  commission_rate: number;
  is_active: boolean;
  assigned_areas: string | null;
}

export default function SalesRepsPage() {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSalesRep, setNewSalesRep] = useState({
    rep_name: '',
    phone_number: '',
    email: '',
    address: '',
    commission_rate: 5,
    is_active: true,
    assigned_areas: ''
  });

  // Fetch sales representatives on component mount
  useEffect(() => {
    const fetchSalesReps = async () => {
      try {
        const response = await fetch('/api/sales-reps');
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المناديب');
        }
        const data = await response.json();
        setSalesReps(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesReps();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewSalesRep(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'commission_rate' 
          ? Number(value) 
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sales-reps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSalesRep),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إضافة المندوب');
      }

      const addedSalesRep = await response.json();
      
      // Update the list with the new sales rep
      setSalesReps(prev => [...prev, addedSalesRep]);
      
      // Reset form and hide it
      setNewSalesRep({
        rep_name: '',
        phone_number: '',
        email: '',
        address: '',
        commission_rate: 5,
        is_active: true,
        assigned_areas: ''
      });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/sales-reps/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف المندوب');
      }

      // Remove the deleted sales rep from the list
      setSalesReps(prev => prev.filter(rep => rep.rep_id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSalesRepStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/sales-reps/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('فشل في تغيير حالة المندوب');
      }

      // Update the sales rep status in the list
      setSalesReps(prev => prev.map(rep => 
        rep.rep_id === id 
          ? { ...rep, is_active: !currentStatus } 
          : rep
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">إدارة المناديب</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAddForm ? 'إلغاء' : 'إضافة مندوب جديد'}
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">إضافة مندوب جديد</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="rep_name" className="block text-sm font-medium text-gray-700">
                      اسم المندوب
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="rep_name"
                        id="rep_name"
                        required
                        value={newSalesRep.rep_name}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                      رقم الهاتف
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone_number"
                        id="phone_number"
                        value={newSalesRep.phone_number}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      البريد الإلكتروني
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={newSalesRep.email}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700">
                      نسبة العمولة (%)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="commission_rate"
                        id="commission_rate"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                        value={newSalesRep.commission_rate}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      العنوان
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={newSalesRep.address}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="assigned_areas" className="block text-sm font-medium text-gray-700">
                      المناطق المخصصة
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="assigned_areas"
                        name="assigned_areas"
                        rows={3}
                        value={newSalesRep.assigned_areas}
                        onChange={handleInputChange}
                        placeholder="أدخل المناطق المخصصة للمندوب، مفصولة بفواصل"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_active"
                          name="is_active"
                          type="checkbox"
                          checked={newSalesRep.is_active}
                          onChange={handleInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="mr-3 text-sm">
                        <label htmlFor="is_active" className="font-medium text-gray-700">
                          مندوب نشط
                        </label>
                        <p className="text-gray-500">حدد هذا الخيار إذا كان المندوب يعمل حالياً</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="ml-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        ) : salesReps.length === 0 ? (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">لا يوجد مناديب مسجلين حالياً</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إضافة مندوب جديد
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم المندوب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الهاتف
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نسبة العمولة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المناطق المخصصة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">تعديل</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesReps.map((rep) => (
                  <tr key={rep.rep_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rep.rep_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.phone_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.assigned_areas || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rep.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          نشط
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          غير نشط
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => toggleSalesRepStatus(rep.rep_id, rep.is_active)}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        {rep.is_active ? 'إيقاف' : 'تنشيط'}
                      </button>
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(rep.rep_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
