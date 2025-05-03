'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface InventoryItem {
  item_id: number;
  item_type: string;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  total_quantity: number;
  reorder_level: number;
  locations: string | null;
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [receiptData, setReceiptData] = useState({
    item_type: 'RawMaterial',
    item_id: 0,
    quantity_received: 0,
    location_id: 1,
    notes: ''
  });
  const [issueData, setIssueData] = useState({
    item_type: 'RawMaterial',
    item_id: 0,
    quantity_to_issue: 0,
    notes: ''
  });

  // Fetch inventory summary on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory/summary');
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المخزون');
        }
        const data = await response.json();
        setInventoryItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleReceiptInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReceiptData(prev => ({
      ...prev,
      [name]: ['item_id', 'quantity_received', 'location_id'].includes(name) ? Number(value) : value
    }));
  };

  const handleIssueInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIssueData(prev => ({
      ...prev,
      [name]: ['item_id', 'quantity_to_issue'].includes(name) ? Number(value) : value
    }));
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...receiptData,
          user_id: 1 // In a real app, this would come from authentication context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تسجيل استلام المخزون');
      }

      // Refresh inventory data
      const inventoryResponse = await fetch('/api/inventory/summary');
      const updatedInventory = await inventoryResponse.json();
      setInventoryItems(updatedInventory);
      
      // Reset form and hide it
      setReceiptData({
        item_type: 'RawMaterial',
        item_id: 0,
        quantity_received: 0,
        location_id: 1,
        notes: ''
      });
      setShowReceiptForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issueData,
          user_id: 1 // In a real app, this would come from authentication context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تسجيل صرف المخزون');
      }

      // Refresh inventory data
      const inventoryResponse = await fetch('/api/inventory/summary');
      const updatedInventory = await inventoryResponse.json();
      setInventoryItems(updatedInventory);
      
      // Reset form and hide it
      setIssueData({
        item_type: 'RawMaterial',
        item_id: 0,
        quantity_to_issue: 0,
        notes: ''
      });
      setShowIssueForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">إدارة المخزون</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowReceiptForm(!showReceiptForm);
                setShowIssueForm(false);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-4"
            >
              {showReceiptForm ? 'إلغاء' : 'تسجيل استلام'}
            </button>
            <button
              onClick={() => {
                setShowIssueForm(!showIssueForm);
                setShowReceiptForm(false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {showIssueForm ? 'إلغاء' : 'تسجيل صرف'}
            </button>
          </div>
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

        {showReceiptForm && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">تسجيل استلام مخزون</h3>
              <form onSubmit={handleReceiptSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="item_type" className="block text-sm font-medium text-gray-700">
                      نوع العنصر
                    </label>
                    <div className="mt-1">
                      <select
                        id="item_type"
                        name="item_type"
                        required
                        value={receiptData.item_type}
                        onChange={handleReceiptInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="RawMaterial">مادة خام</option>
                        <option value="Product">منتج نهائي</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="item_id" className="block text-sm font-medium text-gray-700">
                      معرف العنصر
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="item_id"
                        id="item_id"
                        required
                        min="1"
                        value={receiptData.item_id || ''}
                        onChange={handleReceiptInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="quantity_received" className="block text-sm font-medium text-gray-700">
                      الكمية المستلمة
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="quantity_received"
                        id="quantity_received"
                        required
                        min="0.01"
                        step="0.01"
                        value={receiptData.quantity_received || ''}
                        onChange={handleReceiptInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                      موقع التخزين
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="location_id"
                        id="location_id"
                        min="1"
                        value={receiptData.location_id || ''}
                        onChange={handleReceiptInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      ملاحظات
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={receiptData.notes}
                        onChange={handleReceiptInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReceiptForm(false)}
                    className="ml-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    تسجيل الاستلام
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showIssueForm && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">تسجيل صرف مخزون</h3>
              <form onSubmit={handleIssueSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="issue_item_type" className="block text-sm font-medium text-gray-700">
                      نوع العنصر
                    </label>
                    <div className="mt-1">
                      <select
                        id="issue_item_type"
                        name="item_type"
                        required
                        value={issueData.item_type}
                        onChange={handleIssueInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="RawMaterial">مادة خام</option>
                        <option value="Product">منتج نهائي</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="issue_item_id" className="block text-sm font-medium text-gray-700">
                      معرف العنصر
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="item_id"
                        id="issue_item_id"
                        required
                        min="1"
                        value={issueData.item_id || ''}
                        onChange={handleIssueInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="quantity_to_issue" className="block text-sm font-medium text-gray-700">
                      الكمية المصروفة
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="quantity_to_issue"
                        id="quantity_to_issue"
                        required
                        min="0.01"
                        step="0.01"
                        value={issueData.quantity_to_issue || ''}
                        onChange={handleIssueInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="issue_notes" className="block text-sm font-medium text-gray-700">
                      ملاحظات
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="issue_notes"
                        name="notes"
                        rows={3}
                        value={issueData.notes}
                        onChange={handleIssueInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowIssueForm(false)}
                    className="ml-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    تسجيل الصرف
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
        ) : inventoryItems.length === 0 ? (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">لا توجد عناصر في المخزون حالياً</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الكود
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وحدة القياس
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الكمية المتوفرة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حد إعادة الطلب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryItems.map((item) => (
                  <tr key={`${item.item_type}-${item.item_id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.item_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.item_type === 'RawMaterial' ? 'مادة خام' : 'منتج نهائي'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.unit_of_measure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.total_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reorder_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.total_quantity <= item.reorder_level ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          تحت الحد
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          متوفر
                        </span>
                      )}
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
