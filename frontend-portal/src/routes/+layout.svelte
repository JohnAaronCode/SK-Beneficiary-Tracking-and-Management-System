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
  <nav class="bg-blue-950 text-white shadow-lg border-b border-blue-900">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 group">
        <div class="bg-blue-800 rounded-lg p-1.5 group-hover:bg-blue-700 transition">
          <Building2 class="w-5 h-5 text-blue-200" />
        </div>
        <div>
          <div class="font-bold text-sm leading-tight tracking-wide">SK Portal</div>
          <div class="text-blue-400 text-xs">Beneficiary Tracking System</div>
        </div>
      </a>

      <div class="flex items-center gap-3">
        {#if $user}
          <span class="text-sm text-blue-300 hidden sm:block">
            Kamusta, <strong class="text-white">{$user.full_name}</strong>!
          </span>
          <a href="/my-applications"
            class="flex items-center gap-1.5 text-sm text-blue-300 hover:text-white transition px-2 py-1.5 rounded-lg hover:bg-blue-800">
            <LayoutList class="w-4 h-4" />
            <span class="hidden sm:inline">Aking Applications</span>
          </a>
          <button onclick={handleLogout}
            class="flex items-center gap-1.5 text-sm bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition border border-blue-700">
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Sign Out</span>
          </button>
        {:else}
          <a href="/login" class="text-sm text-blue-300 hover:text-white transition px-3 py-1.5">Login</a>
          <a href="/register"
            class="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg transition font-medium">
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