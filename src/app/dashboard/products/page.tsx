'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Product {
  product_id: number;
  product_code: string;
  product_name: string;
  description: string | null;
  unit_of_measure: string;
  selling_price: number;
  reorder_level: number;
  is_active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_code: '',
    product_name: '',
    description: '',
    unit_of_measure: 'عبوة',
    selling_price: 0,
    reorder_level: 10,
    is_active: true
  });

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المنتجات');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : ['selling_price', 'reorder_level'].includes(name) 
          ? Number(value) 
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إضافة المنتج');
      }

      const addedProduct = await response.json();
      
      // Update the list with the new product
      setProducts(prev => [...prev, addedProduct]);
      
      // Reset form and hide it
      setNewProduct({
        product_code: '',
        product_name: '',
        description: '',
        unit_of_measure: 'عبوة',
        selling_price: 0,
        reorder_level: 10,
        is_active: true
      });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف المنتج');
      }

      // Remove the deleted product from the list
      setProducts(prev => prev.filter(product => product.product_id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleProductStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('فشل في تغيير حالة المنتج');
      }

      // Update the product status in the list
      setProducts(prev => prev.map(product => 
        product.product_id === id 
          ? { ...product, is_active: !currentStatus } 
          : product
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">إدارة المنتجات</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAddForm ? 'إلغاء' : 'إضافة منتج جديد'}
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
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">إضافة منتج جديد</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="product_code" className="block text-sm font-medium text-gray-700">
                      كود المنتج
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="product_code"
                        id="product_code"
                        required
                        value={newProduct.product_code}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                      اسم المنتج
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="product_name"
                        id="product_name"
                        required
                        value={newProduct.product_name}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      الوصف
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={newProduct.description}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="unit_of_measure" className="block text-sm font-medium text-gray-700">
                      وحدة القياس
                    </label>
                    <div className="mt-1">
                      <select
                        id="unit_of_measure"
                        name="unit_of_measure"
                        value={newProduct.unit_of_measure}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="عبوة">عبوة</option>
                        <option value="كرتونة">كرتونة</option>
                        <option value="كجم">كيلوجرام</option>
                        <option value="قطعة">قطعة</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">
                      سعر البيع
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="selling_price"
                        id="selling_price"
                        min="0"
                        step="0.01"
                        required
                        value={newProduct.selling_price}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">
                      حد إعادة الطلب
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="reorder_level"
                        id="reorder_level"
                        min="0"
                        value={newProduct.reorder_level}
                        onChange={handleInputChange}
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
                          checked={newProduct.is_active}
                          onChange={handleInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="mr-3 text-sm">
                        <label htmlFor="is_active" className="font-medium text-gray-700">
                          منتج نشط
                        </label>
                        <p className="text-gray-500">حدد هذا الخيار إذا كان المنتج متاح للبيع</p>
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
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-md">
            <p className="text-gray-500">لا توجد منتجات مسجلة حالياً</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إضافة منتج جديد
            </button>
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
                    وحدة القياس
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    سعر البيع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حد إعادة الطلب
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
                {products.map((product) => (
                  <tr key={product.product_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.product_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.unit_of_measure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.selling_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.reorder_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.is_active ? (
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
                        onClick={() => toggleProductStatus(product.product_id, product.is_active)}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        {product.is_active ? 'إيقاف' : 'تنشيط'}
                      </button>
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id)}
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
