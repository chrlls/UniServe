import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

export default function MenuForm({ item = null, categories, onSave, onCancel }) {
  const isEdit = item !== null && item.id;

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    is_available: true,
    stock_quantity: '',
    low_stock_threshold: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      setForm({
        category_id: item.category_id || '',
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        is_available: item.is_available ?? true,
        stock_quantity: item.stock_quantity ?? '',
        low_stock_threshold: item.low_stock_threshold ?? '',
      });
      if (item.image_path) {
        const base = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8000';
        setImagePreview(`${base}/storage/${item.image_path}`);
      }
    }
  }, [item, isEdit]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: ['Image must be less than 2MB.'] }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.category_id) errors.category_id = ['Category is required.'];
    if (!form.name.trim()) errors.name = ['Name is required.'];
    if (!form.price || Number(form.price) < 0.01) errors.price = ['Price must be at least 0.01.'];
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0) errors.stock_quantity = ['Stock is required.'];
    if (form.low_stock_threshold === '' || Number(form.low_stock_threshold) < 0) errors.low_stock_threshold = ['Threshold is required.'];
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.append('category_id', form.category_id);
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('price', form.price);
      formData.append('is_available', form.is_available ? '1' : '0');
      formData.append('stock_quantity', form.stock_quantity);
      formData.append('low_stock_threshold', form.low_stock_threshold);
      if (imageFile) formData.append('image', imageFile);

      await onSave(formData);
    } catch (err) {
      setFormError(err.message);
      if (err.errors) setFieldErrors(err.errors);
    } finally {
      setIsSubmitting(false);
    }
  }

  function FieldError({ name }) {
    const msgs = fieldErrors[name];
    if (!msgs) return null;
    return <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{msgs[0]}</p>;
  }

  const inputStyle = {
    backgroundColor: 'var(--color-input-bg)',
    border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text)',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
          {formError}
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
        <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <FieldError name="category_id" />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        <FieldError name="name" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
        <FieldError name="description" />
      </div>

      {/* Price + Availability */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Price</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} step="0.01" min="0.01" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          <FieldError name="price" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className="w-4 h-4 rounded accent-green-500" />
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>Available</span>
          </label>
        </div>
      </div>

      {/* Stock fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Stock Quantity</label>
          <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} min="0" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          <FieldError name="stock_quantity" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Low Stock Threshold</label>
          <input type="number" name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} min="0" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          <FieldError name="low_stock_threshold" />
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Image</label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ) : null}
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors"
            style={{ border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
          >
            <Upload size={16} />
            {imagePreview ? 'Change' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
        <FieldError name="image" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary-dark)' }}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
