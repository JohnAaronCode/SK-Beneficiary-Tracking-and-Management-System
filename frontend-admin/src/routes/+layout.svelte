<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user, logout } from '$lib/api.js';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
  import ClipboardList   from 'lucide-svelte/icons/clipboard-list';
  import FileText        from 'lucide-svelte/icons/file-text';
  import Users           from 'lucide-svelte/icons/users';
  import BarChart2       from 'lucide-svelte/icons/bar-chart-2';
  import Settings        from 'lucide-svelte/icons/settings';
  import LogOut          from 'lucide-svelte/icons/log-out';
  import ChevronLeft     from 'lucide-svelte/icons/chevron-left';
  import ChevronRight    from 'lucide-svelte/icons/chevron-right';
  import ShieldAlert     from 'lucide-svelte/icons/shield-alert';
  import Menu            from 'lucide-svelte/icons/menu';
  import X               from 'lucide-svelte/icons/x';

  let { children }: { children: Snippet } = $props();
  let collapsed = $state(false);
  // Mobile drawer state
  let mobileOpen = $state(false);

  const STAFF_ROUTES = ['/', '/programs', '/applications', '/beneficiaries', '/search', '/reports'];

  onMount(() => {
    const path = $page.url.pathname as string;
    if (!$user && path !== '/login') { goto('/login'); return; }
    const role = ($user as any)?.role;
    if (role === 'staff' && !STAFF_ROUTES.some(r => path === r || path.startsWith(r + '/'))) {
      goto('/');
    }
  });

  const allNav = [
    { href: '/',              icon: LayoutDashboard, label: 'Dashboard',      roles: ['admin', 'staff'] },
    { href: '/programs',      icon: ClipboardList,   label: 'Programs',       roles: ['admin', 'staff'] },
    { href: '/applications',  icon: FileText,        label: 'Applications',   roles: ['admin', 'staff'] },
    { href: '/beneficiaries', icon: Users,           label: 'Beneficiaries',  roles: ['admin', 'staff'] },
    { href: '/reports',       icon: BarChart2,       label: 'Reports',        roles: ['admin', 'staff'] },
    { href: '/settings',      icon: Settings,        label: 'Settings',       roles: ['admin'] },
  ];

  let nav = $derived(
    allNav.filter(item => item.roles.includes(($user as any)?.role ?? ''))
  );

  function handleLogout() {
    logout();
    goto('/login');
  }

  function handleNavClick() {
    // Close mobile drawer on nav click
    mobileOpen = false;
  }

  let currentRole     = $derived(($user as any)?.role     ?? '');
  let currentPosition = $derived(($user as any)?.position ?? '');

  let positionLabel = $derived(
    currentPosition
      ? currentPosition
      : currentRole === 'admin'
        ? 'SK Chairperson'
        : 'SK Staff'
  );

  let roleBadgeColor = $derived(
    currentRole === 'admin'
      ? 'bg-purple-500/20 text-purple-200'
      : 'bg-blue-500/20 text-blue-200'
  );
</script>

{#if ($page.url.pathname as string) === '/login'
  || ($page.url.pathname as string) === '/forgot-password'
  || ($page.url.pathname as string) === '/reset-password'}
  {@render children()}
{:else if $user}
  <div class="flex h-screen overflow-hidden" style="background: #F5F7FA;">

    <!-- ── Mobile Overlay backdrop ── -->
    {#if mobileOpen}
      <div
        class="fixed inset-0 z-40 bg-black/40 lg:hidden"
        role="button"
        tabindex="-1"
        onclick={() => mobileOpen = false}
        onkeydown={(e) => e.key === 'Enter' && (mobileOpen = false)}
      ></div>
    {/if}

    <!-- ── Sidebar ── -->
    <!-- Desktop: always visible, collapsible. Mobile: off-canvas drawer -->
    <aside
      class="
        fixed lg:relative inset-y-0 left-0 z-50
        flex flex-col shrink-0 transition-all duration-300 ease-in-out
        {collapsed ? 'w-17.5' : 'w-60'}
        {mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      "
      style="background: #0A1F44;"
    >
      <!-- Logo -->
      <div class="flex items-center px-4 py-4 border-b border-white/10
                  {collapsed ? 'justify-center' : 'justify-between'}">
        {#if !collapsed}
          <div class="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="SK Logo" class="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0 drop-shadow-md" />
            <span class="text-xs font-bold text-white leading-snug">
              SK Beneficiary<br/>Tracking and<br/>Management System
            </span>
          </div>
        {:else}
          <img src="/logo.png" alt="SK Logo" class="w-9 h-9 object-contain drop-shadow-md" />
        {/if}

        <div class="flex items-center gap-1">
          <!-- Mobile close button -->
          <button
            onclick={() => mobileOpen = false}
            class="p-1.5 rounded-lg transition text-white/40 hover:text-white hover:bg-white/10 shrink-0 lg:hidden"
          >
            <X size={15} />
          </button>
          <!-- Desktop collapse button -->
          {#if !collapsed}
            <button
              onclick={() => collapsed = !collapsed}
              class="p-1.5 rounded-lg transition text-white/40 hover:text-white hover:bg-white/10 shrink-0 hidden lg:block"
            >
              <ChevronLeft size={15} />
            </button>
          {/if}
        </div>
      </div>

      {#if collapsed}
        <button onclick={() => collapsed = !collapsed}
          class="mx-auto mt-3 p-1.5 rounded-lg transition text-white/40 hover:text-white hover:bg-white/10 hidden lg:block">
          <ChevronRight size={15} />
        </button>
      {/if}

      {#if !collapsed}
        <div class="px-5 pt-5 pb-1">
          <span class="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Menu</span>
        </div>
      {/if}

      <!-- Nav -->
      <nav class="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {#each nav as item}
          {@const active = ($page.url.pathname as string) === item.href}
          <a
            href={item.href}
            onclick={handleNavClick}
            title={collapsed ? item.label : ''}
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                   {collapsed ? 'justify-center' : ''}
                   {active ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}"
            style={active ? 'background: rgba(255,255,255,0.15);' : ''}
          >
            <item.icon size={18} class="shrink-0" />
            {#if !collapsed}<span>{item.label}</span>{/if}
          </a>
        {/each}
      </nav>

      <!-- User info -->
      <div class="px-3 pb-4 border-t border-white/10 pt-3 space-y-2">
        {#if !collapsed}
          <div class="px-2 pb-1">
            <span class="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Account</span>
          </div>
        {/if}

        {#if !collapsed}
          <div class="px-3 py-2 rounded-xl space-y-1" style="background: rgba(255,255,255,0.08);">
            <div class="flex items-center justify-between gap-1">
              <div class="text-[10px] text-white/40 shrink-0">Logged in as</div>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-30 text-right {roleBadgeColor}">
                {positionLabel}
              </span>
            </div>
            <div class="text-xs font-semibold text-white truncate">{($user as any).full_name}</div>
            <div class="text-[10px] text-white/30">@{($user as any).username}</div>
          </div>
        {:else}
          <div class="flex justify-center py-1">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 style="background:rgba(255,255,255,0.15);">
              {(($user as any).full_name ?? 'A').charAt(0)}
            </div>
          </div>
        {/if}

        {#if !collapsed && currentRole === 'staff'}
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] text-white/40"
               style="background:rgba(255,255,255,0.05);">
            <ShieldAlert size={12} class="shrink-0 text-white/30" />
            Settings restricted to Admin only
          </div>
        {/if}

        <button
          onclick={handleLogout}
          title={collapsed ? 'Sign out' : ''}
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition
                 text-white/60 hover:bg-red-500/20 hover:text-red-300
                 {collapsed ? 'justify-center' : ''}"
        >
          <LogOut size={16} class="shrink-0" />
          {#if !collapsed}<span>Sign out</span>{/if}
        </button>
      </div>
    </aside>

    <!-- ── Main content area ── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Mobile top bar with hamburger -->
      <header class="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white lg:hidden shrink-0">
        <button
          onclick={() => mobileOpen = true}
          class="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
        >
          <Menu size={20} />
        </button>
        <div class="flex items-center gap-2.5 min-w-0">
          <img src="/logo.png" alt="SK Logo" class="w-7 h-7 object-contain" />
          <span class="text-sm font-bold text-gray-800 truncate">SK BTMS</span>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto" style="background: #F5F7FA;">
        {@render children()}
      </main>
    </div>

  </div>
{/if}