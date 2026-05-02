<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch, user } from '$lib/api.js';
  import {
    ArrowLeft, Inbox, Clock, CheckCircle2,
    XCircle, ListOrdered, AlertCircle, StickyNote
  } from 'lucide-svelte';

  type AppStatus = 'pending' | 'approved' | 'rejected' | 'waitlist';

  interface Application {
    program_title: string;
    program_category: string;
    full_name: string;
    age: number;
    contact: string;
    barangay: string;
    created_at: string;
    notes?: string;
    status: AppStatus;
  }

  let applications = $state<Application[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    if (!$user) { goto('/login'); return; }
    try {
      applications = await apiFetch('/applications/my');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      loading = false;
    }
  });

  const statusBadge: Record<AppStatus, string> = {
    pending:  'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    waitlist: 'bg-slate-100 text-slate-600 border border-slate-200'
  };

  const statusLabel: Record<AppStatus, string> = {
    pending:  'Hinihintay ang review',
    approved: 'Ikaw ay isang beneficiary!',
    rejected: 'Hindi natanggap',
    waitlist: 'Naghihintay sa available slot'
  };
</script>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Aking Applications</h1>
      <p class="text-slate-500 text-sm">Status ng lahat ng iyong mga aplikasyon</p>
    </div>
    <a href="/"
      class="flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm px-4 py-2 rounded-lg transition">
      <ArrowLeft class="w-4 h-4" />
      Mga Programs
    </a>
  </div>

  {#if loading}
    <div class="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
      <div class="w-5 h-5 border-2 border-slate-200 rounded-full animate-spin"
        style="border-top-color: #0A1F44;"></div>
      Loading...
    </div>

  {:else if error}
    <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
      <AlertCircle class="w-4 h-4 shrink-0" />
      {error}
    </div>

  {:else if applications.length === 0}
    <div class="bg-white border border-slate-200 rounded-2xl text-center py-16 shadow-sm">
      <Inbox class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-slate-500 font-medium">Wala ka pang applications</p>
      <p class="text-slate-400 text-sm mt-1 mb-5">Mag-apply ka sa isang available na program!</p>
      <a href="/"
        class="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg transition text-white"
        style="background: #0A1F44;"
        onmouseenter={e => (e.currentTarget as HTMLElement).style.background = '#0d2756'}
        onmouseleave={e => (e.currentTarget as HTMLElement).style.background = '#0A1F44'}>
        Tingnan ang mga Programs
      </a>
    </div>

  {:else}
    <div class="grid gap-4">
      {#each applications as app}
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-900">{app.program_title}</h3>
              <p class="text-xs text-slate-400 mb-3">{app.program_category}</p>

              <div class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-600 mb-3">
                <div><span class="text-slate-400 text-xs">Pangalan</span><br />{app.full_name}</div>
                <div><span class="text-slate-400 text-xs">Edad</span><br />{app.age}</div>
                <div><span class="text-slate-400 text-xs">Contact</span><br />{app.contact}</div>
                <div><span class="text-slate-400 text-xs">Barangay</span><br />{app.barangay || '—'}</div>
              </div>

              <div class="text-xs text-slate-400">
                Na-submit: {new Date(app.created_at).toLocaleDateString('fil-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              {#if app.notes}
                <div class="mt-3 flex items-start gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-100 rounded-lg px-3 py-2">
                  <StickyNote class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Nota ng SK:</strong> {app.notes}</span>
                </div>
              {/if}
            </div>

            <!-- Status Badge -->
            <div class="shrink-0 text-right">
              <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg {statusBadge[app.status]}">
                {#if app.status === 'pending'}
                  <Clock class="w-3.5 h-3.5" />
                {:else if app.status === 'approved'}
                  <CheckCircle2 class="w-3.5 h-3.5" />
                {:else if app.status === 'rejected'}
                  <XCircle class="w-3.5 h-3.5" />
                {:else if app.status === 'waitlist'}
                  <ListOrdered class="w-3.5 h-3.5" />
                {/if}
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </span>
              <p class="text-xs text-slate-400 mt-1.5 max-w-32 leading-tight">{statusLabel[app.status]}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>