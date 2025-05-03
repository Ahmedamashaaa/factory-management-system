'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Sale {
  sale_id: number;
  sale_date: string;
  customer_name: string;
  rep_id: number;
  rep_name: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  notes: string | null;
}

interface SalesRep {
  rep_id: number;
  rep_name: string;
}

interface Product {
  product_id: number;
  product_name: string;
  selling_price: number;
  unit_of_measure: string;
}

interface SaleItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSale, setNewSale] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    rep_id: 0,
    payment_status: 'pending',
    delivery_status: 'pending',
    notes: ''
  });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SaleItem>({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    total_price: 0
  });

  // Fetch sales, sales reps, and products on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sales
        const salesResponse = await fetch('/api/sales');
        if (!salesResponse.ok) {
          throw new Error('فشل في جلب بيانات المبيعات');
        }
        const salesData = await salesResponse.json();
        setSales(salesData);

        // Fetch sales reps
        const repsResponse = await fetch('/api/sales-reps');
        if (!repsResponse.ok) {
          throw new Error('فشل في جلب بيانات المناديب');
        }
        const repsData = await repsResponse.json();
        setSalesReps(repsData);

        // Fetch products
        const productsResponse = await fetch('/api/products');
        if (!productsResponse.ok) {
          throw new Error('فشل في جلب بيانات المنتجات');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSale(prev => ({
      ...prev,
      [name]: name === 'rep_id' ? Number(value) : value
    }));
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'product_id') {
      const selectedProduct = products.find(p => p.product_id === Number(value));
      if (selectedProduct) {
        setCurrentItem(prev => ({
          ...prev,
          product_id: Number(value),
          unit_price: selectedProduct.selling_price,
          total_price: selectedProduct.selling_price * prev.quantity
        }));
      }
    } else if (name === 'quantity') {
      const quantity = Number(value);
      setCurrentItem(prev => ({
        ...prev,
        quantity,
        total_price: prev.unit_price * quantity
      }));
    } else if (name === 'unit_price') {
      const unitPrice = Number(value);
      setCurrentItem(prev => ({
        ...prev,
        unit_price: unitPrice,
        total_price: unitPrice * prev.quantity
      }));
    }
  };

  const addItemToSale = () => {
    if (currentItem.product_id === 0 || currentItem.quantity <= 0) {
      setError('يرجى اختيار منتج وتحديد كمية صحيحة');
      return;
    }

    const selectedProduct = products.find(p => p.product_id === currentItem.product_id);
    if (!selectedProduct) {
      setError('المنتج المحدد غير موجود');
      return;
    }

    // Add product name to the item
    const newItem: SaleItem = {
      ...currentItem,
      product_name: selectedProduct.product_name
    };

    // Check if product already exists in the sale items
    const existingItemIndex = saleItems.findIndex(item => item.product_id === currentItem.product_id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...saleItems];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + currentItem.quantity,
        total_price: (existingItem.quantity + currentItem.quantity) * existingItem.unit_price
      };
      setSaleItems(updatedItems);
    } else {
      // Add new item
      setSaleItems(prev => [...prev, newItem]);
    }

    // Reset current item
    setCurrentItem({
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total_price: 0
    });
  };

  const removeItemFromSale = (productId: number) => {
    setSaleItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const calculateTotalAmount = () => {
    return saleItems.reduce((total, item) => total + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل للبيع');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSale,
          total_amount: calculateTotalAmount(),
          items: saleItems
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إضافة البيع');
      }

      const addedSale = await response.json();
      
      // Update the list with the new sale
      setSales(prev => [...prev, addedSale]);
      
      // Reset form and hide it
      setNewSale({
        sale_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        rep_id: 0,
        payment_status: 'pending',
        delivery_status: 'pending',
        notes: ''
      });
      setSaleItems([]);
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا البيع؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف البيع');
      }

      // Remove the deleted sale from the list
      setSales(prev => prev.filter(sale => sale.sale_id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateSaleStatus = async (id: number, field: string, value: string) => {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة البيع');
      }

      // Update the sale status in the list
      setSales(prev => prev.map(sale => 
        sale.sale_id === id 
          ? { ...sale, [field]: value } 
          : sale
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">إدارة المبيعات</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAddForm ? 'إلغاء' : 'إضافة بيع جديد'}
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
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">إضافة بيع جديد</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="sale_date" className="block text-sm font-medium text-gray-700">
                      تاريخ البيع
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="sale_date"
                        id="sale_date"
                        required
                        value={newSale.sale_date}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
                      اسم العميل
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="customer_name"
                        id="customer_name"
                        required
                        value={newSale.customer_name}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="rep_id" className="block text-sm font-medium text-gray-700">
                      المندوب
                    </label>
                    <div className="mt-1">
                      <select
                        id="rep_id"
                        name="rep_id"
                        required
                        value={newSale.rep_id || ''}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">اختر المندوب</option>
                        {salesReps.map(rep => (
                          <option key={rep.rep_id} value={rep.rep_id}>
                            {rep.rep_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700">
                      حالة الدفع
                    </label>
                    <div className="mt-1">
                      <select
                        id="payment_status"
                        name="payment_status"
                        required
                        value={newSale.payment_status}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="partial">مدفوع جزئياً</option>
                        <option value="paid">مدفوع بالكامل</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="delivery_status" className="block text-sm font-medium text-gray-700">
                      حالة التسليم
                    </label>
                    <div className="mt-1">
                      <select
                        id="delivery_status"
                        name="delivery_status"
                        required
                        value={newSale.delivery_status}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="processing">قيد التجهيز</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
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
                        value={newSale.notes}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">إضافة منتجات</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                        المنتج
                      </label>
                      <div className="mt-1">
                        <select
                          id="product_id"
                          name="product_id"
                          value={currentItem.product_id || ''}
                          onChange={handleItemInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">اختر المنتج</option>
                          {products.map(product => (
                            <option key={product.product_id} value={product.product_id}>
                              {product.product_name} ({product.selling_price} جنيه / {product.unit_of_measure})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        الكمية
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="quantity"
                          id="quantity"
                          min="1"
                          value={currentItem.quantity || ''}
                          onChange={handleItemInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
                        سعر الوحدة
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="unit_price"
                          id="unit_price"
                          min="0"
                          step="0.01"
                          value={currentItem.unit_price || ''}
                          onChange={handleItemInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="total_price" className="block text-sm font-medium text-gray-700">
                        الإجمالي
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="total_price"
                          readOnly
                          value={currentItem.total_price || ''}
                          className="bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="invisible block text-sm font-medium text-gray-700">
                        إضافة
                      </label>
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={addItemToSale}
                          className="w-full bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>

                  {saleItems.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-md font-medium text-gray-900 mb-2">المنتجات المضافة</h5>
                      <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                المنتج
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الكمية
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                سعر الوحدة
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الإجمالي
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">حذف</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {saleItems.map((item) => (
                              <tr key={item.product_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.product_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.unit_price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.total_price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => removeItemFromSale(item.product_id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    حذف
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50">
                              <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-left">
                                الإجمالي
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {calculateTotalAmount().toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">لا توجد مبيعات مسجلة حالياً</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إضافة بيع جديد
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم البيع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المندوب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حالة الدفع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حالة التسليم
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">تعديل</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.sale_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.sale_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.sale_date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.rep_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={sale.payment_status}
                        onChange={(e) => updateSaleStatus(sale.sale_id, 'payment_status', e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="partial">مدفوع جزئياً</option>
                        <option value="paid">مدفوع بالكامل</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={sale.delivery_status}
                        onChange={(e) => updateSaleStatus(sale.sale_id, 'delivery_status', e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="processing">قيد التجهيز</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => {/* Handle view details */}}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        عرض
                      </button>
                      <button
                        onClick={() => handleDelete(sale.sale_id)}
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
