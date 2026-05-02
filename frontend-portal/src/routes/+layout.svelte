<script>
  import '../app.css';
  import { goto } from '$app/navigation';
  import { user, logout } from '$lib/api.js';
  import { LogOut, LayoutList, Building2 } from 'lucide-svelte';

  /** @type {{ children: import('svelte').Snippet }} */
  let { children } = $props();

  function handleLogout() {
    logout();
    goto('/login');
  }
</script>

<div class="min-h-screen bg-slate-50">
  <!-- Navbar -->
  <nav class="text-white shadow-lg" style="background: #0A1F44; border-bottom: 1px solid rgba(255,255,255,0.08);">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 group">
        <div class="rounded-lg p-1.5 transition" style="background: rgba(255,255,255,0.10);">
          <Building2 class="w-5 h-5" style="color: rgba(255,255,255,0.85);" />
        </div>
        <div>
          <div class="font-bold text-sm leading-tight tracking-wide">SK Portal</div>
          <div class="text-xs" style="color: rgba(255,255,255,0.45);">Beneficiary Tracking System</div>
        </div>
      </a>

      <div class="flex items-center gap-3">
        {#if $user}
          <span class="text-sm hidden sm:block" style="color: rgba(255,255,255,0.55);">
            Kamusta, <strong class="text-white">{$user.full_name}</strong>!
          </span>
          <a href="/my-applications"
            class="flex items-center gap-1.5 text-sm transition px-2 py-1.5 rounded-lg"
            style="color: rgba(255,255,255,0.65);"
            onmouseenter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            onmouseleave={e => e.currentTarget.style.background = 'transparent'}>
            <LayoutList class="w-4 h-4" />
            <span class="hidden sm:inline">Aking Applications</span>
          </a>
          <button onclick={handleLogout}
            class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition border text-white"
            style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15);"
            onmouseenter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onmouseleave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Sign Out</span>
          </button>
        {:else}
          <a href="/login" class="text-sm transition px-3 py-1.5"
            style="color: rgba(255,255,255,0.65);">Login</a>
          <a href="/register"
            class="text-sm px-4 py-1.5 rounded-lg transition font-medium text-white"
            style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);"
            onmouseenter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onmouseleave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
            Mag-register
          </a>
        {/if}
      </div>
    </div>
  </nav>

  <!-- Page Content -->
  <main class="max-w-5xl mx-auto px-4 py-6">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="text-center text-xs text-slate-400 py-6 border-t border-slate-200 mt-10">
    Sangguniang Kabataan — Beneficiary Tracking System
  </footer>
</div>