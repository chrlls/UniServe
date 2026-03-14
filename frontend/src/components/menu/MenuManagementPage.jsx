import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  FolderPen,
  FolderPlus,
  FolderX,
  LayoutGrid,
  List,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from 'framer-motion';

import menuService from '../../services/menuService';
import categoryService from '../../services/categoryService';
import MenuForm from './MenuForm';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppModal, AppModalBody, AppModalFooter } from '@/components/ui/app-modal';
import { goeyToast } from '@/components/ui/goey-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { MenuManagementSkeleton } from '@/components/skeletons/AdminSkeletons';

const KPI_CARD_CLASS = 'rounded-2xl border-0 bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-card/95 hover:shadow-md';

function getKpiCardMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.28,
      delay: 0.06 + (index * 0.045),
      ease: [0.22, 1, 0.36, 1],
    },
  };
}

function getStockState(item) {
  const stockQuantity = Number(item.stock_quantity ?? 0);

  if (stockQuantity <= 0) return 'out-of-stock';
  if (item.is_low_stock) return 'low-stock';

  const threshold = Number(item.low_stock_threshold ?? 0);
  if (threshold > 0 && stockQuantity <= threshold) return 'low-stock';

  return 'in-stock';
}

function sortItems(items, sortBy) {
  const cloned = [...items];

  cloned.sort((first, second) => {
    const firstName = String(first.name || '').toLowerCase();
    const secondName = String(second.name || '').toLowerCase();

    if (sortBy === 'name-desc') return secondName.localeCompare(firstName);
    if (sortBy === 'price-asc') return Number(first.price ?? 0) - Number(second.price ?? 0);
    if (sortBy === 'price-desc') return Number(second.price ?? 0) - Number(first.price ?? 0);

    return firstName.localeCompare(secondName);
  });

  return cloned;
}

function getMenuImageUrl(item) {
  if (item.image_url) return item.image_url;

  if (item.image_path) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8000';
    return `${baseUrl}/storage/${item.image_path}`;
  }

  return null;
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingItem, setEditingItem] = useState(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categoryError, setCategoryError] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all-statuses');
  const [stockFilter, setStockFilter] = useState('all-stock-levels');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('comfortable');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  useEffect(() => {
    setSelectedItemIds((previousIds) => previousIds.filter((id) => menuItems.some((item) => item.id === id)));
  }, [menuItems]);

  const stats = useMemo(() => {
    const totalItems = menuItems.length;
    const activeItems = menuItems.filter((item) => item.is_available).length;
    const lowStockItems = menuItems.filter((item) => getStockState(item) === 'low-stock').length;
    const outOfStockItems = menuItems.filter((item) => getStockState(item) === 'out-of-stock').length;

    return [
      {
        label: 'Total Items',
        value: totalItems,
        icon: Package,
        iconClassName: 'text-primary',
        badgeClassName: 'bg-primary/10',
      },
      {
        label: 'Active Items',
        value: activeItems,
        icon: Eye,
        iconClassName: 'text-success',
        badgeClassName: 'bg-success/10',
      },
      {
        label: 'Low Stock',
        value: lowStockItems,
        icon: AlertTriangle,
        iconClassName: 'text-warning',
        badgeClassName: 'bg-warning/15',
      },
      {
        label: 'Out of Stock',
        value: outOfStockItems,
        icon: XCircle,
        iconClassName: 'text-destructive',
        badgeClassName: 'bg-destructive/10',
      },
    ];
  }, [menuItems]);

  const categoryChips = useMemo(() => {
    const allChip = { id: 'all', name: 'All', count: menuItems.length };
    const fromCategories = categories.map((category) => ({
      id: String(category.id),
      name: category.name,
      count: Number(
        category.menu_items_count
          ?? menuItems.filter((item) => String(item.category?.id) === String(category.id)).length,
      ),
    }));

    return [allChip, ...fromCategories];
  }, [categories, menuItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const items = menuItems.filter((item) => {
      const itemName = String(item.name || '').toLowerCase();
      const itemDescription = String(item.description || '').toLowerCase();
      const categoryName = String(item.category?.name || '').toLowerCase();

      const matchesSearch =
        query.length === 0
        || itemName.includes(query)
        || itemDescription.includes(query)
        || categoryName.includes(query);

      const matchesCategory =
        selectedCategory === 'all'
        || String(item.category?.id) === String(selectedCategory);

      const matchesStatus =
        statusFilter === 'all-statuses'
        || (statusFilter === 'active' && item.is_available)
        || (statusFilter === 'inactive' && !item.is_available);

      const stockState = getStockState(item);
      const matchesStock =
        stockFilter === 'all-stock-levels'
        || (stockFilter === 'in-stock' && stockState === 'in-stock')
        || (stockFilter === 'low-stock' && stockState === 'low-stock')
        || (stockFilter === 'out-of-stock' && stockState === 'out-of-stock');

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });

    return sortItems(items, sortBy);
  }, [menuItems, searchQuery, selectedCategory, statusFilter, stockFilter, sortBy]);

  useEffect(() => {
    setSelectedItemIds((previousIds) => previousIds.filter((id) => filteredItems.some((item) => item.id === id)));
  }, [filteredItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, statusFilter, stockFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items = [1];
    const middleStart = Math.max(2, currentPage - 1);
    const middleEnd = Math.min(totalPages - 1, currentPage + 1);

    if (middleStart > 2) {
      items.push('ellipsis-start');
    }

    for (let page = middleStart; page <= middleEnd; page += 1) {
      items.push(page);
    }

    if (middleEnd < totalPages - 1) {
      items.push('ellipsis-end');
    }

    items.push(totalPages);

    return items;
  }, [currentPage, totalPages]);

  function toggleSelectAll() {
    if (paginatedItems.length === 0) return;

    setSelectedItemIds((previousIds) => {
      const pageIds = paginatedItems.map((item) => item.id);
      const allPageSelected = pageIds.every((id) => previousIds.includes(id));

      if (allPageSelected) {
        return previousIds.filter((id) => !pageIds.includes(id));
      }

      return Array.from(new Set([...previousIds, ...pageIds]));
    });
  }

  function toggleSelectItem(id) {
    setSelectedItemIds((previousIds) => {
      if (previousIds.includes(id)) {
        return previousIds.filter((itemId) => itemId !== id);
      }

      return [...previousIds, id];
    });
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategory('all');
    setStatusFilter('all-statuses');
    setStockFilter('all-stock-levels');
    setSortBy('name-asc');
    setCurrentPage(1);
  }

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
    setDeleteItemTarget(item);
  }

  async function confirmDeleteItem() {
    if (!deleteItemTarget) return;
    try {
      const result = await menuService.delete(deleteItemTarget.id);
      goeyToast.success(result.message);
      setDeleteItemTarget(null);
      fetchData();
    } catch (err) {
      goeyToast.error(err.message);
    }
  }

  async function handleToggleAvailability(item) {
    try {
      await menuService.toggleAvailability(item.id, !item.is_available);
      fetchData();
    } catch (err) {
      goeyToast.error(err.message);
    }
  }

  function openCategoryModal(category = null) {
    setEditingCategory(category);
    setCategoryForm(
      category
        ? { name: category.name, description: category.description || '' }
        : { name: '', description: '' },
    );
    setCategoryError('');
    setShowCategoryModal(true);
  }

  async function handleSaveCategory(event) {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      setCategoryError('Name is required.');
      return;
    }

    setCategorySubmitting(true);
    setCategoryError('');

    try {
      if (editingCategory?.id) {
        await categoryService.update(editingCategory.id, categoryForm);
        goeyToast.success('Category updated');
      } else {
        await categoryService.create(categoryForm);
        goeyToast.success('Category created');
      }

      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      setCategoryError(err.message);
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleDeleteCategory(category) {
    setDeleteCategoryTarget(category);
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTarget) return;
    try {
      await categoryService.delete(deleteCategoryTarget.id);
      goeyToast.success(`Category "${deleteCategoryTarget.name}" deleted`);
      setDeleteCategoryTarget(null);
      fetchData();
    } catch (err) {
      goeyToast.error(err.message);
    }
  }

  if (loading) return <MenuManagementSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={48} className="mb-4 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchData} className="mt-4" size="sm">Retry</Button>
      </div>
    );
  }

  const selectedVisibleCount = paginatedItems.filter((item) => selectedItemIds.includes(item.id)).length;
  const allVisibleSelected = paginatedItems.length > 0 && selectedVisibleCount === paginatedItems.length;
  const pageStart = filteredItems.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
  const pageEnd = Math.min(currentPage * itemsPerPage, filteredItems.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredItems.length} of {menuItems.length} items - {categories.length} categories
          </p>
        </div>
        <Button onClick={() => setEditingItem({})} className="gap-2">
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} {...getKpiCardMotion(index)}>
            <Card className={KPI_CARD_CLASS}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.badgeClassName)}>
                    <stat.icon className={cn('h-5 w-5', stat.iconClassName)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by item, category, or description"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[540px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stock Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-stock-levels">All Stock Levels</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low)</SelectItem>
                  <SelectItem value="price-desc">Price (High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-2" onClick={clearFilters}>
                <Filter className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
              <span className="text-xs text-muted-foreground">
                {filteredItems.length} results
              </span>
            </div>

            <div className="flex items-center rounded-lg bg-muted p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('comfortable')}
                className={cn(
                  'h-7 gap-1.5 rounded-md px-3',
                  viewMode === 'comfortable' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Comfortable
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('compact')}
                className={cn(
                  'h-7 gap-1.5 rounded-md px-3',
                  viewMode === 'compact' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                <List className="h-3.5 w-3.5" />
                Compact
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
              {categoryChips.map((category) => {
                const isSelected = selectedCategory === category.id;

                return (
                  <Button
                    key={category.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'h-8 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {category.name}
                    <Badge
                      variant="secondary"
                      className={cn(
                        'h-5 min-w-[20px] px-1.5 text-xs',
                        isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {category.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => openCategoryModal()}>
              <FolderPlus className="h-3.5 w-3.5" />
              Manage Categories
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Menu Items</CardTitle>
          <CardDescription>
            Operational view of item status, stock, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="w-12 pl-6">
                  <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-left">Price</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedItems.map((item) => {
                const stockState = getStockState(item);
                const isSelected = selectedItemIds.includes(item.id);
                const imageUrl = getMenuImageUrl(item);

                return (
                  <TableRow
                    key={item.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className="group border-border/20"
                  >
                    <TableCell className="pl-6">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectItem(item.id)} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                const fallback = event.currentTarget.nextElementSibling;
                                if (fallback instanceof HTMLElement) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={cn(
                              'h-full w-full items-center justify-center',
                              imageUrl ? 'hidden' : 'flex',
                            )}
                          >
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {viewMode === 'comfortable' && (
                            <p className="line-clamp-1 max-w-[240px] text-xs text-muted-foreground">
                              {item.description || 'No description provided.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {item.category?.name || '-'}
                    </TableCell>

                    <TableCell className="text-left font-medium text-primary">
                      PHP {Number(item.price ?? 0).toFixed(2)}
                    </TableCell>

                    <TableCell className="hidden text-right lg:table-cell">
                      <span
                        className={cn(
                          'font-medium',
                          stockState === 'out-of-stock' && 'text-destructive',
                          stockState === 'low-stock' && 'text-warning',
                          stockState === 'in-stock' && 'text-success',
                        )}
                      >
                        {Number(item.stock_quantity ?? 0)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {item.is_available ? (
                        <Badge className="border border-success/30 bg-success/10 text-success hover:bg-success/10">
                          <Eye className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border border-destructive/30 bg-destructive/10 text-destructive">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleToggleAvailability(item)}>
                              {item.is_available ? 'Hide Item' : 'Show Item'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteItem(item)}
                            >
                              Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredItems.length === 0 && (
                <TableRow className="border-border/20">
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No menu items match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {filteredItems.length > 0 && (
            <div className="flex flex-col items-start justify-between gap-3 border-t border-border/20 px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                Showing {pageStart}-{pageEnd} of {filteredItems.length}
              </p>

              <div className="flex items-center gap-2">
                <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="h-8 w-[92px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>

                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        text="Prev"
                        onClick={(event) => {
                          event.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage((previous) => Math.max(1, previous - 1));
                          }
                        }}
                        className={cn(
                          'h-8',
                          currentPage === 1 && 'pointer-events-none opacity-50',
                        )}
                      />
                    </PaginationItem>

                    {paginationItems.map((item, index) => {
                      if (typeof item !== 'number') {
                        return (
                          <PaginationItem key={`${item}-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            isActive={item === currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage(item);
                            }}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        text="Next"
                        onClick={(event) => {
                          event.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage((previous) => Math.min(totalPages, previous + 1));
                          }
                        }}
                        className={cn(
                          'h-8',
                          currentPage === totalPages && 'pointer-events-none opacity-50',
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* â”€â”€ Menu Item AppModal â”€â”€ */}
      <AppModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title={editingItem?.id ? 'Edit Menu Item' : 'Add Menu Item'}
        size="lg"
        isDismissable={false}
      >
        <AppModalBody>
          <MenuForm
            item={editingItem?.id ? editingItem : null}
            categories={categories}
            onSave={handleSaveItem}
            onCancel={() => setEditingItem(null)}
          />
        </AppModalBody>
      </AppModal>

      {/* â”€â”€ Category AppModal â”€â”€ */}
      <AppModal
        isOpen={showCategoryModal}
        onClose={() => { if (!categorySubmitting) setShowCategoryModal(false); }}
        title={editingCategory?.id ? 'Edit Category' : 'Add Category'}
        size="sm"
        isDismissable={false}
      >
        <AppModalBody>
          <form id="category-form" onSubmit={handleSaveCategory} className="space-y-4">
            {categoryError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {categoryError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((previous) => ({ ...previous, description: event.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Existing Categories</p>
                <Badge variant="secondary">{categories.length}</Badge>
              </div>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                        {category.menu_items_count ?? 0}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openCategoryModal(category)}
                      >
                        <FolderPen className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <FolderX className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </AppModalBody>

        <AppModalFooter>
          <Button type="button" variant="destructive" onClick={() => setShowCategoryModal(false)} disabled={categorySubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={categorySubmitting}>
            {categorySubmitting ? 'Saving...' : editingCategory?.id ? 'Update' : 'Create'}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* â”€â”€ Delete Item Alert â”€â”€ */}
      <AlertDialog open={!!deleteItemTarget} onOpenChange={(open) => !open && setDeleteItemTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className="font-semibold text-foreground">"{deleteItemTarget?.name}"</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* â”€â”€ Delete Category Alert â”€â”€ */}
      <AlertDialog open={!!deleteCategoryTarget} onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete category{' '}
              <span className="font-semibold text-foreground">"{deleteCategoryTarget?.name}"</span>?
              Items in this category may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


