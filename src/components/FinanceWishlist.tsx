import React, { useState, useMemo } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import { WishlistItem, WishlistPriority, WishlistStatus } from '../types';
import {
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Edit2,
  DollarSign,
  PiggyBank,
  ShoppingBag,
  ArrowRight,
  X,
  CreditCard,
  Building2,
  Check,
  Percent,
  Calendar,
  Flame,
} from 'lucide-react';

interface FinanceWishlistProps {
  onOpenLogModal: (defaultType?: 'expense' | 'income', defaultAccount?: string) => void;
  onOpenTransferModal: (from?: string, to?: string) => void;
}

export const FinanceWishlist: React.FC<FinanceWishlistProps> = ({
  onOpenLogModal,
  onOpenTransferModal,
}) => {
  const {
    wishlist,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    allocateWishlistFunds,
    markWishlistAsPurchased,
    accountBalances,
    settings,
    formatAmount,
  } = useLifeOS();

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WishlistStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | WishlistPriority>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'price-asc' | 'price-desc' | 'progress' | 'recent'>('priority');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [allocatingItem, setAllocatingItem] = useState<WishlistItem | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<WishlistItem | null>(null);

  // Form state for Add/Edit
  const [itemTitle, setItemTitle] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemSaved, setItemSaved] = useState('');
  const [itemPriority, setItemPriority] = useState<WishlistPriority>('high');
  const [itemAccount, setItemAccount] = useState<'personal' | 'savings' | 'main'>('personal');
  const [itemUrl, setItemUrl] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Form state for Allocate Funds
  const [customAllocateAmount, setCustomAllocateAmount] = useState('');

  // Form state for Purchase confirmation
  const [shouldLogExpense, setShouldLogExpense] = useState(true);
  const [purchaseAccount, setPurchaseAccount] = useState<'personal' | 'savings' | 'main'>('personal');

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let totalSaved = 0;
    let readyCount = 0;
    let purchasedCount = 0;
    let purchasedTotal = 0;

    wishlist.forEach((item) => {
      if (item.status === 'purchased') {
        purchasedCount++;
        purchasedTotal += item.price;
      } else {
        totalValue += item.price;
        totalSaved += Math.min(item.price, item.savedAmount);
        const canAffordNow =
          item.savedAmount >= item.price ||
          accountBalances.personal.balance >= item.price;
        if (canAffordNow || item.status === 'ready') {
          readyCount++;
        }
      }
    });

    const progressPercent = totalValue > 0 ? Math.round((totalSaved / totalValue) * 100) : 0;

    return {
      totalValue,
      totalSaved,
      progressPercent,
      readyCount,
      purchasedCount,
      purchasedTotal,
      activeCount: wishlist.filter((i) => i.status !== 'purchased').length,
    };
  }, [wishlist, accountBalances.personal.balance]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return wishlist
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const pOrder: Record<WishlistPriority, number> = { high: 3, medium: 2, low: 1 };
          if (pOrder[b.priority] !== pOrder[a.priority]) {
            return pOrder[b.priority] - pOrder[a.priority];
          }
          return b.price - a.price;
        }
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'progress') {
          const progA = a.price > 0 ? a.savedAmount / a.price : 0;
          const progB = b.price > 0 ? b.savedAmount / b.price : 0;
          return progB - progA;
        }
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [wishlist, statusFilter, priorityFilter, searchQuery, sortBy]);

  // Items that user can buy immediately with Personal balance
  const immediatelyAffordableItems = useMemo(() => {
    return wishlist.filter(
      (item) =>
        item.status !== 'purchased' &&
        item.price > 0 &&
        accountBalances.personal.balance >= item.price
    );
  }, [wishlist, accountBalances.personal.balance]);

  // Open Add modal
  const handleOpenAdd = () => {
    setItemTitle('');
    setItemPrice('');
    setItemSaved('0');
    setItemPriority('high');
    setItemAccount('personal');
    setItemUrl('');
    setItemNotes('');
    setEditingItem(null);
    setIsAddOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemPrice(item.price.toString());
    setItemSaved(item.savedAmount.toString());
    setItemPriority(item.priority);
    setItemAccount(item.targetAccount || 'personal');
    setItemUrl(item.url || '');
    setItemNotes(item.notes || '');
    setIsAddOpen(true);
  };

  // Save Add/Edit
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const price = parseFloat(itemPrice) || 0;
    const saved = parseFloat(itemSaved) || 0;

    if (editingItem) {
      updateWishlistItem(editingItem.id, {
        title: itemTitle.trim(),
        price,
        savedAmount: saved,
        priority: itemPriority,
        targetAccount: itemAccount,
        url: itemUrl.trim() || undefined,
        notes: itemNotes.trim() || undefined,
      });
    } else {
      addWishlistItem({
        title: itemTitle.trim(),
        price,
        savedAmount: saved,
        priority: itemPriority,
        status: saved >= price && price > 0 ? 'ready' : 'saving',
        targetAccount: itemAccount,
        url: itemUrl.trim() || undefined,
        notes: itemNotes.trim() || undefined,
      });
    }

    setIsAddOpen(false);
    setEditingItem(null);
  };

  // Open Allocate Modal
  const handleOpenAllocate = (item: WishlistItem) => {
    setAllocatingItem(item);
    setCustomAllocateAmount('');
  };

  // Submit allocation
  const handleConfirmAllocate = (amount: number) => {
    if (!allocatingItem || amount <= 0) return;
    allocateWishlistFunds(allocatingItem.id, amount);
    setAllocatingItem(null);
  };

  // Open Purchase confirmation modal
  const handleOpenPurchase = (item: WishlistItem) => {
    setPurchasingItem(item);
    setShouldLogExpense(true);
    setPurchaseAccount(item.targetAccount || 'personal');
  };

  // Confirm purchase
  const handleConfirmPurchase = () => {
    if (!purchasingItem) return;
    markWishlistAsPurchased(purchasingItem.id, shouldLogExpense, purchaseAccount);
    setPurchasingItem(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Goals & Sinking Funds
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            Purchase Wishlist
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        {/* Card 1: Total Wishlist Value */}
        <div className="bg-slate-900/40 border border-slate-800/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[0.68rem] uppercase tracking-wider">Wishlist Value</span>
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight tabular-nums">
            {formatAmount(metrics.totalValue)}
          </div>
          <span className="text-[0.68rem] text-slate-500 mt-1 block">
            {metrics.activeCount} active target{metrics.activeCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Card 2: Total Saved */}
        <div className="bg-slate-900/40 border border-slate-800/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[0.68rem] uppercase tracking-wider">Saved</span>
            <PiggyBank className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-emerald-400 tracking-tight tabular-nums">
            {formatAmount(metrics.totalSaved)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-300 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, metrics.progressPercent)}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-slate-400 tabular-nums">{metrics.progressPercent}%</span>
          </div>
        </div>

        {/* Card 3: Ready to Buy */}
        <div className="bg-slate-900/40 border border-slate-800/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[0.68rem] uppercase tracking-wider">Affordable Now</span>
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight tabular-nums">
            {metrics.readyCount} Item{metrics.readyCount === 1 ? '' : 's'}
          </div>
          <span className="text-[0.68rem] text-slate-500 mt-1 block">
            Ready to purchase
          </span>
        </div>

        {/* Card 4: Fulfilled / Purchased */}
        <div className="bg-slate-900/40 border border-slate-800/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[0.68rem] uppercase tracking-wider">Purchased</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-300 tracking-tight tabular-nums">
            {metrics.purchasedCount} Bought
          </div>
          <span className="text-[0.68rem] text-slate-500 mt-1 block tabular-nums">
            {formatAmount(metrics.purchasedTotal)} fulfilled
          </span>
        </div>
      </div>

      {/* AFFORDABILITY ALERT BANNER */}
      {immediatelyAffordableItems.length > 0 && statusFilter !== 'purchased' && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-blue-950/30 to-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-white text-base">
                  You can afford {immediatelyAffordableItems.length} wishlist item{immediatelyAffordableItems.length === 1 ? '' : 's'} right now!
                </h3>
                <span className="px-2 py-0.5 rounded text-[0.65rem] font-mono font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                  Balance: {settings.currency}{accountBalances.personal.balance.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Your Personal Account has enough funds to buy{' '}
                <span className="text-slate-200 font-semibold">
                  "{immediatelyAffordableItems[0].title}"
                </span>{' '}
                ({settings.currency}{immediatelyAffordableItems[0].price.toFixed(2)}).
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenPurchase(immediatelyAffordableItems[0])}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-mono tracking-wide transition-all shadow-md shadow-indigo-600/25 active:scale-98 cursor-pointer shrink-0"
          >
            Buy "{immediatelyAffordableItems[0].title.slice(0, 18)}..." →
          </button>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wishlist items or notes..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500/80 pl-9 pr-8 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs self-start lg:self-auto flex-wrap font-mono">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'saving', label: 'Saving Up' },
                { id: 'ready', label: 'Ready' },
                { id: 'purchased', label: 'Purchased' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Row: Priority & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.68rem] font-mono uppercase text-slate-500 font-bold">Priority:</span>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'high', label: '🔥 High' },
                { id: 'medium', label: '⚡ Medium' },
                { id: 'low', label: '🌱 Low' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPriorityFilter(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  priorityFilter === p.id
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-[0.68rem] text-slate-500 uppercase font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none text-xs"
            >
              <option value="priority">Priority First</option>
              <option value="progress">Most Funded %</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* WISHLIST CARDS GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">No Wishlist Items Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No items match your active filters. Try clearing the search or filters.'
                : 'Start tracking things you want to buy—gadgets, tools, travel gear, or personal goals.'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Wishlist Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPurchased = item.status === 'purchased';
            const progress = item.price > 0 ? Math.min(100, Math.round((item.savedAmount / item.price) * 100)) : 0;
            const canAffordWithPersonal =
              !isPurchased && accountBalances.personal.balance >= item.price;
            const canAffordWithSavings =
              !isPurchased && accountBalances.savings.balance >= item.price;
            const isReady = progress >= 100 || canAffordWithPersonal || item.status === 'ready';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all group relative overflow-hidden ${
                  isPurchased
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    : isReady
                    ? 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-400 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Priority & Status Badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[0.62rem] font-mono font-bold uppercase ${
                          item.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : item.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.priority === 'high' ? '🔥 High' : item.priority === 'medium' ? '⚡ Medium' : '🌱 Low'}
                      </span>

                      {item.targetAccount && (
                        <span className="text-[0.62rem] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                          {item.targetAccount === 'personal'
                            ? '💳 Personal'
                            : item.targetAccount === 'savings'
                            ? '🐖 Savings'
                            : '🏦 Main'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isPurchased ? (
                        <span className="px-2 py-0.5 rounded text-[0.62rem] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Purchased</span>
                        </span>
                      ) : isReady ? (
                        <span className="px-2 py-0.5 rounded text-[0.62rem] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 animate-pulse">
                          ✨ Ready to Buy
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[0.62rem] font-mono font-bold bg-slate-800 text-slate-400">
                          Saving ({progress}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <h3 className={`font-heading font-bold text-base text-white leading-snug ${isPurchased ? 'line-through text-slate-400' : ''}`}>
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  {/* External Store Link */}
                  {item.url && (
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[0.7rem] font-mono text-blue-400 hover:text-blue-300 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Store Link</span>
                    </a>
                  )}

                  {/* Price & Saved Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-baseline justify-between mb-1.5 font-mono">
                      <div>
                        <span className="text-[0.65rem] text-slate-500 block uppercase">Price</span>
                        <span className="text-lg font-bold text-white">
                          {settings.currency}{item.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[0.65rem] text-slate-500 block uppercase">Allocated / Saved</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {settings.currency}{item.savedAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPurchased
                            ? 'bg-slate-600'
                            : progress >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                            : 'bg-gradient-to-r from-blue-600 to-emerald-500'
                        }`}
                        style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
                      />
                    </div>

                    {/* Affordability helper note */}
                    {!isPurchased && (
                      <div className="mt-2 text-[0.68rem] font-mono">
                        {canAffordWithPersonal ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span>✓</span> Available in Personal Account balance
                          </span>
                        ) : canAffordWithSavings ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <span>🐖</span> Can be covered by Savings Vault
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {settings.currency}{(item.price - item.savedAmount).toFixed(2)} more needed to fund
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isPurchased ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenPurchase(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold font-mono bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-sm active:scale-98 cursor-pointer flex items-center gap-1"
                          title="Mark as purchased and optionally record transaction"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Buy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAllocate(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Add savings towards this item"
                        >
                          + Fund
                        </button>
                      </>
                    ) : (
                      <span className="text-[0.68rem] font-mono text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Purchased {item.purchasedDate || ''}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWishlistItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT WISHLIST ITEM */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-auto flex flex-col max-h-[92dvh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 px-5 sm:px-6 py-4 bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-heading text-base font-bold text-white">
                  {editingItem ? 'Edit Wishlist Item' : 'Add Item to Wishlist'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain text-xs">
                {/* Item Title */}
                <div>
                  <label className="label-mono block mb-1 text-slate-300">Item Name / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Headphones, Ergonomic Chair"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2.5 rounded-lg text-sm text-slate-100 outline-none"
                    autoFocus
                  />
                </div>

                {/* Price & Already Saved */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-mono block mb-1 text-slate-300">Estimated Price ({settings.currency})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                        {settings.currency}
                      </span>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 pl-7 pr-3 py-2 rounded-lg text-sm text-slate-100 font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-mono block mb-1 text-slate-300">Already Saved ({settings.currency})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                        {settings.currency}
                      </span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={itemSaved}
                        onChange={(e) => setItemSaved(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 pl-7 pr-3 py-2 rounded-lg text-sm text-slate-100 font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority & Target Funding Account */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-mono block mb-1 text-slate-300">Priority Level</label>
                    <select
                      value={itemPriority}
                      onChange={(e) => setItemPriority(e.target.value as WishlistPriority)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-2.5 py-2 rounded-lg text-xs text-slate-100 outline-none"
                    >
                      <option value="high">🔥 High (Need / Planned)</option>
                      <option value="medium">⚡ Medium (Want soon)</option>
                      <option value="low">🌱 Low (Someday goal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-mono block mb-1 text-slate-300">Target Funding Account</label>
                    <select
                      value={itemAccount}
                      onChange={(e) => setItemAccount(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-2.5 py-2 rounded-lg text-xs text-slate-100 outline-none"
                    >
                      <option value="personal">💳 Personal Account</option>
                      <option value="savings">🐖 Savings Vault</option>
                      <option value="main">🏦 Main Account</option>
                    </select>
                  </div>
                </div>

                {/* External Store Link */}
                <div>
                  <label className="label-mono block mb-1 text-slate-300">Store / Product Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://amazon.com/... or store URL"
                    value={itemUrl}
                    onChange={(e) => setItemUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2 rounded-lg text-xs text-slate-100 outline-none font-mono"
                  />
                </div>

                {/* Notes / Specs */}
                <div>
                  <label className="label-mono block mb-1 text-slate-300">Notes / Reason / Specs</label>
                  <textarea
                    rows={3}
                    placeholder="Why you want this, model number, color preference, or savings schedule..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-2.5 rounded-lg text-xs text-slate-100 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 border-t border-slate-800/80 px-5 sm:px-6 py-3.5 bg-slate-900/90 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white font-mono cursor-pointer shadow-md shadow-blue-600/25 transition-all"
                >
                  {editingItem ? 'Save Changes' : 'Add to Wishlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ALLOCATE SAVINGS / FUNDS TOWARDS ITEM */}
      {allocatingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setAllocatingItem(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <PiggyBank className="w-4 h-4" />
                </span>
                <h3 className="font-heading text-base font-bold text-white">Allocate Savings</h3>
              </div>
              <button
                onClick={() => setAllocatingItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Allocating toward:</span>
              <span className="font-bold text-white text-sm block mt-0.5">{allocatingItem.title}</span>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mt-2 bg-slate-950 p-2 rounded-lg">
                <span>Already Saved: {settings.currency}{allocatingItem.savedAmount.toFixed(2)}</span>
                <span>Target: {settings.currency}{allocatingItem.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="space-y-2">
              <span className="label-mono block text-slate-400">Quick Add Presets:</span>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {[25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleConfirmAllocate(amt)}
                    className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-bold transition-colors cursor-pointer"
                  >
                    +{settings.currency}{amt}
                  </button>
                ))}
              </div>

              {/* Fund remaining in full button */}
              {allocatingItem.price > allocatingItem.savedAmount && (
                <button
                  type="button"
                  onClick={() => handleConfirmAllocate(allocatingItem.price - allocatingItem.savedAmount)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Fund Remaining {settings.currency}{(allocatingItem.price - allocatingItem.savedAmount).toFixed(2)} in Full
                </button>
              )}
            </div>

            {/* Custom input */}
            <div>
              <label className="label-mono block mb-1 text-slate-300">Or Enter Custom Amount ({settings.currency}):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Amount to add"
                  value={customAllocateAmount}
                  onChange={(e) => setCustomAllocateAmount(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2 rounded-lg text-sm text-slate-100 font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const num = parseFloat(customAllocateAmount);
                    if (num > 0) handleConfirmAllocate(num);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BUY & LOG AS EXPENSE */}
      {purchasingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setPurchasingItem(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Check className="w-4 h-4" />
                </span>
                <h3 className="font-heading text-base font-bold text-white">Confirm Purchase</h3>
              </div>
              <button
                onClick={() => setPurchasingItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Purchasing Item:</span>
              <h4 className="font-bold text-white text-base">{purchasingItem.title}</h4>
              <div className="font-mono text-xl font-bold text-emerald-400 pt-1">
                {settings.currency}{purchasingItem.price.toFixed(2)}
              </div>
            </div>

            {/* Log as expense toggle */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={shouldLogExpense}
                  onChange={(e) => setShouldLogExpense(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-xs text-white block">
                    Record Expense in Ledger
                  </span>
                  <span className="text-[0.68rem] text-slate-400 block mt-0.5">
                    Automatically subtracts {settings.currency}{purchasingItem.price.toFixed(2)} from your selected account and logs the transaction.
                  </span>
                </div>
              </label>

              {shouldLogExpense && (
                <div>
                  <label className="label-mono block mb-1 text-slate-300 text-xs">
                    Account Used for Purchase
                  </label>
                  <select
                    value={purchaseAccount}
                    onChange={(e) => setPurchaseAccount(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 px-3 py-2 rounded-lg text-xs text-slate-100 font-mono outline-none"
                  >
                    <option value="personal">💳 Personal Account (Balance: {settings.currency}{accountBalances.personal.balance.toFixed(2)})</option>
                    <option value="savings">🐖 Savings Vault (Balance: {settings.currency}{accountBalances.savings.balance.toFixed(2)})</option>
                    <option value="main">🏦 Main Account (Balance: {settings.currency}{accountBalances.main.balance.toFixed(2)})</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPurchasingItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Confirm & Mark Purchased ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
