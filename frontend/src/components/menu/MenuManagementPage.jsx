import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle,
  FolderPlus, FolderPen, FolderX,
} from 'lucide-react';
import menuService from '../../services/menuService';
import categoryService from '../../services/categoryService';
import MenuForm from './MenuForm';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Menu item modal state
  const [editingItem, setEditingItem] = useState(null); // null=closed, {}=create, {id:…}=edit
  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categoryError, setCategoryError] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [items, cats] = await Promise.all([
        menuService.getAll(),
        categoryService.getAll(),
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ── Menu Item actions ──

  async function handleSaveItem(formData) {
    if (editingItem?.id) {
      await menuService.update(editingItem.id, formData);
    } else {
      await menuService.create(formData);
    }
    setEditingItem(null);
    fetchData();
  }

  async function handleDeleteItem(item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await menuService.delete(item.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleAvailability(item) {
    try {
      await menuService.toggleAvailability(item.id, !item.is_available);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Category actions ──

  function openCategoryModal(cat = null) {
    setEditingCategory(cat);
    setCategoryForm(cat ? { name: cat.name, description: cat.description || '' } : { name: '', description: '' });
    setCategoryError('');
    setShowCategoryModal(true);
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setCategoryError('Name is required.');
      return;
    }
    setCategorySubmitting(true);
    setCategoryError('');
    try {
      if (editingCategory?.id) {
        await categoryService.update(editingCategory.id, categoryForm);
      } else {
        await categoryService.create(categoryForm);
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      setCategoryError(err.message);
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleDeleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? Items in this category may be affected.`)) return;
    try {
      await categoryService.delete(cat.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <LoadingSpinner message="Loading menu data..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={48} className="mb-4 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchData} className="mt-4" size="sm">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {menuItems.length} items across {categories.length} categories
          </p>
        </div>
        <Button onClick={() => setEditingItem({})} className="gap-2">
          <Plus size={18} />
          Add Item
        </Button>
      </div>

      {/* ── Categories Section ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Categories</h2>
            <Button variant="ghost" size="sm" onClick={() => openCategoryModal()} className="gap-1 text-xs">
              <FolderPlus size={14} /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border bg-muted/30"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-muted-foreground">({cat.menu_items_count})</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => openCategoryModal(cat)}>
                  <FolderPen size={11} />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleDeleteCategory(cat)}>
                  <FolderX size={11} />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Menu Items Table ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.category?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      ₱{Number(item.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <span className={item.is_low_stock ? 'text-destructive' : 'text-muted-foreground'}>
                        {item.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(item)}
                        className={`gap-1 text-xs h-7 px-2 ${item.is_available ? 'text-green-600 border-green-600/30 hover:bg-green-500/10' : 'text-red-500 border-red-500/30 hover:bg-red-500/10'}`}
                      >
                        {item.is_available ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.is_available ? 'Active' : 'Hidden'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Menu Item Dialog ── */}
      <Dialog open={editingItem !== null} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <MenuForm
            item={editingItem?.id ? editingItem : null}
            categories={categories}
            onSave={handleSaveItem}
            onCancel={() => setEditingItem(null)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Category Dialog ── */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            {categoryError && (
              <div className="p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
                {categoryError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={categorySubmitting}>
                {categorySubmitting ? 'Saving...' : editingCategory?.id ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
